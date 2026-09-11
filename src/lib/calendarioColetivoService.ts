// src/lib/calendarioColetivoService.ts
// Calendário Coletivo em tempo real: eventos oficiais + contribuições
// da turma, todos visíveis para todos via Realtime.
import { getSupabase, isSupabaseConfigured } from "./supabase";
import { getIdentidade } from "./auth";
import { track } from "./metricas";

export type TipoEventoColetivo = "prova" | "prazo" | "evento" | "formatura" | "aula";

export interface EventoColetivo {
  id: string;
  titulo: string;
  descricao: string;
  data: string;
  hora?: string;
  tipo: TipoEventoColetivo;
  criadoPor: string;
}

const TIPOS_VALIDOS: TipoEventoColetivo[] = ["prova", "prazo", "evento", "formatura", "aula"];

type Row = Record<string, unknown>;
const str = (v: unknown, fb = ""): string => (typeof v === "string" && v ? v : fb);

function rowToEvento(r: Row): EventoColetivo {
  const tipo = str(r["tipo"], "evento");
  const ev: EventoColetivo = {
    id: str(r["id"]),
    titulo: str(r["titulo"]),
    descricao: str(r["descricao"]),
    data: str(r["data"]),
    tipo: (TIPOS_VALIDOS as string[]).includes(tipo) ? (tipo as TipoEventoColetivo) : "evento",
    criadoPor: str(r["criado_por"], "Turma"),
  };
  if (typeof r["hora"] === "string" && r["hora"]) ev.hora = r["hora"];
  return ev;
}

export async function listEventosColetivos(): Promise<EventoColetivo[] | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from("eventos_coletivos")
    .select("*")
    .order("data", { ascending: true })
    .limit(200);
  if (error || !data) return null;
  return (data as Row[]).map(rowToEvento);
}

export async function sugerirEventoColetivo(input: {
  titulo: string;
  descricao: string;
  data: string;
  hora?: string | undefined;
  tipo: TipoEventoColetivo;
}): Promise<{ ok: boolean; error?: string }> {
  const ident = getIdentidade();
  const sb = getSupabase();
  if (!sb) return { ok: false, error: "Banco não configurado." };
  const { error } = await sb.from("eventos_coletivos").insert({
    id: `ec-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    titulo: input.titulo.trim(),
    descricao: input.descricao.trim(),
    data: input.data,
    hora: input.hora || null,
    tipo: input.tipo,
    criado_por: ident?.nome ?? "Turma",
  });
  if (error) return { ok: false, error: error.message };
  track("evento_coletivo_sugerido", { tipo: input.tipo });
  return { ok: true };
}

export function subscribeEventosColetivos(onChange: () => void): () => void {
  const sb = getSupabase();
  if (!sb) return () => {};
  const ch = sb
    .channel("rdf-eventos-coletivos")
    .on("postgres_changes", { event: "*", schema: "public", table: "eventos_coletivos" }, () =>
      onChange(),
    )
    .subscribe();
  return () => {
    sb.removeChannel(ch);
  };
}

export { isSupabaseConfigured };
