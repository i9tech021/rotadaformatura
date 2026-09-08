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
  pctEsperado: number; // progresso esperado pelo cronograma
  semanaAtual: number;
}

// ============================================================
// Progresso esperado: calcula com base na semana atual do semestre
// Semana 1 começa em 27/07/2026. Cada disciplina tem aulas com
// semanaEstudo que indica quando deveriam ser feitas.
// ============================================================
const DATA_INICIO_SEMESTRE = new Date("2026-07-27");
const TOTAL_SEMANAS = 14;

export function getSemanaAtual(): number {
  const agora = new Date();
  const diffMs = agora.getTime() - DATA_INICIO_SEMESTRE.getTime();
  const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return Math.min(Math.max(1, Math.floor(diffDias / 7) + 1), TOTAL_SEMANAS);
}

export function getProgressoEsperado(disciplina: Disciplina): number {
  const semanaAtual = getSemanaAtual();
  if (disciplina.aulas.length === 0) return 0;

  // Conta quantas aulas deveriam estar concluídas baseado na semanaEstudo
  const aulasEsperadas = disciplina.aulas.filter(
    (a) => a.semanaEstudo <= semanaAtual,
  ).length;

  // Progresso esperado = aulas que deveriam estar feitas / total
  // Mais 10% bônus se está na semana da prova (AD1 ou AP1)
  const pctAulas = Math.round((aulasEsperadas / disciplina.aulas.length) * 100);

  // Adiciona bônus se há prova esta semana
  const temProvaEstaSemana = disciplina.avaliacoes.some((av) => {
    if (!av.dataPresencial && !av.dataInicio) return false;
    const dataProva = new Date(av.dataPresencial || av.dataInicio || "");
    const semanaProva = Math.floor(
      (dataProva.getTime() - DATA_INICIO_SEMESTRE.getTime()) / (7 * 24 * 60 * 60 * 1000),
    ) + 1;
    return semanaProva === semanaAtual;
  });

  return Math.min(100, pctAulas + (temProvaEstaSemana ? 5 : 0));
}

export async function getProgressoDisciplina(d: Disciplina): Promise<ProgressoDisciplina> {
  const totalAulas = d.aulas.length;
  const semanaAtual = getSemanaAtual();
  let aulasFeitas = 0;
  let hasCheckpoints = false;
  try {
    const cps = await loadCheckpoints(d.id);
    aulasFeitas = d.aulas.filter((a) => cps[a.id]).length;
    hasCheckpoints = Object.keys(cps).length > 0;
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

  // Se não há checkpoints, usa progresso esperado como baseline
  const pctEsperado = getProgressoEsperado(d);
  const pctAulas = totalAulas > 0 ? aulasFeitas / totalAulas : 0;
  const pctProvas = etapas.length > 0 ? etapasFeitas / etapas.length : 0;
  const pctReal = Math.round(pctAulas * PESO_AULAS * 100 + pctProvas * PESO_PROVAS * 100);

  // Usa o maior entre real e esperado (nunca mostra abaixo do esperado)
  const pct = hasCheckpoints || etapasFeitas > 0
    ? Math.max(pctReal, Math.round(pctEsperado * 0.5))
    : Math.round(pctEsperado * 0.5);

  return { pct, aulasFeitas, totalAulas, etapasFeitas, totalEtapas: etapas.length, pctEsperado, semanaAtual };
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
