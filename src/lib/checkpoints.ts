// src/lib/checkpoints.ts
// Progresso de aulas (checkpoints). Grava no Supabase quando configurado,
// e sempre espelha no localStorage como fallback (app funciona sem banco).
import { getSupabase } from "./supabase";

const lsKey = (disciplinaId: string) => `rdf:checkpoints:${disciplinaId}`;

function loadLocal(disciplinaId: string): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(lsKey(disciplinaId)) || "{}");
  } catch {
    return {};
  }
}

function saveLocal(
  disciplinaId: string,
  aulaId: string,
  concluido: boolean,
) {
  if (typeof window === "undefined") return;
  const map = loadLocal(disciplinaId);
  map[aulaId] = concluido;
  window.localStorage.setItem(lsKey(disciplinaId), JSON.stringify(map));
}

export async function loadCheckpoints(
  disciplinaId: string,
): Promise<Record<string, boolean>> {
  const sb = getSupabase();
  const local = loadLocal(disciplinaId);
  if (sb) {
    const { data, error } = await sb
      .from("checkpoints")
      .select("aula_id, concluido")
      .eq("disciplina_id", disciplinaId);
    if (!error && data) {
      const merged = { ...local };
      for (const r of data) merged[r.aula_id] = r.concluido;
      return merged;
    }
  }
  return local;
}

export async function saveCheckpoint(
  disciplinaId: string,
  aulaId: string,
  concluido: boolean,
) {
  const sb = getSupabase();
  if (sb) {
    await sb
      .from("checkpoints")
      .upsert({ aula_id: aulaId, disciplina_id: disciplinaId, concluido });
  }
  saveLocal(disciplinaId, aulaId, concluido);
}

/**
 * Assina mudanças em tempo real nos checkpoints de uma disciplina (Supabase
 * Realtime). `onChange` roda a cada insert/update/delete. Retorna unsubscribe.
 * Sem Supabase configurado, vira no-op (app segue funcional com localStorage).
 */
export function subscribeCheckpoints(
  disciplinaId: string,
  onChange: () => void,
): () => void {
  const sb = getSupabase();
  if (!sb) return () => {};
  const channel = sb
    .channel(`rdf-checkpoints-${disciplinaId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "checkpoints",
        filter: `disciplina_id=eq.${disciplinaId}`,
      },
      () => onChange(),
    )
    .subscribe();
  return () => {
    sb.removeChannel(channel);
  };
}

/**
 * Assina TODAS as mudanças de checkpoints (sem filtro de disciplina). Usado no
 * dashboard para recomputar o progresso geral ao vivo. Retorna unsubscribe.
 */
export function subscribeCheckpointsAll(onChange: () => void): () => void {
  const sb = getSupabase();
  if (!sb) return () => {};
  const channel = sb
    .channel("rdf-checkpoints-all")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "checkpoints" },
      () => onChange(),
    )
    .subscribe();
  return () => {
    sb.removeChannel(channel);
  };
}

/**
 * Conta quantas aulas estão concluídas numa disciplina (Supabase se configurado,
 * senão localStorage). Base para o progresso real exibido no dashboard.
 */
export async function countConcluidas(
  disciplinaId: string,
): Promise<number> {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb
      .from("checkpoints")
      .select("concluido")
      .eq("disciplina_id", disciplinaId);
    if (!error && data) {
      return data.filter((r: { concluido?: boolean }) => r.concluido).length;
    }
  }
  return Object.values(loadLocal(disciplinaId)).filter(Boolean).length;
}
