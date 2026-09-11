// src/lib/desafioService.ts
// Desafio da Semana coletivo: cada tentativa é salva e o ranking
// é montado com o melhor resultado de cada aluno, em tempo real.
import { getSupabase, isSupabaseConfigured } from "./supabase";
import { getIdentidade } from "./auth";
import { track } from "./metricas";

export interface DesafioResultado {
  id: string;
  desafioId: string;
  autorLocalId: string;
  autorNome: string;
  autorPolo: string;
  acertos: number;
  total: number;
  tempoSeg: number;
  criadoEm: string;
}

export interface DesafioRankingEntry {
  posicao: number;
  nome: string;
  polo: string;
  acertos: number;
  tempoSeg: number;
}

type Row = Record<string, unknown>;
const str = (v: unknown, fb = ""): string => (typeof v === "string" && v ? v : fb);
const num = (v: unknown): number => Number(v ?? 0);

function rowToResultado(r: Row): DesafioResultado {
  return {
    id: str(r["id"]),
    desafioId: str(r["desafio_id"], "atual"),
    autorLocalId: str(r["autor_local_id"], "unknown"),
    autorNome: str(r["autor_nome"], "Anônimo"),
    autorPolo: str(r["autor_polo"]),
    acertos: num(r["acertos"]),
    total: num(r["total"]),
    tempoSeg: num(r["tempo_seg"]),
    criadoEm: typeof r["criado_em"] === "string" ? (r["criado_em"] as string) : "",
  };
}

/** Todas as tentativas do desafio (nuvem) ou null quando offline. */
export async function listDesafioResultados(
  desafioId = "atual",
): Promise<DesafioResultado[] | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from("desafio_resultados")
    .select("*")
    .eq("desafio_id", desafioId)
    .order("acertos", { ascending: false })
    .order("tempo_seg", { ascending: true })
    .limit(200);
  if (error || !data) return null;
  return (data as Row[]).map(rowToResultado);
}

/** Ranking: melhor tentativa de cada aluno (mais acertos, depois mais rápido). */
export function montarRankingDesafio(
  resultados: DesafioResultado[],
  top = 5,
): DesafioRankingEntry[] {
  const melhorPorAutor = new Map<string, DesafioResultado>();
  for (const r of resultados) {
    const atual = melhorPorAutor.get(r.autorLocalId);
    if (
      !atual ||
      r.acertos > atual.acertos ||
      (r.acertos === atual.acertos && r.tempoSeg < atual.tempoSeg)
    ) {
      melhorPorAutor.set(r.autorLocalId, r);
    }
  }
  return [...melhorPorAutor.values()]
    .sort((a, b) => b.acertos - a.acertos || a.tempoSeg - b.tempoSeg)
    .slice(0, top)
    .map((r, i) => ({
      posicao: i + 1,
      nome: r.autorNome,
      polo: r.autorPolo,
      acertos: r.acertos,
      tempoSeg: r.tempoSeg,
    }));
}

/** Quantos alunos distintos já participaram. */
export function contarParticipantes(resultados: DesafioResultado[]): number {
  return new Set(resultados.map((r) => r.autorLocalId)).size;
}

/** Salva a tentativa do aluno atual (best-effort). */
export async function enviarResultadoDesafio(input: {
  desafioId?: string;
  acertos: number;
  total: number;
  tempoSeg: number;
}): Promise<{ ok: boolean }> {
  const sb = getSupabase();
  if (!sb) return { ok: false };
  try {
    const ident = getIdentidade();
    const { error } = await sb.from("desafio_resultados").insert({
      id: `dz-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      desafio_id: input.desafioId ?? "atual",
      autor_local_id: ident?.autorLocalId ?? "unknown",
      autor_nome: ident?.nome ?? "Anônimo",
      autor_polo: ident?.polo ?? "",
      acertos: input.acertos,
      total: input.total,
      tempo_seg: input.tempoSeg,
    });
    if (error) return { ok: false };
    track("desafio_concluido", { acertos: input.acertos, total: input.total });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export function subscribeDesafio(onChange: () => void): () => void {
  const sb = getSupabase();
  if (!sb) return () => {};
  const ch = sb
    .channel("rdf-desafio")
    .on("postgres_changes", { event: "*", schema: "public", table: "desafio_resultados" }, () =>
      onChange(),
    )
    .subscribe();
  return () => {
    sb.removeChannel(ch);
  };
}

export function formatarTempoSeg(totalSeg: number): string {
  const m = Math.floor(totalSeg / 60);
  const s = totalSeg % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export { isSupabaseConfigured };
