// src/lib/publicacoesService.ts
// Comunidade aberta — publicações de podcast | pdf | nota por disciplina.
// Real-time via Supabase Realtime; autores identificados por nome + polo (sem login).
// Delete/update apenas do próprio autor (autor_local_id salvo no navegador).
import { getSupabase, isSupabaseConfigured } from "./supabase";

export type TipoPublicacao = "podcast" | "pdf" | "nota";

export interface Publicacao {
  id: string;
  tipo: TipoPublicacao;
  disciplina_id: string;
  titulo: string;
  descricao: string;
  url: string | null;
  conteudo: string | null;
  autor_nome: string;
  autor_polo: string;
  autor_local_id: string;
  tags: string[];
  criado_em: string;
}

export interface Identidade {
  nome: string;
  polo: string;
  autorLocalId: string;
}

// ============================================================
// IDENTIDADE DO AUTOR (localStorage — nome + polo + id único)
// ============================================================
const IDENT_KEY = "rdf:autor_identidade";

function generateUuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getIdentidade(): Identidade | null {
  try {
    const raw = localStorage.getItem(IDENT_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<Identidade>;
    if (!p.nome || !p.polo) return null;
    return {
      nome: p.nome,
      polo: p.polo,
      autorLocalId: p.autorLocalId || generateUuid(),
    };
  } catch {
    return null;
  }
}

export function salvarIdentidade(nome: string, polo: string): Identidade {
  const atual = getIdentidade();
  const ident: Identidade = {
    nome: nome.trim(),
    polo: polo.trim(),
    autorLocalId: atual?.autorLocalId || generateUuid(),
  };
  localStorage.setItem(IDENT_KEY, JSON.stringify(ident));
  return ident;
}

// ============================================================
// CRUD
// ============================================================
const LS_KEY = "rdf:publicacoes";

function loadLocal(): Publicacao[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveLocal(lista: Publicacao[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(lista));
}

function rowToPub(r: {
  id: string;
  tipo: string;
  disciplina_id: string;
  titulo: string;
  descricao: string;
  url: string | null;
  conteudo: string | null;
  autor_nome: string;
  autor_polo: string;
  autor_local_id: string;
  tags?: string[] | null;
  criado_em: string;
}): Publicacao {
  return {
    id: r.id,
    tipo: (r.tipo as TipoPublicacao) || "nota",
    disciplina_id: r.disciplina_id,
    titulo: r.titulo || "",
    descricao: r.descricao || "",
    url: r.url,
    conteudo: r.conteudo,
    autor_nome: r.autor_nome || "Anônimo",
    autor_polo: r.autor_polo || "",
    autor_local_id: r.autor_local_id || "",
    tags: Array.isArray(r.tags) ? r.tags : [],
    criado_em: r.criado_em,
  };
}

/** Lista publicações (Supabase se configurado, senão localStorage). */
export async function listPublicacoes(disciplinaId?: string): Promise<Publicacao[]> {
  const sb = getSupabase();
  if (sb) {
    let query = sb.from("publicacoes").select("*").order("criado_em", { ascending: false });
    if (disciplinaId) query = query.eq("disciplina_id", disciplinaId);
    const { data, error } = await query;
    if (!error && data) return data.map(rowToPub);
  }
  const local = loadLocal();
  return disciplinaId ? local.filter((p) => p.disciplina_id === disciplinaId) : local;
}

async function uploadArquivo(
  arquivo: File,
  dir: "audio" | "pdf",
  pubId: string,
): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) {
    // fallback local: URL temporária (sessão atual)
    return URL.createObjectURL(arquivo);
  }
  const ext = arquivo.name.split(".").pop() || "bin";
  const path = `${dir}/${pubId}.${ext}`;
  const { error } = await sb.storage
    .from("publicacoes")
    .upload(path, arquivo, { cacheControl: "3600", upsert: false });
  if (error) {
    return null;
  }
  const { data } = sb.storage.from("publicacoes").getPublicUrl(path);
  return data.publicUrl;
}

export interface PublicarBase {
  disciplinaId: string;
  titulo: string;
  descricao: string;
  ident: Identidade;
}

