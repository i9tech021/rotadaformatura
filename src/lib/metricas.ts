// src/lib/metricas.ts
// Telemetria mínima do app (base para produto/monetização).
// track() é fire-and-forget: nunca quebra o fluxo, nunca bloqueia a UI.
// Sem Supabase, acumula em localStorage (últimos 500) e o painel lê de lá.
import { getSupabase } from "./supabase";
import { getIdentidade } from "./auth";

export type EventoMetrica =
  | "pageview"
  | "simulado_gerado"
  | "simulado_corrigido"
  | "nota_publicada"
  | "publicacao_criada"
  | "prova_enviada"
  | "checkpoint_concluido"
  | "audio_tocado"
  | "podcast_publicado";

export interface Metrica {
  id: string;
  evento: string;
  rota: string | null;
  detalhe: Record<string, unknown> | null;
  autor_local_id: string | null;
  created_at: string;
}

const LS_KEY = "rdf:metricas:local";
const MAX_LOCAL = 500;
const PAGEVIEW_DEDUP_MS = 2000;

function rotaAtual(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.location.pathname;
  } catch {
    return null;
  }
}

function lerLocal(): Metrica[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function salvarLocal(m: Metrica): void {
  if (typeof window === "undefined") return;
  try {
    const lista = [...lerLocal(), m].slice(-MAX_LOCAL);
    localStorage.setItem(LS_KEY, JSON.stringify(lista));
  } catch {
    // ignora
  }
}

/** Dedup de pageviews: ignora mesma rota em intervalo curto. */
let ultimoPageview: { rota: string; ts: number } | null = null;

/** Registra um evento. Nunca lança exceção. */
export function track(evento: EventoMetrica, detalhe?: Record<string, unknown>): void {
  try {
    if (evento === "pageview") {
      const rota = (detalhe?.["rota"] as string | undefined) ?? null;
      const now = Date.now();
      if (rota && ultimoPageview?.rota === rota && now - ultimoPageview.ts < PAGEVIEW_DEDUP_MS) {
        return; // ignora pageview duplicado
      }
      ultimoPageview = { rota: rota ?? "", ts: now };
    }
    const ident = getIdentidade();
    const m: Metrica = {
      id: `met-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      evento,
      rota: rotaAtual(),
      detalhe: detalhe ?? null,
      autor_local_id: ident?.autorLocalId ?? null,
      created_at: new Date().toISOString(),
    };
    salvarLocal(m);
    const sb = getSupabase();
    if (sb) {
      sb.from("metricas")
        .insert({
          id: m.id,
          evento: m.evento,
          rota: m.rota,
          detalhe: m.detalhe,
          autor_local_id: m.autor_local_id,
        })
        .then(
          () => {},
          () => {},
        );
    }
  } catch {
    // telemetria nunca pode quebrar o app
  }
}

/** Lê métricas (Supabase quando configurado, senão o log local). */
export async function lerMetricas(desdeISO?: string): Promise<Metrica[]> {
  const sb = getSupabase();
  if (sb) {
    try {
      let q = sb
        .from("metricas")
        .select("id,evento,rota,detalhe,autor_local_id,created_at")
        .order("created_at", { ascending: false })
        .limit(2000);
      if (desdeISO) q = q.gte("created_at", desdeISO);
      const { data, error } = await q;
      if (!error && data) {
        return (data as Record<string, unknown>[]).map((r) => ({
          id: String(r["id"] ?? ""),
          evento: String(r["evento"] ?? ""),
          rota: (r["rota"] as string) ?? null,
          detalhe: (r["detalhe"] as Record<string, unknown>) ?? null,
          autor_local_id: (r["autor_local_id"] as string) ?? null,
          created_at: String(r["created_at"] ?? ""),
        }));
      }
    } catch {
      // cai no local
    }
  }
  const local = lerLocal();
  return desdeISO ? local.filter((m) => m.created_at >= desdeISO) : local;
}
