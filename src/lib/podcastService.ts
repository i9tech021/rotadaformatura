// src/lib/podcastService.ts
// CRUD de podcasts — Supabase (Storage + tabela) com fallback localStorage.
// Mesmo padrão dos services existentes (checkpoints, eventsService).

import { getSupabase, isSupabaseConfigured } from "./supabase";

export interface Podcast {
  id: string;
  disciplina_id: string;
  titulo: string;
  descricao: string;
  objetivo?: string;
  url: string;
  duracao_seg?: number | null;
  criado_em: string;
}

const LS_KEY = "rdf:podcasts";

function loadLocal(): Podcast[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "[]") as Podcast[];
  } catch {
    return [];
  }
}

function saveLocal(podcasts: Podcast[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(podcasts));
}

/** Lista todos os podcasts (Supabase se configurado, senão localStorage). */
export async function listPodcasts(disciplinaId?: string): Promise<Podcast[]> {
  const sb = getSupabase();
  if (sb) {
    let query = sb.from("podcasts").select("*").order("criado_em", { ascending: false });
    if (disciplinaId) query = query.eq("disciplina_id", disciplinaId);
    const { data, error } = await query;
    if (!error && data) return data as Podcast[];
    // se falhou (tabela ainda não existe), cai pro local
  }
  const local = loadLocal();
  return disciplinaId ? local.filter((p) => p.disciplina_id === disciplinaId) : local;
}

/** Faz upload do áudio e registra o podcast. */
export async function uploadPodcast(
  arquivo: File,
  meta: { disciplinaId: string; titulo: string; descricao: string; objetivo?: string },
  onProgress?: (pct: number) => void,
): Promise<{ ok: boolean; error?: string; podcast?: Podcast }> {
  const sb = getSupabase();
  const id = `pod-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  onProgress?.(10);
  const duracaoSeg = await extrairDuracao(arquivo);
  onProgress?.(20);

  let url = "";
  if (sb) {
    const ext = arquivo.name.split(".").pop() || "mp3";
    const path = `${meta.disciplinaId}/${id}.${ext}`;

    // Upload com progresso via XMLHttpRequest
    try {
      url = await uploadComProgresso(sb, path, arquivo, onProgress);
    } catch (err: any) {
      return { ok: false, error: `Falha no upload: ${err.message || "Erro desconhecido"}` };
    }

    onProgress?.(85);
    const podcast: Podcast = {
      id,
      disciplina_id: meta.disciplinaId,
      titulo: meta.titulo,
      descricao: meta.descricao,
      objetivo: meta.objetivo,
      url,
      duracao_seg: duracaoSeg,
      criado_em: new Date().toISOString(),
    };
    const { error: dbErr } = await sb.from("podcasts").insert([podcast]);
    if (dbErr) return { ok: false, error: `Falha ao salvar: ${dbErr.message}` };
    onProgress?.(100);
    return { ok: true, podcast };
  }

  // Fallback local
  onProgress?.(50);
  const podcast: Podcast = {
    id,
    disciplina_id: meta.disciplinaId,
    titulo: meta.titulo,
    descricao: meta.descricao,
    objetivo: meta.objetivo,
    url: URL.createObjectURL(arquivo),
    duracao_seg: duracaoSeg,
    criado_em: new Date().toISOString(),
  };
  const local = loadLocal();
  local.unshift(podcast);
  saveLocal(local);
  onProgress?.(100);
  return { ok: true, podcast };
}

/** Upload com progresso via Supabase Storage. */
function uploadComProgresso(
  sb: any,
  path: string,
  arquivo: File,
  onProgress?: (pct: number) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Tenta usar XHR para progresso real
    try {
      const xhr = new XMLHttpRequest();
      const bucketUrl = `${(sb as any).storageUrl || ""}/object/upload/podcasts/${path}`;

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 60) + 20; // 20-80%
          onProgress?.(pct);
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const { data } = sb.storage.from("podcasts").getPublicUrl(path);
          resolve(data.publicUrl);
        } else {
          reject(new Error(`HTTP ${xhr.status}: ${xhr.responseText}`));
        }
      });

      xhr.addEventListener("error", () => reject(new Error("Falha de rede no upload")));

      const anonKey = (sb as any).realtime?.params?.apikey || "";
      xhr.open("POST", bucketUrl);
      xhr.setRequestHeader("Authorization", `Bearer ${anonKey}`);
      xhr.setRequestHeader("x-upsert", "false");
      xhr.send(arquivo);
    } catch {
      // Fallback: usa o SDK Supabase direto (sem progresso)
      sb.storage
        .from("podcasts")
        .upload(path, arquivo, { cacheControl: "3600", upsert: false })
        .then(({ error }: any) => {
          if (error) reject(error);
          else {
            const { data } = sb.storage.from("podcasts").getPublicUrl(path);
            resolve(data.publicUrl);
          }
        })
        .catch(reject);
    }
  });
}

/** Remove podcast (banco + storage se Supabase; senão local). */
export async function deletePodcast(podcast: Podcast): Promise<{ ok: boolean; error?: string }> {
  const sb = getSupabase();
  if (sb) {
    // tenta remover arquivo do storage (caminho após /podcasts/)
    try {
      const path = podcast.url.split("/podcasts/")[1];
      if (path) await sb.storage.from("podcasts").remove([`${podcast.disciplina_id}/${path}`]);
    } catch {
      // storage cleanup é best-effort
    }
    const { error } = await sb.from("podcasts").delete().eq("id", podcast.id);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }
  const local = loadLocal().filter((p) => p.id !== podcast.id);
  saveLocal(local);
  return { ok: true };
}

/** Assina mudanças realtime (retorna unsubscribe). Sem Supabase = noop. */
export function subscribePodcasts(cb: () => void): () => void {
  const sb = getSupabase();
  if (!sb) return () => {};
  const ch = sb
    .channel("podcasts-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "podcasts" }, cb)
    .subscribe();
  return () => {
    sb.removeChannel(ch);
  };
}

/** Lê a duração do arquivo de áudio em segundos (best-effort). */
function extrairDuracao(arquivo: File): Promise<number | null> {
  return new Promise((resolve) => {
    try {
      const el = new Audio();
      const objUrl = URL.createObjectURL(arquivo);
      el.preload = "metadata";
      el.onloadedmetadata = () => {
        resolve(Number.isFinite(el.duration) ? Math.round(el.duration) : null);
        URL.revokeObjectURL(objUrl);
      };
      el.onerror = () => {
        resolve(null);
        URL.revokeObjectURL(objUrl);
      };
      el.src = objUrl;
    } catch {
      resolve(null);
    }
  });
}

/** Formata segundos em "m:ss". */
export function formatarDuracao(seg?: number | null): string {
  if (!seg || !Number.isFinite(seg)) return "";
  const m = Math.floor(seg / 60);
  const s = Math.floor(seg % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}
