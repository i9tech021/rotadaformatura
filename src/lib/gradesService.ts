// src/lib/gradesService.ts
// Notas + Calculadora de Média (AD/AP).
// Cada aluno tem um student_id (gerado localmente, pronto pra auth futura).
// Supabase quando configurado, senão localStorage.
import { getSupabase } from "./supabase";
import { disciplinas, type Disciplina } from "@/data/disciplines";

// ============================================================
// STUDID_ID (escalabilidade multi-aluno)
// ============================================================
const STUDENT_ID_KEY = "rdf:student_id";

export function getStudentId(): string {
  if (typeof window === "undefined") return "default";
  let id = localStorage.getItem(STUDENT_ID_KEY);
  if (!id) {
    id = `student-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem(STUDENT_ID_KEY, id);
  }
  return id;
}

// ============================================================
// TIPOS
// ============================================================
export interface Nota {
  id: string;
  studentId: string;
  disciplinaId: string;
  avaliacaoTipo: string; // "AD1", "AP1", "AD2", "AP2", "AP3"
  avaliacaoNumero: number;
  nota: number | null;
  peso: number;
}

export interface CalculoMedia {
  disciplinaId: string;
  disciplinaNome: string;
  n1: number | null;
  n2: number | null;
  mediaAtual: number | null;
  mediaMinima: number;
  precisaQuanto: number | null;
  podePassar: boolean;
  situacao: string;
  detalhes: string[];
}

// ============================================================
// CRUD
// ============================================================
const LS_KEY = "rdf:notas";

function loadLocal(): Nota[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveLocal(notas: Nota[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_KEY, JSON.stringify(notas));
}

function rowToNota(r: Record<string, unknown>): Nota {
  return {
    id: r["id"] as string,
    studentId: (r["student_id"] as string) || "default",
    disciplinaId: r["disciplina_id"] as string,
    avaliacaoTipo: r["avaliacao_tipo"] as string,
    avaliacaoNumero: (r["avaliacao_numero"] as number) || 1,
    nota: r["nota"] != null ? Number(r["nota"]) : null,
    peso: (r["peso"] as number) || 1,
  };
}

export async function loadNotas(disciplinaId?: string): Promise<Nota[]> {
  const studentId = getStudentId();
  const sb = getSupabase();
  if (sb) {
    let query = sb.from("notas").select("*").eq("student_id", studentId);
    if (disciplinaId) query = query.eq("disciplina_id", disciplinaId);
    const { data, error } = await query;
    if (!error && data?.length) return data.map(rowToNota);
  }
  const local = loadLocal().filter((n) => n.studentId === studentId);
  return disciplinaId ? local.filter((n) => n.disciplinaId === disciplinaId) : local;
}

export async function saveNota(
  nota: Omit<Nota, "id" | "studentId">,
): Promise<Nota> {
  const studentId = getStudentId();
  const id = `nota-${nota.disciplinaId}-${nota.avaliacaoTipo}-${nota.avaliacaoNumero}`;
  const fullNota: Nota = { ...nota, id, studentId };

  const sb = getSupabase();
  if (sb) {
    await sb.from("notas").upsert({
      id,
      student_id: studentId,
      disciplina_id: nota.disciplinaId,
      avaliacao_tipo: nota.avaliacaoTipo,
      avaliacao_numero: nota.avaliacaoNumero,
      nota: nota.nota,
      peso: nota.peso,
    });
  }

  const local = loadLocal().filter((n) => n.id !== id);
  local.push(fullNota);
  saveLocal(local);

  return fullNota;
}

// ============================================================
// CALCULADORA DE MÉDIA
// ============================================================

// Fórmula padrão CEDERJ:
// N1 = (peso_AD1 × AD1 + peso_AP1 × AP1) / (peso_AD1 + peso_AP1)
// Média = (N1 + N2) / 2
// Aprovação: Média ≥ 6,0
// AP3 (recuperação): Média(AP3, maior(N1,N2)) ≥ 5,0
// peso_AD = 2, peso_AP = 8 (20% AD + 80% AP)
const PESO_AD = 2;
const PESO_AP = 8;
const MEDIA_MINIMA = 6.0;

function calcN(notas: Nota[], tipoAD: string, tipoAP: string): number | null {
  const ad = notas.find((n) => n.avaliacaoTipo === tipoAD);
  const ap = notas.find((n) => n.avaliacaoTipo === tipoAP);
  if (ad?.nota != null && ap?.nota != null) {
    return (PESO_AD * ad.nota + PESO_AP * ap.nota) / (PESO_AD + PESO_AP);
  }
  if (ad?.nota != null && ap?.nota == null) {
    return (PESO_AD * ad.nota) / (PESO_AD + PESO_AP);
  }
  if (ad?.nota == null && ap?.nota != null) {
    return (PESO_AP * ap.nota) / (PESO_AD + PESO_AP);
  }
  return null;
}

export function calcularMedia(
  disciplinaId: string,
  notas: Nota[],
): CalculoMedia {
  const disc = disciplinas.find((d) => d.id === disciplinaId);
  const nome = disc?.nome || disciplinaId;
  const detalhes: string[] = [];

  const n1 = calcN(notas, "AD1", "AP1");
  const n2 = calcN(notas, "AD2", "AP2");

  if (n1 != null)
    detalhes.push(`N1 = ${n1.toFixed(2)}`);
  if (n2 != null)
    detalhes.push(`N2 = ${n2.toFixed(2)}`);

  let mediaAtual: number | null = null;
  if (n1 != null && n2 != null) {
    mediaAtual = (n1 + n2) / 2;
    detalhes.push(`Média = (${n1.toFixed(2)} + ${n2.toFixed(2)}) / 2 = ${mediaAtual.toFixed(2)}`);
  } else if (n1 != null) {
    mediaAtual = n1 / 2;
    detalhes.push(`Média parcial = ${n1.toFixed(2)} / 2 = ${mediaAtual.toFixed(2)} (falta N2)`);
  }

  let precisaQuanto: number | null = null;
  let podePassar = false;
  let situacao: string;

  if (mediaAtual != null && mediaAtual >= MEDIA_MINIMA) {
    situacao = "Aprovado!";
    podePassar = true;
    detalhes.push(`Média ${mediaAtual.toFixed(2)} ≥ ${MEDIA_MINIMA}. Aprovado!`);
  } else if (n1 != null && n2 == null) {
    // Precisa de nota no AP2 (ou AD2+AP2)
    const precisaN2 = MEDIA_MINIMA * 2 - n1;
    precisaQuanto = Math.max(0, precisaN2);
    podePassar = precisaN2 <= 10;
    situacao = podePassar
      ? `Precisa de N2 ≥ ${precisaN2.toFixed(1)}`
      : "Não é possível passar só com N2";
    detalhes.push(`Para média ≥ ${MEDIA_MINIMA}: N2 precisa ser ≥ ${precisaN2.toFixed(2)}`);
  } else if (n1 == null && n2 != null) {
    const precisaN1 = MEDIA_MINIMA * 2 - n2;
    precisaQuanto = Math.max(0, precisaN1);
    podePassar = precisaN1 <= 10;
    situacao = podePassar
      ? `Precisa de N1 ≥ ${precisaN1.toFixed(1)}`
      : "Não é possível passar só com N1";
    detalhes.push(`Para média ≥ ${MEDIA_MINIMA}: N1 precisa ser ≥ ${precisaN1.toFixed(2)}`);
  } else if (mediaAtual != null) {
    const faltam = MEDIA_MINIMA - mediaAtual;
    precisaQuanto = faltam;
    podePassar = false;
    situacao = `Faltam ${faltam.toFixed(2)} pontos na média`;
    detalhes.push(`Faltam ${faltam.toFixed(2)} pontos para atingir ${MEDIA_MINIMA}`);
  } else {
    situacao = "Sem notas cadastradas";
    detalhes.push("Registre suas notas para ver o cálculo");
  }

  // Verifica possibilidade de recuperação via AP3
  if (!podePassar && n1 != null && n2 != null && mediaAtual != null) {
    const maiorN = Math.max(n1, n2);
    const precisaAP3 = MEDIA_MINIMA * 2 - maiorN;
    if (precisaAP3 <= 10) {
      detalhes.push(`Via recuperação: precisa AP3 ≥ ${precisaAP3.toFixed(2)} (média com o maior N)`);
    } else {
      detalhes.push("Recuperação (AP3) não é possível neste caso");
    }
  }

  return {
    disciplinaId,
    disciplinaNome: nome,
    n1,
    n2,
    mediaAtual,
    mediaMinima: MEDIA_MINIMA,
    precisaQuanto,
    podePassar,
    situacao,
    detalhes,
  };
}

export function calcularTodasMedias(notas: Nota[]): CalculoMedia[] {
  const ids = [...new Set(notas.map((n) => n.disciplinaId))];
  return ids.map((id) => calcularMedia(id, notas.filter((n) => n.disciplinaId === id)));
}