/** Publica um podcast (áudio). */
export async function publicarPodcast(
  base: PublicarBase,
  arquivo: File,
): Promise<{ ok: boolean; error?: string; publicacao?: Publicacao }> {
  const sb = getSupabase();
  const id = `pub-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const url = await uploadArquivo(arquivo, "audio", id);
  if (!url) return { ok: false, error: "Falha ao subir o áudio." };

  const pub: Publicacao = {
    id,
    tipo: "podcast",
    disciplina_id: base.disciplinaId,
    titulo: base.titulo,
    descricao: base.descricao,
    url,
    conteudo: null,
    autor_nome: base.ident.nome,
    autor_polo: base.ident.polo,
    autor_local_id: base.ident.autorLocalId,
    tags: ["podcast"],
    criado_em: new Date().toISOString(),
  };

  if (sb) {
    const { error } = await sb.from("publicacoes").insert([pub]);
    if (error) return { ok: false, error: error.message };
  } else {
    const local = loadLocal();
    local.unshift(pub);
    saveLocal(local);
  }
  return { ok: true, publicacao: pub };
}

/** Publica um PDF. */
export async function publicarPdf(
  base: PublicarBase,
  arquivo: File,
): Promise<{ ok: boolean; error?: string; publicacao?: Publicacao }> {
  const sb = getSupabase();
  const id = `pub-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const url = await uploadArquivo(arquivo, "pdf", id);
  if (!url) return { ok: false, error: "Falha ao subir o PDF." };

  const pub: Publicacao = {
    id,
    tipo: "pdf",
    disciplina_id: base.disciplinaId,
    titulo: base.titulo,
    descricao: base.descricao,
    url,
    conteudo: null,
    autor_nome: base.ident.nome,
    autor_polo: base.ident.polo,
    autor_local_id: base.ident.autorLocalId,
    tags: ["pdf"],
    criado_em: new Date().toISOString(),
  };

  if (sb) {
    const { error } = await sb.from("publicacoes").insert([pub]);
    if (error) return { ok: false, error: error.message };
  } else {
    const local = loadLocal();
    local.unshift(pub);
    saveLocal(local);
  }
  return { ok: true, publicacao: pub };
}

/** Publica uma nota de texto (sem upload). */
export async function publicarNota(
  base: PublicarBase,
  conteudo: string,
): Promise<{ ok: boolean; error?: string; publicacao?: Publicacao }> {
  const sb = getSupabase();
  const id = `pub-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const pub: Publicacao = {
    id,
    tipo: "nota",
    disciplina_id: base.disciplinaId,
    titulo: base.titulo || "Nota de estudo",
    descricao: base.descricao,
    url: null,
    conteudo,
    autor_nome: base.ident.nome,
    autor_polo: base.ident.polo,
    autor_local_id: base.ident.autorLocalId,
    tags: ["nota"],
    criado_em: new Date().toISOString(),
  };

  if (sb) {
    const { error } = await sb.from("publicacoes").insert([pub]);
    if (error) return { ok: false, error: error.message };
  } else {
    const local = loadLocal();
    local.unshift(pub);
    saveLocal(local);
  }
  return { ok: true, publicacao: pub };
}

/** Exclui apenas se for do próprio autor (autor_local_id bate). */
export async function excluirPublicacao(pub: Publicacao): Promise<{ ok: boolean; error?: string }> {
  const ident = getIdentidade();
  if (!ident || pub.autor_local_id !== ident.autorLocalId) {
    return { ok: false, error: "Só o autor pode excluir esta publicação." };
  }

  const sb = getSupabase();
  if (sb) {
    // Remove arquivo do storage (best-effort)
    if (pub.url) {
      try {
        const path = pub.url.split("/publicacoes/")[1];
        if (path) await sb.storage.from("publicacoes").remove([path]);
      } catch {
        // best-effort
      }
    }
    // Envia header custom p/ policy de delete "own"
    const response = await fetch(
      `${import.meta.env["VITE_SUPABASE_URL"]}/rest/v1/publicacoes?id=eq.${pub.id}`,
      {
        method: "DELETE",
        headers: {
          apikey: import.meta.env["VITE_SUPABASE_ANON_KEY"] as string,
          Authorization: `Bearer ${import.meta.env["VITE_SUPABASE_ANON_KEY"] as string}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
          "X-Author-Local-Id": ident.autorLocalId,
        },
      },
    );
    if (!response.ok) {
      return { ok: false, error: "Não foi possível excluir (verifique se é o autor)." };
    }
  }

  const local = loadLocal().filter((p) => p.id !== pub.id);
  saveLocal(local);
  return { ok: true };
}

/** Registra denúncia de uma publicação (moderação leve). */
export async function denunciarPublicacao(publicacaoId: string): Promise<{ ok: boolean }> {
  const sb = getSupabase();
  if (sb) {
    const { error } = await sb.from("denuncias").insert([
      {
        publicacao_id: publicacaoId,
        id: `den-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      },
    ]);
    if (!error) return { ok: true };
  }
  // fallback: apenas confirma (sem persistência local obrigatória)
  return { ok: true };
}

/** Assina mudanças realtime na tabela publicacoes. */
export function subscribePublicacoes(cb: () => void): () => void {
  const sb = getSupabase();
  if (!sb) return () => {};
  const ch = sb
    .channel("publicacoes-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "publicacoes" }, cb)
    .subscribe();
  return () => {
    sb.removeChannel(ch);
  };
}

export { isSupabaseConfigured };
