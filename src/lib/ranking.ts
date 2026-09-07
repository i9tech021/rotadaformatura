// src/lib/ranking.ts
// Ranking de notas da turma: combina notas publicadas (tabela `notas` com
// autor identificado) + notas de simulados corrigidos. Sem Supabase, retorna [].
import { getSupabase } from "./supabase";
import { getIdentidade } from "./auth";
import { track } from "./metricas";

export interface RankingEntry {
  autorLocalId: string;
  nome: string;
  polo: string;
  disciplinaId: string;
  etapa: string;
  nota: number;
  origem: "simulado" | "nota";
}

export interface RankingAutor {
  autor_local_id: string;
  autor_nome: string;
  autor_polo: string;
  melhor_nota: number;
  media: number;
  total: number;
}

export interface RankingFiltros {
  disciplinaId?: string | undefined;
  polo?: string | undefined;
}

type Row = Record<string, unknown>;
const num = (v: unknown): number => Number(v ?? NaN);
const str = (v: unknown, fb = ""): string => (typeof v === "string" && v ? v : fb);

async function fetchSimulados(): Promise<RankingEntry[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from("simulados_realizados")
    .select("autor_local_id,autor_nome,autor_polo,nota,disciplina_id,tipo")
    .not("nota", "is", null)
    .limit(500);
  if (error || !data) return [];
  return (data as Row[])
    .map((r) => ({
      autorLocalId: str(r["autor_local_id"], "unknown"),
      nome: str(r["autor_nome"], "Anônimo"),
      polo: str(r["autor_polo"]),
      disciplinaId: str(r["disciplina_id"]),
      etapa: str(r["tipo"]),
      nota: num(r["nota"]),
      origem: "simulado" as const,
    }))
    .filter((e) => !Number.isNaN(e.nota));
}

async function fetchNotasPublicas(): Promise<RankingEntry[]> {
  const sb = getSupabase();
  if (!sb) return [];
  // Só entram notas com autor identificado (as da calculadora privada têm autor_nome NULL).
  const { data, error } = await sb
    .from("notas")
    .select("autor_local_id,autor_nome,autor_polo,nota,disciplina_id,avaliacao_tipo")
    .not("nota", "is", null)
    .not("autor_nome", "is", null)
    .limit(500);
  if (error || !data) return [];
  return (data as Row[])
    .map((r) => ({
      autorLocalId: str(r["autor_local_id"], "unknown"),
      nome: str(r["autor_nome"], "Anônimo"),
      polo: str(r["autor_polo"]),
      disciplinaId: str(r["disciplina_id"]),
      etapa: str(r["avaliacao_tipo"]),
      nota: num(r["nota"]),
      origem: "nota" as const,
    }))
    .filter((e) => !Number.isNaN(e.nota));
}

export function agruparPorAutor(entries: RankingEntry[]): RankingAutor[] {
  const porAutor = new Map<string, { nome: string; polo: string; notas: number[] }>();
  for (const e of entries) {
    if (!porAutor.has(e.autorLocalId)) {
      porAutor.set(e.autorLocalId, { nome: e.nome, polo: e.polo, notas: [] });
    }
    porAutor.get(e.autorLocalId)!.notas.push(e.nota);
  }
  return Array.from(porAutor.entries())
    .map(([id, { nome, polo, notas }]) => ({
      autor_local_id: id,
      autor_nome: nome,
      autor_polo: polo,
      melhor_nota: Math.max(...notas),
      media: notas.reduce((a, b) => a + b, 0) / notas.length,
      total: notas.length,
    }))
    .sort((a, b) => b.melhor_nota - a.melhor_nota || b.media - a.media)
    .slice(0, 10);
}

/** Ranking top 10 com filtros opcionais (combinando simulados + notas publicadas). */
export async function getRanking(filtros: RankingFiltros = {}): Promise<RankingAutor[]> {
  const [sims, notas] = await Promise.all([fetchSimulados(), fetchNotasPublicas()]);
  let entries = [...sims, ...notas];
  if (filtros.disciplinaId)
    entries = entries.filter((e) => e.disciplinaId === filtros.disciplinaId);
  if (filtros.polo) entries = entries.filter((e) => e.polo === filtros.polo);
  return agruparPorAutor(entries);
}

/** Polos distintos com notas no ranking (para o filtro). */
export async function listarPolosRanking(): Promise<string[]> {
  const [sims, notas] = await Promise.all([fetchSimulados(), fetchNotasPublicas()]);
  const set = new Set<string>();
  for (const e of [...sims, ...notas]) if (e.polo) set.add(e.polo);
  return [...set].sort((a, b) => a.localeCompare(b, "pt-BR"));
}

/** Publica uma nota no ranking (usa identidade local). */
export async function publicarNotaRanking(input: {
  disciplinaId: string;
  tipo: string;
  nota: number;
}): Promise<{ ok: boolean; error?: string }> {
  const sb = getSupabase();
  if (!sb) return { ok: false, error: "Banco não configurado." };
  const ident = getIdentidade();
  const id = `nota-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const { error } = await sb.from("notas").insert({
    id,
    student_id: ident?.autorLocalId ?? "unknown",
    disciplina_id: input.disciplinaId,
    avaliacao_tipo: input.tipo,
    nota: input.nota,
    autor_local_id: ident?.autorLocalId ?? "unknown",
    autor_nome: ident?.nome ?? "Anônimo",
    autor_polo: ident?.polo ?? "",
  });
  if (error) return { ok: false, error: error.message };
  track("nota_publicada", { disciplinaId: input.disciplinaId, tipo: input.tipo, nota: input.nota });
  return { ok: true };
}
