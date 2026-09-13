// src/lib/gabaritoService.ts
// CRUD de gabaritos extraoficiais + respostas dos alunos.
import { getSupabase } from "./supabase";
import { getIdentidade } from "./auth";
import { track } from "./metricas";

export interface Gabarito {
  id: string;
  disciplina_id: string;
  etapa: string;
  titulo: string;
  texto_transcrito: string;
  total_questoes: number;
  autor_local_id: string;
  autor_nome: string;
  autor_polo: string;
  publicado: boolean;
  criado_em: string;
}

export interface GabaritoResposta {
  id: string;
  gabarito_id: string;
  questao_numero: number;
  enunciado: string;
  alternativas: string[];
  resposta_correta: number;
  explicacao: string;
  tipo: string;
  resposta_modelo?: string | null;
}

export interface GabaritoRespostaAluno {
  id: string;
  gabarito_id: string;
  autor_local_id: string;
  autor_nome: string;
  autor_polo: string;
  respostas: Record<number, number>;
  nota: number | null;
  acertos: number | null;
  total: number | null;
  criado_em: string;
}

type Row = Record<string, unknown>;

function rowToGabarito(r: Row): Gabarito {
  return {
    id: String(r.id),
    disciplina_id: String(r.disciplina_id),
    etapa: String(r.etapa),
    titulo: String(r.titulo),
    texto_transcrito: String(r.texto_transcrito ?? ""),
    total_questoes: Number(r.total_questoes ?? 0),
    autor_local_id: String(r.autor_local_id),
    autor_nome: String(r.autor_nome),
    autor_polo: String(r.autor_polo),
    publicado: Boolean(r.publicado),
    criado_em: String(r.criado_em),
  };
}

function rowToResposta(r: Row): GabaritoResposta {
  return {
    id: String(r.id),
    gabarito_id: String(r.gabarito_id),
    questao_numero: Number(r.questao_numero),
    enunciado: String(r.enunciado),
    alternativas: Array.isArray(r.alternativas) ? r.alternativas.map(String) : [],
    resposta_correta: Number(r.resposta_correta),
    explicacao: String(r.explicacao ?? ""),
    tipo: String(r.tipo ?? "objetiva"),
    resposta_modelo: r.resposta_modelo ? String(r.resposta_modelo) : null,
  };
}

function rowToRespostaAluno(r: Row): GabaritoRespostaAluno {
  return {
    id: String(r.id),
    gabarito_id: String(r.gabarito_id),
    autor_local_id: String(r.autor_local_id),
    autor_nome: String(r.autor_nome),
    autor_polo: String(r.autor_polo),
    respostas: typeof r.respostas === "object" ? (r.respostas as Record<number, number>) : {},
    nota: r.nota != null ? Number(r.nota) : null,
    acertos: r.acertos != null ? Number(r.acertos) : null,
    total: r.total != null ? Number(r.total) : null,
    criado_em: String(r.criado_em),
  };
}

// ============================================================
// GABARITOS
// ============================================================

/** Lista gabaritos publicados de uma disciplina + etapa. */
export async function listarGabitos(
  disciplinaId: string,
  etapa?: string,
): Promise<Gabarito[]> {
  const sb = getSupabase();
  if (!sb) return [];
  let query = sb
    .from("gabaritos")
    .select("*")
    .eq("disciplina_id", disciplinaId)
    .eq("publicado", true);
  if (etapa) query = query.eq("etapa", etapa);
  const { data, error } = await query.order("criado_em", { ascending: false });
  if (error || !data) return [];
  return (data as Row[]).map(rowToGabarito);
}

/** Busca um gabarito por ID. */
export async function buscarGabarito(id: string): Promise<Gabarito | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb.from("gabaritos").select("*").eq("id", id).single();
  if (error || !data) return null;
  return rowToGabarito(data);
}

/** Busca respostas de um gabarito (o gabarito em si). */
export async function buscarRespostasGabarito(gabaritoId: string): Promise<GabaritoResposta[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from("gabarito_respostas")
    .select("*")
    .eq("gabarito_id", gabaritoId)
    .order("questao_numero");
  if (error || !data) return [];
  return (data as Row[]).map(rowToResposta);
}

