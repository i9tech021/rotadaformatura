// src/lib/presenca.ts
// "Quem está online" via Supabase Realtime Presence (efêmero — sem tabela).
// Cada aba aberta anuncia presença com id estável do navegador; o canal
// sincroniza a lista de presentes em tempo real para todos.
import { getSupabase } from "./supabase";
import { getIdentidade } from "./auth";

export interface PessoaOnline {
  key: string;
  nome: string;
  polo: string;
  rota: string;
  online_at: string;
}

const LS_ANON = "rdf:anon-id";

function idEstavel(): string {
  try {
    const ident = getIdentidade();
    if (ident?.autorLocalId) return ident.autorLocalId;
    let anon = localStorage.getItem(LS_ANON);
    if (!anon) {
      anon = `anon-${crypto.randomUUID()}`;
      localStorage.setItem(LS_ANON, anon);
    }
    return anon;
  } catch {
    return `anon-${Math.random().toString(36).slice(2)}`;
  }
}

function rotaAtual(): string {
  try {
    return window.location.pathname;
  } catch {
    return "/";
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let channel: any = null;
let lista: PessoaOnline[] = [];
const ouvintes: Set<() => void> = new Set();

function avisar() {
  for (const cb of ouvintes) cb();
}

function lerEstado() {
  try {
    const estado = channel.presenceState() as Record<string, Array<Record<string, unknown>>>;
    lista = Object.entries(estado).flatMap(([key, metas]) =>
      metas.map((m) => ({
        key,
        nome: String(m["nome"] ?? "Estudante"),
        polo: String(m["polo"] ?? ""),
        rota: String(m["rota"] ?? "/"),
        online_at: String(m["online_at"] ?? ""),
      })),
    );
  } catch {
    lista = [];
  }
  avisar();
}

/** Inicia o anúncio de presença (idempotente). Retorna função de parada. */
export function iniciarPresenca(): () => void {
  if (typeof window === "undefined") return () => {};
  const sb = getSupabase();
  if (!sb || channel) return () => {};
  try {
    channel = sb.channel("online", { config: { presence: { key: idEstavel() } } });
    channel.on("presence", { event: "sync" }, lerEstado);
    channel.on("presence", { event: "join" }, lerEstado);
    channel.on("presence", { event: "leave" }, lerEstado);
    channel.subscribe(async (status: string) => {
      if (status === "SUBSCRIBED") {
        const ident = getIdentidade();
        await channel.track({
          nome: ident?.nome ?? "Estudante",
          polo: ident?.polo ?? "",
          rota: rotaAtual(),
          online_at: new Date().toISOString(),
        });
        lerEstado();
      }
    });
  } catch {
    channel = null;
  }
  return () => {
    try {
      if (channel) sb.removeChannel(channel);
    } catch {
      // ignora
    }
    channel = null;
    lista = [];
  };
}

/** Atualiza a rota atual no anúncio de presença. */
export function atualizarRotaPresenca(rota: string): void {
  if (!channel) return;
  try {
    const ident = getIdentidade();
    channel.track({
      nome: ident?.nome ?? "Estudante",
      polo: ident?.polo ?? "",
      rota,
      online_at: new Date().toISOString(),
    });
  } catch {
    // ignora
  }
}

export function subscribePresenca(cb: () => void): () => void {
  ouvintes.add(cb);
  return () => {
    ouvintes.delete(cb);
  };
}

export function getOnline(): PessoaOnline[] {
  return [...lista];
}

// ============================================================
// Contagem REAL de online via Presence.
// Retorna a lista real quando Supabase está conectado.
// Fallback local: 1 (só você) quando Supabase não configurado.
// ============================================================
export function getOnlineCount(): number {
  const real = getOnline();
  if (real.length > 0) return real.length;
  if (typeof window === "undefined") return 0;
  // Sem Supabase: só você está aqui
  return 1;
}
