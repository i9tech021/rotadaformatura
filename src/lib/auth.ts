// src/lib/auth.ts
// Sistema de identidade simplificado: código de turma + nome + polo.
// Sem OAuth nem contas — identidade fica no localStorage, rastreável por autor_local_id.

export interface Identidade {
  nome: string;
  polo: string;
  turma: string;
  autorLocalId: string;
}

const STORAGE_KEY = "rdf:identidade";
// Código único da turma (minúsculo, simples). Nunca exibir em telas públicas.
export const CODIGO_TURMA_PADRAO = "turma2026";
const CODIGOS_TURMA = [CODIGO_TURMA_PADRAO];

export function getCodigoTurmaValido(): string[] {
  return CODIGOS_TURMA;
}

export function validarCodigoTurma(codigo: string): boolean {
  return CODIGOS_TURMA.includes(codigo.trim().toLowerCase());
}

export function getIdentidade(): Identidade | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data?.nome && data?.polo && data?.turma && data?.autorLocalId) {
      return data as Identidade;
    }
    return null;
  } catch {
    return null;
  }
}

export function salvarIdentidade(nome: string, polo: string, turma: string): Identidade {
  const existing = getIdentidade();
  const ident: Identidade = {
    nome: nome.trim(),
    polo: polo.trim(),
    turma: turma.trim().toLowerCase(),
    autorLocalId: existing?.autorLocalId ?? crypto.randomUUID(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ident));
  return ident;
}

export function limparIdentidade(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function temIdentidade(): boolean {
  return getIdentidade() !== null;
}
