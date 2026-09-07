// src/lib/provasService.ts
// Provas antigas em PDF — base real dos simulados (mínimo 3 por disciplina+etapa).
// Texto extraído no upload (pdf.js) e salvo no banco para a IA usar.
import * as pdfjsLib from "pdfjs-dist";
import { getSupabase } from "./supabase";
import { track } from "./metricas";
import type { EtapaQuestao } from "./questoesService";

let workerOk = false;
/** Configura o worker do pdf.js no browser; fora dele usa fake worker. */
async function ensureWorker(): Promise<void> {
  if (workerOk) return;
  try {
    const w = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")) as { default: string };
    pdfjsLib.GlobalWorkerOptions.workerSrc = w.default;
  } catch {
    // ambiente sem suporte a ?url (Node/bun): pdf.js usa fake worker
  }
  workerOk = true;
}

export const MIN_PROVAS = 3;
const MAX_PAGINAS = 15;
const MAX_CHARS = 40000;

export interface ProvaAntiga {
  id: string;
  disciplina_id: string;
  tipo: EtapaQuestao;
  titulo: string;
  url: string;
  texto_extraido: string | null;
  num_paginas: number;
  autor_local_id: string | null;
  criado_em: string;
}

const LS_KEY = "rdf:provas";

function loadLocal(): ProvaAntiga[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveLocal(lista: ProvaAntiga[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(lista));
}

/** Extrai texto do PDF no navegador (máx 15 páginas / 40k chars). */
export async function extrairTextoPdf(
  arquivo: File,
): Promise<{ texto: string; numPaginas: number }> {
  await ensureWorker();
  const buf = await arquivo.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  const numPaginas = pdf.numPages;
  const partes: string[] = [];
  let total = 0;
  const limite = Math.min(numPaginas, MAX_PAGINAS);
  for (let i = 1; i <= limite; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const txt = content.items
      .map((it) => {
        const s = it as { str?: unknown };
        return typeof s.str === "string" ? s.str : "";
      })
      .join(" ");
    partes.push(txt);
    total += txt.length;
    if (total >= MAX_CHARS) break;
  }
  try {
    const d = pdf as unknown as { destroy?: () => Promise<unknown> };
    if (typeof d.destroy === "function") await d.destroy();
  } catch {
    // limpeza best-effort
  }
  return { texto: partes.join("\n").slice(0, MAX_CHARS), numPaginas };
}

function rowToProva(r: {
  id: string;
  disciplina_id: string;
  tipo: string;
  titulo: string;
  url: string;
  texto_extraido?: string | null;
  num_paginas?: number | null;
  autor_local_id?: string | null;
  criado_em: string;
}): ProvaAntiga {
  return {
    id: r.id,
    disciplina_id: r.disciplina_id,
    tipo: (r.tipo as EtapaQuestao) || "AP1",
    titulo: r.titulo || "Prova",
    url: r.url,
    texto_extraido: r.texto_extraido ?? null,
    num_paginas: Number(r.num_paginas) || 0,
    autor_local_id: r.autor_local_id ?? null,
    criado_em: r.criado_em,
  };
}

/** Lista provas (opcionalmente por disciplina + etapa). */
export async function listProvas(
  disciplinaId?: string,
  tipo?: EtapaQuestao,
): Promise<ProvaAntiga[]> {
  const sb = getSupabase();
  if (sb) {
    let query = sb.from("provas_antigas").select("*").order("criado_em", { ascending: false });
    if (disciplinaId) query = query.eq("disciplina_id", disciplinaId);
    if (tipo) query = query.eq("tipo", tipo);
    const { data, error } = await query;
    if (!error && data) return data.map(rowToProva);
  }
  return loadLocal().filter(
    (p) => (!disciplinaId || p.disciplina_id === disciplinaId) && (!tipo || p.tipo === tipo),
  );
}

/** Upload de prova: storage + extração + registro. */
export async function uploadProva(input: {
  disciplinaId: string;
  tipo: EtapaQuestao;
  titulo: string;
  arquivo: File;
  autorLocalId: string;
}): Promise<{ ok: boolean; error?: string; prova?: ProvaAntiga }> {
  if (input.arquivo.type !== "application/pdf") {
    return { ok: false, error: "Selecione um arquivo PDF." };
  }
  if (input.arquivo.size > 50 * 1024 * 1024) {
    return { ok: false, error: "Máximo de 50MB por arquivo." };
  }

  const id = `prova-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  let url = "";
  try {
    const { texto, numPaginas } = await extrairTextoPdf(input.arquivo);
    if (!texto.trim()) {
      return { ok: false, error: "Não foi possível ler o texto deste PDF (pode ser escaneado)." };
    }

    const sb = getSupabase();
    if (sb) {
      const path = `${input.disciplinaId}/${input.tipo}/${id}.pdf`;
      const { error: upErr } = await sb.storage
        .from("provas")
        .upload(path, input.arquivo, { cacheControl: "3600", upsert: false });
      if (upErr) return { ok: false, error: `Falha no upload: ${upErr.message}` };
      url = sb.storage.from("provas").getPublicUrl(path).data.publicUrl;
    } else {
      url = URL.createObjectURL(input.arquivo);
    }

    const prova: ProvaAntiga = {
      id,
      disciplina_id: input.disciplinaId,
      tipo: input.tipo,
      titulo: input.titulo.trim() || input.arquivo.name.replace(/\.pdf$/i, ""),
      url,
      texto_extraido: texto,
      num_paginas: numPaginas,
      autor_local_id: input.autorLocalId,
      criado_em: new Date().toISOString(),
    };

    if (sb) {
      const { error: dbErr } = await sb.from("provas_antigas").insert([
        {
          id: prova.id,
          disciplina_id: prova.disciplina_id,
          tipo: prova.tipo,
          titulo: prova.titulo,
          url: prova.url,
          texto_extraido: prova.texto_extraido,
          num_paginas: prova.num_paginas,
          autor_local_id: prova.autor_local_id,
        },
      ]);
      if (dbErr) return { ok: false, error: dbErr.message };
    } else {
      saveLocal([prova, ...loadLocal()]);
    }
    track("prova_enviada", { disciplinaId: input.disciplinaId, tipo: input.tipo });
    return { ok: true, prova };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro ao processar o PDF." };
  }
}

/** Exclui prova (só o autor). */
export async function deleteProva(
  prova: ProvaAntiga,
  autorLocalId: string,
): Promise<{ ok: boolean; error?: string }> {
  if (prova.autor_local_id && prova.autor_local_id !== autorLocalId) {
    return { ok: false, error: "Só o autor pode excluir esta prova." };
  }
  const sb = getSupabase();
  if (sb) {
    try {
      const path = prova.url.split("/provas/")[1];
      if (path) await sb.storage.from("provas").remove([path]);
    } catch {
      // best-effort
    }
    const res = await fetch(
      `${import.meta.env["VITE_SUPABASE_URL"]}/rest/v1/provas_antigas?id=eq.${prova.id}`,
      {
        method: "DELETE",
        headers: {
          apikey: import.meta.env["VITE_SUPABASE_ANON_KEY"] as string,
          Authorization: `Bearer ${import.meta.env["VITE_SUPABASE_ANON_KEY"] as string}`,
          Prefer: "return=representation",
          "X-Author-Local-Id": autorLocalId,
        },
      },
    );
    if (!res.ok) return { ok: false, error: "Não foi possível excluir." };
  }
  saveLocal(loadLocal().filter((p) => p.id !== prova.id));
  return { ok: true };
}

/** Realtime: novas provas aparecem sem refresh. */
export function subscribeProvas(cb: () => void): () => void {
  const sb = getSupabase();
  if (!sb) return () => {};
  const ch = sb
    .channel("provas-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "provas_antigas" }, cb)
    .subscribe();
  return () => {
    sb.removeChannel(ch);
  };
}
