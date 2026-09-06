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

/** Formata data em "dd 'de' MMMM" em português (ex: "12 de setembro"). */
export function formatarDataBrasil(data: string | Date): string {
  return format(new Date(data), "dd 'de' MMMM", { locale: ptBR });
}
