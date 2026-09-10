// src/lib/disciplinasService.ts
// Fonte de disciplinas: Supabase quando configurado (campos editáveis como
// `progresso`), senão dados estáticos (data/disciplines.ts). A estrutura rica
// (aulas, guia, caderno) vive no código; o banco sobrepõe apenas o que é
// dinâmico. Mantém o app funcional sem banco (fallback) e com realtime.
import { getSupabase } from "./supabase";
import { disciplinas as STATIC_DISCIPLINAS, type Disciplina } from "@/data/disciplines";
import { getProgressoEsperado } from "./progresso";

export async function getDisciplinas(): Promise<Disciplina[]> {
  const sb = getSupabase();
  if (!sb) {
    // Sem Supabase: retorna progresso esperado pelo cronograma
    return STATIC_DISCIPLINAS.map((d) => ({
      ...d,
      progresso: getProgressoEsperado(d),
    }));
  }
  const { data, error } = await sb.from("disciplinas").select("id, progresso");
  if (error || !data?.length) {
    return STATIC_DISCIPLINAS.map((d) => ({
      ...d,
      progresso: getProgressoEsperado(d),
    }));
  }

  const map = new Map<string, number>();
  for (const r of data as Array<{ id: string; progresso?: number }>) {
    if (typeof r.progresso === "number") map.set(r.id, r.progresso);
  }
  return STATIC_DISCIPLINAS.map((d) => ({
    ...d,
    progresso: map.has(d.id) ? map.get(d.id)! : getProgressoEsperado(d),
  }));
}

/**
 * Assina mudanças em tempo real na tabela `disciplinas` (Supabase Realtime).
 * `onChange` roda a cada insert/update/delete. Retorna unsubscribe.
 * Sem Supabase configurado, vira no-op.
 */
export function subscribeDisciplinas(onChange: () => void): () => void {
  const sb = getSupabase();
  if (!sb) return () => {};
  const channel = sb
    .channel("rdf-disciplinas")
    .on("postgres_changes", { event: "*", schema: "public", table: "disciplinas" }, () =>
      onChange(),
    )
    .subscribe();
  return () => {
    sb.removeChannel(channel);
  };
}
