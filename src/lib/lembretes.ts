// src/lib/lembretes.ts
// Lembretes de avaliações: preferência por evento salva em localStorage
// + disparo via Notification API quando o prazo entra na janela de alerta.
import { parseDataLocal } from "./datas";

const LS_KEY = "rdf:lembretes";
const LS_FIRED_KEY = "rdf:lembretes:avisados";

function readJson(key: string): Record<string, unknown> {
  if (typeof window === "undefined") return {};
  try {
    return (JSON.parse(localStorage.getItem(key) || "{}") as Record<string, unknown>) ?? {};
  } catch {
    return {};
  }
}

function writeJson(key: string, value: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage cheio/bloqueado — ignora
  }
}

function hojeISO(): string {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
}

export interface EventoLembrete {
  id: string;
  titulo: string;
  dataInicio: string; // ISO
  dataFim?: string; // ISO
  alertaDias: number;
}

export function isLembreteAtivo(eventId: string): boolean {
  return readJson(LS_KEY)[eventId] === true;
}

export function getLembretes(): Record<string, boolean> {
  const raw = readJson(LS_KEY);
  const out: Record<string, boolean> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (v === true) out[k] = true;
  }
  return out;
}

/** Liga/desliga o lembrete de um evento. Retorna o novo estado. */
export function toggleLembrete(eventId: string): boolean {
  const atual = getLembretes();
  const novo = !atual[eventId];
  if (novo) atual[eventId] = true;
  else delete atual[eventId];
  writeJson(LS_KEY, atual);
  return novo;
}

function diasParaPrazo(ev: EventoLembrete): number {
  const prazo = parseDataLocal(ev.dataFim ?? ev.dataInicio);
  const hoje = new Date();
  const a = new Date(prazo.getFullYear(), prazo.getMonth(), prazo.getDate());
  const b = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  return Math.round((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Eventos com lembrete ativo cujo prazo está na janela de alerta
 * e que ainda não foram avisados hoje. Marca os retornados como avisados.
 */
export function verificarLembretes(eventos: EventoLembrete[]): EventoLembrete[] {
  const ativos = getLembretes();
  const avisados = readJson(LS_FIRED_KEY);
  const hoje = hojeISO();
  const devidos = eventos.filter((ev) => {
    if (!ativos[ev.id]) return false;
    if (avisados[ev.id] === hoje) return false;
    const dias = diasParaPrazo(ev);
    return dias >= 0 && dias <= (ev.alertaDias ?? 7);
  });
  if (devidos.length > 0) {
    const next: Record<string, unknown> = { ...avisados };
    for (const ev of devidos) next[ev.id] = hoje;
    writeJson(LS_FIRED_KEY, next);
  }
  return devidos;
}
