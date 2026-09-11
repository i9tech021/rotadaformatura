// src/lib/votos.ts
// Guarda anti-voto-duplo no aparelho (cada service de votação usa um escopo).
export function jaVotou(escopo: string, id: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(`rdf:votos:${escopo}`);
    const lista: string[] = raw ? JSON.parse(raw) : [];
    return lista.includes(id);
  } catch {
    return false;
  }
}

export function marcarVoto(escopo: string, id: string): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(`rdf:votos:${escopo}`);
    const lista: string[] = raw ? JSON.parse(raw) : [];
    if (!lista.includes(id)) {
      lista.push(id);
      localStorage.setItem(`rdf:votos:${escopo}`, JSON.stringify(lista));
    }
  } catch {
    // ignore
  }
}
