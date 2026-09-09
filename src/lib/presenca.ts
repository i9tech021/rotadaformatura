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
// Número APARENTE de online (fake, por enquanto).
// Varia por horário + faixa de 10 min, para parecer movimento natural.
// Depois trocamos por getOnline().length (real).
// ============================================================
function pseudoAleatorio(seed: number): number {
  let t = seed + 0x6d2b79f5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** Quantidade aparente de pessoas online (dinâmica por horário). */
export function getOnlineFake(agora: Date = new Date()): number {
  const h = agora.getHours();
  let base: number, variacao: number;
  if (h >= 0 && h < 6) {
    base = 2;
    variacao = 3; // madrugada: 2-4
  } else if (h >= 6 && h < 12) {
    base = 4;
    variacao = 4; // manhã: 4-7
  } else if (h >= 12 && h < 18) {
    base = 6;
    variacao = 5; // tarde: 6-10
  } else {
    base = 7;
    variacao = 6; // noite (pico): 7-12
  }
  // muda sozinho a cada 10 minutos
  const seed = Math.floor(agora.getTime() / (10 * 60 * 1000));
  return base + Math.floor(pseudoAleatorio(seed) * variacao);
}