/** Cria um novo gabarito (rascunho, não publicado ainda). */
export async function criarGabarito(input: {
  disciplinaId: string;
  etapa: string;
  titulo: string;
  textoTranscrito: string;
  totalQuestoes: number;
}): Promise<{ ok: boolean; gabarito?: Gabarito; error?: string }> {
  const sb = getSupabase();
  if (!sb) return { ok: false, error: "Banco não configurado." };
  const ident = getIdentidade();
  if (!ident) return { ok: false, error: "Identifique-se primeiro." };

  const id = `gab-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const { data, error } = await sb
    .from("gabaritos")
    .insert({
      id,
      disciplina_id: input.disciplinaId,
      etapa: input.etapa,
      titulo: input.titulo,
      texto_transcrito: input.textoTranscrito,
      total_questoes: input.totalQuestoes,
      autor_local_id: ident.autorLocalId,
      autor_nome: ident.nome,
      autor_polo: ident.polo,
      publicado: false,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, gabarito: rowToGabarito(data) };
}

/** Salva as respostas do gabarito (geradas pela IA). */
export async function salvarRespostasGabarito(
  gabaritoId: string,
  respostas: Omit<GabaritoResposta, "id" | "gabarito_id">[],
): Promise<{ ok: boolean; error?: string }> {
  const sb = getSupabase();
  if (!sb) return { ok: false, error: "Banco não configurado." };

  // Deleta respostas anteriores deste gabarito
  await sb.from("gabarito_respostas").delete().eq("gabarito_id", gabaritoId);

  const rows = respostas.map((r, i) => ({
    id: `gr-${Date.now().toString(36)}-${i}-${Math.random().toString(36).slice(2, 6)}`,
    gabarito_id: gabaritoId,
    questao_numero: r.questao_numero,
    enunciado: r.enunciado,
    alternativas: r.alternativas,
    resposta_correta: r.resposta_correta,
    explicacao: r.explicacao,
    tipo: r.tipo,
    resposta_modelo: r.resposta_modelo ?? null,
  }));

  const { error } = await sb.from("gabarito_respostas").insert(rows);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** Publica o gabarito (torna visível para todos). */
export async function publicarGabarito(gabaritoId: string): Promise<{ ok: boolean; error?: string }> {
  const sb = getSupabase();
  if (!sb) return { ok: false, error: "Banco não configurado." };
  const { error } = await sb
    .from("gabaritos")
    .update({ publicado: true, updated_at: new Date().toISOString() })
    .eq("id", gabaritoId);
  if (error) return { ok: false, error: error.message };
  track("gabarito_publicado", { gabaritoId });
  return { ok: true };
}

// ============================================================
// RESPOSTAS DOS ALUNOS (correção)
// ============================================================

/** Envia respostas do aluno e corrige em tempo real. */
export async function enviarRespostasAluno(input: {
  gabaritoId: string;
  respostas: Record<number, number>;
}): Promise<{ ok: boolean; nota?: number; acertos?: number; total?: number; error?: string }> {
  const sb = getSupabase();
  if (!sb) return { ok: false, error: "Banco não configurado." };
  const ident = getIdentidade();
  if (!ident) return { ok: false, error: "Identifique-se primeiro." };

  // Busca o gabarito official para corrigir
  const respostasOficiais = await buscarRespostasGabarito(input.gabaritoId);
  if (!respostasOficiais.length) return { ok: false, error: "Gabarito não encontrado." };

  const total = respostasOficiais.length;
  let acertos = 0;
  for (const r of respostasOficiais) {
    const respostaAluno = input.respostas[r.questao_numero];
    if (respostaAluno === r.resposta_correta) acertos++;
  }
  const nota = total > 0 ? Math.round((acertos / total) * 100) / 10 : 0;

  const id = `ra-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const { error } = await sb.from("gabarito_respostas_aluno").insert({
    id,
    gabarito_id: input.gabaritoId,
    autor_local_id: ident.autorLocalId,
    autor_nome: ident.nome,
    autor_polo: ident.polo,
    respostas: input.respostas,
    nota,
    acertos,
    total,
  });

  if (error) return { ok: false, error: error.message };

  // Publica a nota no ranking (origem: prova extraoficial)
  const { publicarNotaRanking } = await import("./ranking");
  const disciplinaId = respostasOficiais[0]
    ? (await buscarGabarito(input.gabaritoId))?.disciplina_id ?? ""
    : "";
  if (disciplinaId) {
    await publicarNotaRanking({
      disciplinaId,
      tipo: (await buscarGabarito(input.gabaritoId))?.etapa ?? "AP1",
      nota,
    });
  }

  track("gabarito_corrigido", { gabaritoId: input.gabaritoId, nota, acertos, total });
  return { ok: true, nota, acertos, total };
}

/** Lista respostas de alunos para um gabarito (ranking da prova). */
export async function listarRespostasAluno(
  gabaritoId: string,
): Promise<GabaritoRespostaAluno[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from("gabarito_respostas_aluno")
    .select("*")
    .eq("gabarito_id", gabaritoId)
    .order("nota", { ascending: false });
  if (error || !data) return [];
  return (data as Row[]).map(rowToRespostaAluno);
}

/** Assina mudanças real-time nos gabaritos (realtime). */
export function subscribeGabaritos(disciplinaId: string, onChange: () => void): () => void {
  const sb = getSupabase();
  if (!sb) return () => {};
  const channel = sb
    .channel(`rdf-gabaritos-${disciplinaId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "gabaritos", filter: `disciplina_id=eq.${disciplinaId}` },
      () => onChange(),
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "gabarito_respostas_aluno" },
      () => onChange(),
    )
    .subscribe();
  return () => {
    sb.removeChannel(channel);
  };
}
