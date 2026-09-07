// src/lib/timeline.ts
// Funções de timeline — cálculo de status baseado em datas reais (não hardcoded).
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { EventoAcademico } from "@/data/events";

// helpers para comparação "dia a dia" (ignora horas)
const hojeMs = () => new Date().setHours(0, 0, 0, 0);
const inicioDoDia = (d: string | Date) => new Date(d).setHours(0, 0, 0, 0);

export type StatusEvento = "concluido" | "hoje" | "em_breve" | "futuro";

/** Status do evento a partir da data real de hoje. */
export function getStatusEvento(dataInicio: string | Date): StatusEvento {
  const data = inicioDoDia(dataInicio);
  const hojeDia = hojeMs();

  if (data < hojeDia) return "concluido";
  if (data === hojeDia) return "hoje";
  const seteDiasMs = 7 * 24 * 60 * 60 * 1000;
  if (data - hojeDia <= seteDiasMs) return "em_breve";
  return "futuro";
}

/** Próximo evento cronológico (futuro ou hoje) — a "próxima etapa". */
export function getProximaEtapa(eventos: EventoAcademico[]): EventoAcademico | null {
  const futuros = eventos
    .filter((e) => e.dataInicio && new Date(e.dataInicio) >= new Date())
    .sort((a, b) => new Date(a.dataInicio).getTime() - new Date(b.dataInicio).getTime());
  return futuros[0] ?? null;
}

/** Dias restantes até a próxima AP (ignorando as que já passaram). */
export function getDiasParaProximaAP(eventos: EventoAcademico[]): number | null {
  const aps = eventos
    .filter((e) => e.tipo?.startsWith("AP") && e.dataInicio)
    .sort((a, b) => new Date(a.dataInicio).getTime() - new Date(b.dataInicio).getTime());

  const agora = new Date();
  for (const ap of aps) {
    const dataAp = new Date(ap.dataInicio as string);
    if (dataAp >= agora) {
      return Math.ceil((dataAp.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24));
    }
  }
  return null;
}

/** % de APs concluídas sobre o total de APs do semestre. */
export function getProgressoSemestre(eventos: EventoAcademico[]): number {
  const aps = eventos.filter((e) => e.tipo?.startsWith("AP"));
  const total = aps.length;
  if (total === 0) return 0;
  const agora = new Date();
  const concluidos = aps.filter((e) => e.dataInicio && new Date(e.dataInicio) < agora).length;
  return Math.round((concluidos / total) * 100);
}

export interface ProgressoTempo {
  percentual: number;
  diasDecorridos: number;
  diasTotais: number;
  diasRestantes: number;
}

/**
 * Progresso do semestre pelo TEMPO decorrido (independe de conclusão).
 * Limites = primeiro ao último evento do cronograma. Anda sozinho todo dia.
 */
export function getProgressoTempo(
  eventos: EventoAcademico[],
  agora: Date = new Date(),
): ProgressoTempo {
  const datas: number[] = [];
  for (const e of eventos) {
    if (e.dataInicio) datas.push(new Date(e.dataInicio).getTime());
    const fim = (e as { dataFim?: string }).dataFim;
    if (fim) datas.push(new Date(fim).getTime());
  }
  if (datas.length === 0) {
    return { percentual: 0, diasDecorridos: 0, diasTotais: 1, diasRestantes: 1 };
  }
  const inicio = Math.min(...datas);
  const fim = Math.max(...datas);
  const total = Math.max(1, fim - inicio);
  const decorrido = Math.min(Math.max(agora.getTime() - inicio, 0), total);
  const diasTotais = Math.max(1, Math.round(total / 86400000));
  const diasDecorridos = Math.round(decorrido / 86400000);
  return {
    percentual: Math.round((decorrido / total) * 100),
    diasDecorridos,
    diasTotais,
    diasRestantes: Math.max(0, diasTotais - diasDecorridos),
  };
}

/** Formata data em "dd 'de' MMMM" em português (ex: "12 de setembro"). */
export function formatarDataBrasil(data: string | Date): string {
  return format(new Date(data), "dd 'de' MMMM", { locale: ptBR });
}
