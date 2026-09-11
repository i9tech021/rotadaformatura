// src/lib/feedService.ts
// Feed de Atividade em tempo real: cada ação de um aluno (estudo, simulado,
// envio, conquista) é registrada e aparece para TODOS via Realtime.
import { getSupabase, isSupabaseConfigured } from "./supabase";
import { getIdentidade } from "./auth";

export type TipoAtividade = "estudo" | "simulado" | "conquista" | "upload" | "contribuicao";

export interface AtividadeCompartilhada {
  id: string;
  usuario: string;
  polo: string;
  acao: string;
  disciplinaId: string;
  tipo: TipoAtividade;
  criadoEm: string;
}

type Row = Record<string, unknown>;
const str = (v: unknown, fb = ""): string => (typeof v === "string" && v ? v : fb);

const TIPOS_VALIDOS: TipoAtividade[] = [
  "estudo",
  "simulado",
  "conquista",
  "upload",
  "contribuicao",
];

function rowToAtividade(r: Row): AtividadeCompartilhada {
  const tipo = str(r["tipo"], "estudo");
  return {
    id: str(r["id"]),
    usuario: str(r["usuario"], "Aluno"),
    polo: str(r["polo"]),
    acao: str(r["acao"]),
    disciplinaId: str(r["disciplina_id"]),
    tipo: (TIPOS_VALIDOS as string[]).includes(tipo) ? (tipo as TipoAtividade) : "estudo",
    criadoEm: typeof r["criado_em"] === "string" ? (r["criado_em"] as string) : "",
  };
}

/** Últimas atividades da turma (nuvem) ou null quando offline. */
export async function listAtividades(limite = 30): Promise<AtividadeCompartilhada[] | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from("atividades")
    .select("*")
    .order("criado_em", { ascending: false })
    .limit(limite);
  if (error || !data) return null;
  return (data as Row[]).map(rowToAtividade);
}

/**
 * Registra uma ação do aluno atual no feed coletivo.
 * Best-effort: nunca quebra o fluxo de quem chamou.
 */
export async function registrarAtividade(input: {
  acao: string;
  disciplinaId?: string;
  tipo: TipoAtividade;
}): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  try {
    const ident = getIdentidade();
    await sb.from("atividades").insert({
      id: `at-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      usuario: ident?.nome ?? "Aluno",
      polo: ident?.polo ?? "",
      acao: input.acao,
      disciplina_id: input.disciplinaId ?? "",
      tipo: input.tipo,
    });
  } catch {
    // best-effort
  }
}

/** Realtime: novas atividades chegam sem refresh. */
export function subscribeAtividades(onAtividade: (a: AtividadeCompartilhada) => void): () => void {
  const sb = getSupabase();
  if (!sb) return () => {};
  const ch = sb
    .channel("rdf-atividades")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "atividades" }, (payload) =>
      onAtividade(rowToAtividade(payload.new as Row)),
    )
    .subscribe();
  return () => {
    sb.removeChannel(ch);
  };
}

/** "há X min" a partir do ISO. */
export function tempoRelativo(iso: string): string {
  if (!iso) return "agora";
  const diff = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(diff) || diff < 60_000) return "agora";
  const min = Math.floor(diff / 60_000);
  if (min < 60) return `${min}min atrás`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h atrás`;
  return new Date(iso).toLocaleDateString("pt-BR");
}

export { isSupabaseConfigured };
