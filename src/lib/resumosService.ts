// src/lib/resumosService.ts
// Resumos Colaborativos em tempo real (Supabase), com fallback local.
import { getSupabase, isSupabaseConfigured } from "./supabase";
import { getIdentidade } from "./auth";
import { track } from "./metricas";

export interface ResumoCompartilhado {
  id: string;
  titulo: string;
  conteudo: string;
  disciplinaId: string;
  disciplinaNome: string;
  autor: string;
  polo: string;
  dataCriacao: string;
  votosUteis: number;
  visualizacoes: number;
}

type Row = Record<string, unknown>;
const str = (v: unknown, fb = ""): string => (typeof v === "string" && v ? v : fb);
const num = (v: unknown): number => Number(v ?? 0);

function rowToResumo(r: Row): ResumoCompartilhado {
  return {
    id: str(r["id"]),
    titulo: str(r["titulo"]),
    conteudo: str(r["conteudo"]),
    disciplinaId: str(r["disciplina_id"]),
    disciplinaNome: str(r["disciplina_nome"]),
    autor: str(r["autor_nome"], "Anônimo"),
    polo: str(r["autor_polo"]),
    dataCriacao: typeof r["criado_em"] === "string" ? (r["criado_em"] as string).slice(0, 10) : "",
    votosUteis: num(r["votos_uteis"]),
    visualizacoes: num(r["visualizacoes"]),
  };
}

export async function listResumos(): Promise<ResumoCompartilhado[] | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from("resumos")
    .select("*")
    .order("criado_em", { ascending: false })
    .limit(200);
  if (error || !data) return null;
  return (data as Row[]).map(rowToResumo);
}

export async function enviarResumo(input: {
  titulo: string;
  conteudo: string;
  disciplinaId: string;
  disciplinaNome: string;
}): Promise<{ ok: boolean; error?: string; resumo?: ResumoCompartilhado }> {
  const ident = getIdentidade();
  const resumo: ResumoCompartilhado = {
    id: `rs-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    titulo: input.titulo.trim(),
    conteudo: input.conteudo.trim(),
    disciplinaId: input.disciplinaId,
    disciplinaNome: input.disciplinaNome,
    autor: ident?.nome ?? "Anônimo",
    polo: ident?.polo ?? "",
    dataCriacao: new Date().toISOString().slice(0, 10),
    votosUteis: 0,
    visualizacoes: 0,
  };
  const sb = getSupabase();
  if (!sb) return { ok: true, resumo };
  const { error } = await sb.from("resumos").insert({
    id: resumo.id,
    titulo: resumo.titulo,
    conteudo: resumo.conteudo,
    disciplina_id: resumo.disciplinaId,
    disciplina_nome: resumo.disciplinaNome,
    autor_nome: resumo.autor,
    autor_polo: resumo.polo,
    autor_local_id: ident?.autorLocalId ?? null,
  });
  if (error) return { ok: false, error: error.message };
  track("resumo_enviado", { disciplinaId: input.disciplinaId });
  return { ok: true, resumo };
}

export async function votarResumo(id: string, atual: number): Promise<number> {
  const sb = getSupabase();
  if (!sb) return atual + 1;
  const { error } = await sb
    .from("resumos")
    .update({ votos_uteis: atual + 1 })
    .eq("id", id);
  return error ? atual : atual + 1;
}

/** Soma +1 visualização (best-effort, sem travar a leitura). */
export async function registrarLeitura(id: string, atual: number): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  try {
    await sb
      .from("resumos")
      .update({ visualizacoes: atual + 1 })
      .eq("id", id);
  } catch {
    // best-effort
  }
}

export function subscribeResumos(onChange: () => void): () => void {
  const sb = getSupabase();
  if (!sb) return () => {};
  const ch = sb
    .channel("rdf-resumos")
    .on("postgres_changes", { event: "*", schema: "public", table: "resumos" }, () => onChange())
    .subscribe();
  return () => {
    sb.removeChannel(ch);
  };
}

export { isSupabaseConfigured };
