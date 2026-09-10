// src/lib/streak.ts
// Sistema de Streak de Estudos: rastreia dias consecutivos de atividade.
// Usa localStorage para persistir entre sessões.

const STREAK_KEY = "rdf:study-streak";

export interface StreakData {
  current: number;      // Streak atual (dias consecutivos)
  longest: number;      // Maior streak já alcançado
  lastStudyDate: string; // Último dia que estudou (YYYY-MM-DD)
  totalDays: number;    // Total de dias com atividade
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(d1: string, d2: string): number {
  const date1 = new Date(d1);
  const date2 = new Date(d2);
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

export function getStreak(): StreakData {
  if (typeof window === "undefined") {
    return { current: 0, longest: 0, lastStudyDate: "", totalDays: 0 };
  }
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (!raw) return { current: 0, longest: 0, lastStudyDate: "", totalDays: 0 };
    const data = JSON.parse(raw) as StreakData;
    return {
      current: data.current ?? 0,
      longest: data.longest ?? 0,
      lastStudyDate: data.lastStudyDate ?? "",
      totalDays: data.totalDays ?? 0,
    };
  } catch {
    return { current: 0, longest: 0, lastStudyDate: "", totalDays: 0 };
  }
}

export function saveStreak(data: StreakData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STREAK_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

/**
 * Registra atividade de estudo no dia atual.
 * Retorna o streak atualizado.
 */
export function registrarAtividade(): StreakData {
  const hoje = todayISO();
  const streak = getStreak();

  // Já registrou hoje? Não faz nada
  if (streak.lastStudyDate === hoje) {
    return streak;
  }

  const ontem = new Date();
  ontem.setDate(ontem.getDate() - 1);
  const ontemISO = ontem.toISOString().slice(0, 10);

  let newCurrent: number;

  if (streak.lastStudyDate === ontemISO) {
    // Estudou ontem → continua o streak
    newCurrent = streak.current + 1;
  } else if (streak.lastStudyDate === hoje) {
    // Já registrou hoje (double check)
    return streak;
  } else {
    // Não estudou ontem → reinicia streak
    newCurrent = 1;
  }

  const newData: StreakData = {
    current: newCurrent,
    longest: Math.max(newCurrent, streak.longest),
    lastStudyDate: hoje,
    totalDays: streak.totalDays + 1,
  };

  saveStreak(newData);
  return newData;
}

/**
 * Verifica se o streak está quebrado (não estudou hoje nem ontem).
 */
export function isStreakQuebrado(): boolean {
  const streak = getStreak();
  if (!streak.lastStudyDate) return false;
  
  const hoje = todayISO();
  const ontem = new Date();
  ontem.setDate(ontem.getDate() - 1);
  const ontemISO = ontem.toISOString().slice(0, 10);

  return streak.lastStudyDate !== hoje && streak.lastStudyDate !== ontemISO;
}

/**
 * Retorna mensagem motivacional baseada no streak.
 */
export function getMensagemStreak(streak: number): string {
  if (streak === 0) return "Comece sua sequência hoje! 🔥";
  if (streak === 1) return "Primeiro dia! Continue amanhã! 💪";
  if (streak < 5) return `${streak} dias seguidos! Tá pegando jeito! 🚀`;
  if (streak < 10) return `${streak} dias! Você é consistente! 🔥`;
  if (streak < 30) return `${streak} dias! Incrível! Continue assim! 🏆`;
  return `${streak} dias! Lenda do CEDERJ! 👑`;
}

/**
 * Retorna emoji baseado no streak.
 */
export function getEmojiStreak(streak: number): string {
  if (streak === 0) return "😴";
  if (streak < 3) return "🔥";
  if (streak < 7) return "🔥🔥";
  if (streak < 14) return "🔥🔥🔥";
  if (streak < 30) return "⚡";
  return "👑";
}
