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
