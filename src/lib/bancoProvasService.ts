// src/lib/bancoProvasService.ts
// Banco de Provas Anteriores: Supabase Realtime quando configurado,
// senão fallback local (localStorage). O que um aluno envia, todos veem.
import { getSupabase, isSupabaseConfigured } from "./supabase";
import { getIdentidade } from "./auth";
import { track } from "./metricas";

export interface ProvaCompartilhada {
  id: string;
  disciplinaId: string;
  disciplinaNome: string;
  tipo: string;
  semestre: string;
  autor: string;
  polo: string;
  conteudo: string;
  dataEnvio: string;
  avaliacoes: number;
}

type Row = Record<string, unknown>;
const str = (v: unknown, fb = ""): string => (typeof v === "string" && v ? v : fb);
const num = (v: unknown): number => Number(v ?? 0);

function rowToProva(r: Row): ProvaCompartilhada {
  return {
    id: str(r["id"]),
    disciplinaId: str(r["disciplina_id"]),
    disciplinaNome: str(r["disciplina_nome"]),
    tipo: str(r["tipo"], "AD1"),
    semestre: str(r["semestre"]),
    autor: str(r["autor_nome"], "Anônimo"),
    polo: str(r["autor_polo"]),
    conteudo: str(r["conteudo"]),
    dataEnvio: typeof r["criado_em"] === "string" ? (r["criado_em"] as string).slice(0, 10) : "",
    avaliacoes: num(r["avaliacoes"]),
  };
}

/** Lista provas da nuvem. Retorna null se Supabase não configurado/falhou. */
export async function listBancoProvas(): Promise<ProvaCompartilhada[] | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from("banco_provas")
    .select("*")
    .order("criado_em", { ascending: false })
    .limit(200);
  if (error || !data) return null;
  return (data as Row[]).map(rowToProva);
}

/** Envia prova para a nuvem (ou guarda local quando offline). */
export async function enviarBancoProva(input: {
  disciplinaId: string;
  disciplinaNome: string;
  tipo: string;
  semestre: string;
  conteudo: string;
}): Promise<{ ok: boolean; error?: string; prova?: ProvaCompartilhada }> {
  const ident = getIdentidade();
  const prova: ProvaCompartilhada = {
    id: `bp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    disciplinaId: input.disciplinaId,
    disciplinaNome: input.disciplinaNome,
    tipo: input.tipo,
    semestre: input.semestre,
    autor: ident?.nome ?? "Anônimo",
    polo: ident?.polo ?? "",
    conteudo: input.conteudo.trim(),
    dataEnvio: new Date().toISOString().slice(0, 10),
    avaliacoes: 0,
  };
  const sb = getSupabase();
  if (!sb) return { ok: true, prova };
  const { error } = await sb.from("banco_provas").insert({
    id: prova.id,
    disciplina_id: prova.disciplinaId,
    disciplina_nome: prova.disciplinaNome,
    tipo: prova.tipo,
    semestre: prova.semestre,
    conteudo: prova.conteudo,
    autor_nome: prova.autor,
    autor_polo: prova.polo,
    autor_local_id: ident?.autorLocalId ?? null,
  });
  if (error) return { ok: false, error: error.message };
  track("banco_prova_enviada", { disciplinaId: input.disciplinaId, tipo: input.tipo });
  return { ok: true, prova };
}

/** Vota "útil" numa prova (incrementa contador na nuvem). */
export async function votarBancoProva(id: string, atual: number): Promise<number> {
  const sb = getSupabase();
  if (!sb) return atual + 1;
  const { error } = await sb
    .from("banco_provas")
    .update({ avaliacoes: atual + 1 })
    .eq("id", id);
  return error ? atual : atual + 1;
}

/** Realtime: qualquer insert/update/delete recarrega a lista. */
export function subscribeBancoProvas(onChange: () => void): () => void {
  const sb = getSupabase();
  if (!sb) return () => {};
  const ch = sb
    .channel("rdf-banco-provas")
    .on("postgres_changes", { event: "*", schema: "public", table: "banco_provas" }, () =>
      onChange(),
    )
    .subscribe();
  return () => {
    sb.removeChannel(ch);
  };
}

export { isSupabaseConfigured };
