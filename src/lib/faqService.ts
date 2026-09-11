// src/lib/faqService.ts
// FAQ da turma: perguntas + respostas em tempo real (Supabase),
// com fallback local quando o banco não está configurado.
import { getSupabase, isSupabaseConfigured } from "./supabase";
import { getIdentidade } from "./auth";
import { track } from "./metricas";

export interface FaqResposta {
  id: string;
  conteudo: string;
  autor: string;
  polo: string;
  dataCriacao: string;
  votos: number;
  melhorResposta: boolean;
}

export interface FaqPergunta {
  id: string;
  titulo: string;
  conteudo: string;
  autor: string;
  polo: string;
  disciplina: string;
  dataCriacao: string;
  votos: number;
  respostas: FaqResposta[];
  resolvida: boolean;
}

type Row = Record<string, unknown>;
const str = (v: unknown, fb = ""): string => (typeof v === "string" && v ? v : fb);
const num = (v: unknown): number => Number(v ?? 0);
const dataCurta = (v: unknown): string =>
  typeof v === "string" ? v.slice(0, 10) : new Date().toISOString().slice(0, 10);

function rowToResposta(r: Row): FaqResposta {
  return {
    id: str(r["id"]),
    conteudo: str(r["conteudo"]),
    autor: str(r["autor_nome"], "Anônimo"),
    polo: str(r["autor_polo"]),
    dataCriacao: dataCurta(r["criado_em"]),
    votos: num(r["votos"]),
    melhorResposta: r["melhor"] === true,
  };
}

export async function listFaq(): Promise<FaqPergunta[] | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data: perguntas, error } = await sb
    .from("faq_perguntas")
    .select("*")
    .order("criado_em", { ascending: false })
    .limit(200);
  if (error || !perguntas) return null;
  const ids = (perguntas as Row[]).map((p) => str(p["id"])).filter(Boolean);
  let porPergunta = new Map<string, FaqResposta[]>();
  if (ids.length) {
    const { data: respostas } = await sb
      .from("faq_respostas")
      .select("*")
      .in("pergunta_id", ids)
      .order("votos", { ascending: false });
    porPergunta = new Map<string, FaqResposta[]>();
    for (const r of (respostas ?? []) as Row[]) {
      const pid = str(r["pergunta_id"]);
      const arr = porPergunta.get(pid) ?? [];
      arr.push(rowToResposta(r));
      porPergunta.set(pid, arr);
    }
  }
  return (perguntas as Row[]).map((p) => {
    const pid = str(p["id"]);
    const respostas = porPergunta.get(pid) ?? [];
    return {
      id: pid,
      titulo: str(p["titulo"]),
      conteudo: str(p["conteudo"]),
      autor: str(p["autor_nome"], "Anônimo"),
      polo: str(p["autor_polo"]),
      disciplina: str(p["disciplina_id"]),
      dataCriacao: dataCurta(p["criado_em"]),
      votos: num(p["votos"]),
      respostas,
      resolvida: p["resolvida"] === true || respostas.some((r) => r.melhorResposta),
    };
  });
}

export async function enviarPergunta(input: {
  titulo: string;
  conteudo: string;
  disciplina: string;
}): Promise<{ ok: boolean; error?: string; pergunta?: FaqPergunta }> {
  const ident = getIdentidade();
  const pergunta: FaqPergunta = {
    id: `fq-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    titulo: input.titulo.trim(),
    conteudo: input.conteudo.trim(),
    autor: ident?.nome ?? "Anônimo",
    polo: ident?.polo ?? "",
    disciplina: input.disciplina,
    dataCriacao: new Date().toISOString().slice(0, 10),
    votos: 0,
    respostas: [],
    resolvida: false,
  };
  const sb = getSupabase();
  if (!sb) return { ok: true, pergunta };
  const { error } = await sb.from("faq_perguntas").insert({
    id: pergunta.id,
    titulo: pergunta.titulo,
    conteudo: pergunta.conteudo,
    disciplina_id: pergunta.disciplina,
    autor_nome: pergunta.autor,
    autor_polo: pergunta.polo,
    autor_local_id: ident?.autorLocalId ?? null,
  });
  if (error) return { ok: false, error: error.message };
  track("faq_pergunta_enviada", { disciplina: input.disciplina });
  return { ok: true, pergunta };
}

export async function enviarResposta(
  perguntaId: string,
  conteudo: string,
): Promise<{ ok: boolean; error?: string }> {
  const ident = getIdentidade();
  const sb = getSupabase();
  const resposta = {
    id: `fr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    pergunta_id: perguntaId,
    conteudo: conteudo.trim(),
    autor_nome: ident?.nome ?? "Anônimo",
    autor_polo: ident?.polo ?? "",
    autor_local_id: ident?.autorLocalId ?? null,
  };
  if (!sb) return { ok: true };
  const { error } = await sb.from("faq_respostas").insert(resposta);
  if (error) return { ok: false, error: error.message };
  track("faq_resposta_enviada", {});
  return { ok: true };
}

/** Marca uma resposta como a melhor (e a pergunta como resolvida). */
export async function marcarMelhorResposta(
  perguntaId: string,
  respostaId: string,
): Promise<{ ok: boolean }> {
  const sb = getSupabase();
  if (!sb) return { ok: false };
  const r1 = await sb.from("faq_respostas").update({ melhor: true }).eq("id", respostaId);
  if (r1.error) return { ok: false };
  await sb
    .from("faq_respostas")
    .update({ melhor: false })
    .eq("pergunta_id", perguntaId)
    .neq("id", respostaId);
  await sb.from("faq_perguntas").update({ resolvida: true }).eq("id", perguntaId);
  return { ok: true };
}

export async function votarPergunta(id: string, atual: number): Promise<number> {
  const sb = getSupabase();
  if (!sb) return atual + 1;
  const { error } = await sb
    .from("faq_perguntas")
    .update({ votos: atual + 1 })
    .eq("id", id);
  return error ? atual : atual + 1;
}

export async function votarResposta(id: string, atual: number): Promise<number> {
  const sb = getSupabase();
  if (!sb) return atual + 1;
  const { error } = await sb
    .from("faq_respostas")
    .update({ votos: atual + 1 })
    .eq("id", id);
  return error ? atual : atual + 1;
}

export function subscribeFaq(onChange: () => void): () => void {
  const sb = getSupabase();
  if (!sb) return () => {};
  const ch = sb
    .channel("rdf-faq")
    .on("postgres_changes", { event: "*", schema: "public", table: "faq_perguntas" }, () =>
      onChange(),
    )
    .on("postgres_changes", { event: "*", schema: "public", table: "faq_respostas" }, () =>
      onChange(),
    )
    .subscribe();
  return () => {
    sb.removeChannel(ch);
  };
}

export { isSupabaseConfigured };
