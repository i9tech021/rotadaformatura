// src/lib/publicacoesService.ts
// Comunidade aberta — publicações de podcast | pdf | nota por disciplina.
// Real-time via Supabase Realtime; autores identificados por nome + polo (sem login).
// Delete/update apenas do próprio autor (autor_local_id salvo no navegador).
import { getSupabase, isSupabaseConfigured } from "./supabase";

export type TipoPublicacao = "podcast" | "pdf" | "nota";

export type EtapaPublicacao = "Geral" | "AD1" | "AP1" | "AD2" | "AP2" | "AP3";

export const ETAPAS: EtapaPublicacao[] = ["Geral", "AD1", "AP1", "AD2", "AP2", "AP3"];

/** Teto real do servidor por arquivo (~50MB). */
export const LIMITE_ARQUIVO_MB = 50;

/**
 * Classificação fina para exibição. O `tipo` do banco é restrito
 * (podcast|pdf|nota) — o detalhe (vídeo, imagem, arquivo) vai nas tags.
 */
export type KindMaterial = "audio" | "video" | "pdf" | "imagem" | "arquivo" | "nota";

/** Classifica um arquivo pelo MIME (cai para extensão quando vazio). */
export function kindDoArquivo(file: File): KindMaterial {
  const t = (file.type || "").toLowerCase();
  if (t.startsWith("video/")) return "video";
  if (t.startsWith("audio/")) return "audio";
  if (t.startsWith("image/")) return "imagem";
  if (t === "application/pdf") return "pdf";
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  if (["mp4", "mov", "webm", "mkv", "avi", "3gp"].includes(ext)) return "video";
  if (["mp3", "m4a", "wav", "ogg", "oga", "opus", "aac", "wma", "amr", "flac"].includes(ext))
    return "audio";
  if (["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"].includes(ext)) return "imagem";
  if (["pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "txt", "rtf", "odt", "csv"].includes(ext))
    return "pdf";
  return "arquivo";
}

/** Classifica uma publicação salva (usa tags; cai para extensão da URL). */
export function kindDaPublicacao(p: Publicacao): KindMaterial {
  if (p.tipo === "podcast") return "audio";
  if (p.tipo === "pdf") return "pdf";
  if (p.tags.includes("video")) return "video";
  if (p.tags.includes("imagem")) return "imagem";
  if (p.tags.includes("arquivo")) return "arquivo";
  if (p.url) {
    const ext = (p.url.split("?")[0] ?? "").split(".").pop()?.toLowerCase() ?? "";
    if (["mp4", "mov", "webm", "mkv", "3gp"].includes(ext)) return "video";
    if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) return "imagem";
    if (["mp3", "m4a", "wav", "ogg", "oga", "opus", "aac"].includes(ext)) return "audio";
    return "arquivo";
  }
  return "nota";
}

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
  etapa: EtapaPublicacao;
  tags: string[];
  criado_em: string;
}

// Re-exporta do módulo de auth unificado
export { CODIGO_TURMA_PADRAO, getIdentidade, salvarIdentidade } from "@/lib/auth";
export type { Identidade } from "@/lib/auth";

// Importa localmente para uso neste módulo
import { getIdentidade } from "@/lib/auth";
import type { Identidade } from "@/lib/auth";

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
  etapa?: string | null;
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
    etapa: ETAPAS.includes((r.etapa as EtapaPublicacao) || "Geral")
      ? (r.etapa as EtapaPublicacao) || "Geral"
      : "Geral",
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
  dir: string,
  pubId: string,
): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) {
    // fallback local: URL temporária (sessão atual)
    return URL.createObjectURL(arquivo);
  }
  const ext = (arquivo.name.split(".").pop() || "bin").toLowerCase();
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
  etapa?: EtapaPublicacao;
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
    etapa: base.etapa ?? "Geral",
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
    etapa: base.etapa ?? "Geral",
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

/**
 * Publica QUALQUER arquivo (vídeo, imagem, slides, doc, áudio...).
 * - áudio → vira episódio de podcast (entra no player da disciplina);
 * - pdf/docs → tipo "pdf";
 * - vídeo/imagem/outros → tipo "nota" com a URL + tag do kind
 *   (o `tipo` do banco só aceita podcast|pdf|nota).
 * O arquivo deve chegar aqui já pronto (áudio já comprimido no aparelho).
 */
export async function publicarArquivo(
  base: PublicarBase,
  arquivo: File,
): Promise<{ ok: boolean; error?: string; publicacao?: Publicacao; kind?: KindMaterial }> {
  const kind = kindDoArquivo(arquivo);
  if (kind === "audio") {
    const r = await publicarPodcast(base, arquivo);
    return { ...r, kind };
  }
  const sb = getSupabase();
  const id = `pub-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const url = await uploadArquivo(arquivo, "arquivos", id);
  if (!url) return { ok: false, error: "Falha ao subir o arquivo.", kind };

  const tipo: TipoPublicacao = kind === "pdf" ? "pdf" : "nota";
  const pub: Publicacao = {
    id,
    tipo,
    disciplina_id: base.disciplinaId,
    titulo: base.titulo,
    descricao: base.descricao,
    url,
    conteudo: null,
    autor_nome: base.ident.nome,
    autor_polo: base.ident.polo,
    autor_local_id: base.ident.autorLocalId,
    etapa: base.etapa ?? "Geral",
    tags: [kind],
    criado_em: new Date().toISOString(),
  };

  if (sb) {
    const { error } = await sb.from("publicacoes").insert([pub]);
    if (error) return { ok: false, error: error.message, kind };
  } else {
    const local = loadLocal();
    local.unshift(pub);
    saveLocal(local);
  }
  return { ok: true, publicacao: pub, kind };
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
    etapa: base.etapa ?? "Geral",
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
