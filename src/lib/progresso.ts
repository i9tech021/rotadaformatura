// src/lib/progresso.ts
// Progresso real por disciplina: combina aulas concluídas (checkpoints, 60%)
// com etapas de prova concluídas — nota lançada OU simulado realizado (40%).
import { loadCheckpoints } from "./checkpoints";
import { loadNotas } from "./gradesService";
import { listarHistorico } from "./simuladoService";
import { getIdentidade } from "./auth";
import type { Disciplina } from "@/data/disciplines";

const ETAPAS_PROVA = ["AD1", "AD2", "AP1", "AP2", "AP3"];
const PESO_AULAS = 0.6;
const PESO_PROVAS = 0.4;

export interface ProgressoDisciplina {
  pct: number; // 0-100 combinado
  aulasFeitas: number;
  totalAulas: number;
  etapasFeitas: number;
  totalEtapas: number;
}

export async function getProgressoDisciplina(d: Disciplina): Promise<ProgressoDisciplina> {
  const totalAulas = d.aulas.length;
  let aulasFeitas = 0;
  try {
    const cps = await loadCheckpoints(d.id);
    aulasFeitas = d.aulas.filter((a) => cps[a.id]).length;
  } catch {
    aulasFeitas = 0;
  }

  const etapas = [
    ...new Set(d.avaliacoes.map((a) => a.tipo).filter((t) => ETAPAS_PROVA.includes(t))),
  ];
  let etapasFeitas = 0;
  if (etapas.length > 0) {
    try {
      const notas = await loadNotas(d.id);
      const comNota = new Set(notas.filter((n) => n.nota != null).map((n) => n.avaliacaoTipo));
      const comSimulado = new Set<string>();
      const ident = getIdentidade();
      if (ident) {
        const hist = await listarHistorico(ident.autorLocalId);
        for (const h of hist) {
          if (h.disciplina_id === d.id) comSimulado.add(h.tipo);
        }
      }
      etapasFeitas = etapas.filter((t) => comNota.has(t) || comSimulado.has(t)).length;
    } catch {
      etapasFeitas = 0;
    }
  }

  const pctAulas = totalAulas > 0 ? aulasFeitas / totalAulas : 0;
  const pctProvas = etapas.length > 0 ? etapasFeitas / etapas.length : 0;
  const pct = Math.round(pctAulas * PESO_AULAS * 100 + pctProvas * PESO_PROVAS * 100);
  return { pct, aulasFeitas, totalAulas, etapasFeitas, totalEtapas: etapas.length };
}

/** Progresso de todas as disciplinas em paralelo. */
export async function getProgressoTodas(
  disciplinas: Disciplina[],
): Promise<Record<string, ProgressoDisciplina>> {
  const pares = await Promise.all(
    disciplinas.map(async (d) => [d.id, await getProgressoDisciplina(d)] as const),
  );
  const out: Record<string, ProgressoDisciplina> = {};
  for (const [id, p] of pares) out[id] = p;
  return out;
}
