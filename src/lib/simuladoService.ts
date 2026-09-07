// src/lib/simuladoService.ts
// Simulador de provas — modelo novo:
// - identidade = autor_local_id da Comunidade (getIdentidade), sem segundo sistema
// - limite: 1 simulado a cada 7 dias (rolling) por autor
// - simulados_realizados guarda IDS das questões; correção junta com o banco
// - espelho localStorage quando Supabase não configurado
import { getSupabase } from "./supabase";
import { getIdentidade } from "./publicacoesService";
import { listProvas, MIN_PROVAS } from "./provasService";
import {
  buscarQuestoesBanco,
  buscarQuestoesPorIds,
  gerarQuestoesIA,
  salvarQuestoesBanco,
  type EtapaQuestao,
  type QuestaoBanco,
  type QuestaoGerada,
} from "./questoesService";
import { disciplinas } from "@/data/disciplines";

export type { EtapaQuestao };
export type { QuestaoBanco };

export interface SimuladoRow {
  id: string;
  autor_local_id: string;
  disciplina_id: string;
  tipo: EtapaQuestao;
  questoes: string[]; // ids
  respostas: (number | null)[] | null;
  nota: number | null; // 0-10
  percentual: number | null; // 0-100
  criado_em: string;
}

/** Sessão em andamento: linha + questões completas em memória. */
export interface SessaoSimulado extends SimuladoRow {
  questoesCompletas: QuestaoBanco[];
}

export type MontarResultado =
  | {
      ok: true;
      sessao: SessaoSimulado;
      modo: "banco" | "ia" | "misto" | "offline";
      provasUsadas: number;
    }
  | { ok: false; error: string; bloqueado?: boolean; faltamProvas?: number };

const LS_KEY = "rdf:simulados-v2";
const SETE_DIAS_MS = 7 * 24 * 60 * 60 * 1000;

function loadLocal(): SimuladoRow[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveLocal(lista: SimuladoRow[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(lista));
}

function rowToSimulado(r: {
  id: string;
  autor_local_id: string;
  disciplina_id: string;
  tipo: string;
  questoes: unknown;
  respostas: unknown;
  nota: unknown;
  percentual: unknown;
  criado_em: string;
}): SimuladoRow {
  return {
    id: r.id,
    autor_local_id: r.autor_local_id,
    disciplina_id: r.disciplina_id,
    tipo: (r.tipo as EtapaQuestao) || "AP1",
    questoes: Array.isArray(r.questoes) ? r.questoes.map(String) : [],
    respostas: Array.isArray(r.respostas) ? (r.respostas as (number | null)[]) : null,
    nota: r.nota != null ? Number(r.nota) : null,
    percentual: r.percentual != null ? Number(r.percentual) : null,
    criado_em: r.criado_em,
  };
}

export function formatarDataLibera(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Verifica o limite de 1 simulado a cada 7 dias para o autor.
 * Retorna também a data/hora em que libera de novo.
 */
export async function podeGerarSimulado(
  autorLocalId: string,
): Promise<{ pode: boolean; motivo?: string; liberaEm?: string }> {
  const limite = new Date(Date.now() - SETE_DIAS_MS).toISOString();

  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb
      .from("simulados_realizados")
      .select("criado_em")
      .eq("autor_local_id", autorLocalId)
      .gte("criado_em", limite)
      .order("criado_em", { ascending: false })
      .limit(1);
    if (!error && data && data.length > 0) {
      const ultimo = new Date((data[0] as { criado_em: string }).criado_em).getTime();
      const libera = new Date(ultimo + SETE_DIAS_MS).toISOString();
      return {
        pode: false,
        motivo: `Limite de 1 simulado por semana. Libera em ${formatarDataLibera(libera)}.`,
        liberaEm: libera,
      };
    }
  }

  const locais = loadLocal()
    .filter((s) => s.autor_local_id === autorLocalId && s.criado_em >= limite)
    .sort((a, b) => (a.criado_em < b.criado_em ? 1 : -1));
  if (locais.length > 0) {
    const ultimo = new Date((locais[0] as SimuladoRow).criado_em).getTime();
    const libera = new Date(ultimo + SETE_DIAS_MS).toISOString();
    return {
      pode: false,
      motivo: `Limite de 1 simulado por semana. Libera em ${formatarDataLibera(libera)}.`,
      liberaEm: libera,
    };
  }
  return { pode: true };
}

/** Gera questões offline das aulas (último recurso — garante funcionamento). */
function gerarOffline(
  disciplinaId: string,
  disciplinaNome: string,
  tipo: EtapaQuestao,
  qtd: number,
): QuestaoGerada[] {
  const disc = disciplinas.find((d) => d.id === disciplinaId);
  const aulas = (disc?.aulas ?? []).filter((a) => a.titulo);
  const geradas: QuestaoGerada[] = [];
  const usadas = new Set<string>();

  aulas.forEach((aula) => {
    if (geradas.length >= qtd) return;
    const alts = [`A) ${aula.titulo}`];
    const LETRAS = ["B", "C", "D"];
    for (const outra of aulas) {
      if (alts.length >= 4) break;
      if (outra.titulo === aula.titulo || usadas.has(outra.titulo)) continue;
      const letra = LETRAS[alts.length - 1] ?? "?";
      alts.push(`${letra}) ${outra.titulo}`);
      usadas.add(outra.titulo);
    }
    while (alts.length < 4) {
      const letra = ["A", "B", "C", "D"][alts.length] ?? "?";
      alts.push(`${letra}) Revisar o caderno didático`);
    }
    geradas.push({
      enunciado: `Aula ${aula.numero} — qual é o tema abordado nesta aula?`,
      alternativas: alts,
      resposta_correta: 0,
      explicacao: `Tema da aula: ${aula.titulo}.${aula.paginas ? ` Leitura: ${aula.paginas}.` : ""}`,
      dificuldade: "facil",
    });
  });

  while (geradas.length < Math.min(qtd, 4)) {
    geradas.push({
      enunciado: `Para revisar ${disciplinaNome}, qual é a melhor estratégia?`,
      alternativas: [
        "A) Revisar as anotações das aulas",
        "B) Resolver exercícios práticos",
        "C) Ler o caderno didático",
        "D) Todas as anteriores",
      ],
      resposta_correta: 3,
      explicacao: "A melhor forma de estudar combina leitura, exercícios e revisão.",
      dificuldade: "facil",
    });
  }
  return geradas.slice(0, qtd);
}

/**
 * Monta um simulado: banco primeiro, IA complementa, offline como último recurso.
 * Persiste as questões novas no banco e cria a linha em simulados_realizados.
 */
export async function montarSimulado(input: {
  autorLocalId: string;
  disciplinaId: string;
  disciplinaNome: string;
  tipo: EtapaQuestao;
  conteudo?: string | undefined;
  quantidade?: number;
}): Promise<MontarResultado> {
  const qtd = Math.min(15, Math.max(10, input.quantidade ?? 12));

  const { pode, motivo } = await podeGerarSimulado(input.autorLocalId);
  if (!pode) return { ok: false, error: motivo ?? "Limite semanal atingido.", bloqueado: true };

  // 0. Provas antigas: mínimo 3 para a etapa (base real do simulado)
  const provas = await listProvas(input.disciplinaId, input.tipo);
  const provasComTexto = provas.filter(
    (p) => p.texto_extraido && p.texto_extraido.trim().length > 100,
  );
  if (provasComTexto.length < MIN_PROVAS) {
    return {
      ok: false,
      error: `Envie pelo menos ${MIN_PROVAS} provas antigas em PDF de ${input.tipo} para gerar o simulado (tem ${provasComTexto.length}).`,
      faltamProvas: MIN_PROVAS - provasComTexto.length,
    };
  }

  // Contexto real: trechos das provas (até ~4k chars cada, máx ~8k total)
  const contextoProvas = provasComTexto
    .slice(0, 4)
    .map((p, i) => `[PROVA ${i + 1} — ${p.titulo}]\n${(p.texto_extraido ?? "").slice(0, 4000)}`)
    .join("\n\n")
    .slice(0, 8000);

  // 1. Banco primeiro
  const doBanco = await buscarQuestoesBanco(input.disciplinaId, input.tipo, qtd);
  let modo: "banco" | "ia" | "misto" | "offline" = "banco";
  let todas: QuestaoBanco[] = [...doBanco];

  // 2. Complementa com IA baseada nas provas reais
  if (todas.length < qtd) {
    const faltam = qtd - todas.length;
    const r = await gerarQuestoesIA({
      disciplinaId: input.disciplinaId,
      disciplinaNome: input.disciplinaNome,
      tipo: input.tipo,
      conteudo: input.conteudo,
      quantidade: faltam,
      contextoProvas,
    });
    if (r.ok && r.questoes && r.questoes.length > 0) {
      const salvas = await salvarQuestoesBanco(input.disciplinaId, input.tipo, r.questoes);
      todas = [...todas, ...salvas];
      modo = doBanco.length > 0 ? "misto" : "ia";
    }
  }

  // 3. Completa com revisão das aulas se ainda faltar (garante qtd cheia)
  if (todas.length > 0 && todas.length < qtd) {
    const off = gerarOffline(
      input.disciplinaId,
      input.disciplinaNome,
      input.tipo,
      qtd - todas.length,
    );
    const salvas = await salvarQuestoesBanco(
      input.disciplinaId,
      input.tipo,
      off,
      "Revisão de aulas",
    );
    todas = [...todas, ...salvas];
    if (modo === "banco") modo = "misto";
  }

  // 4. Último recurso: tudo offline (aulas locais)
  if (todas.length === 0) {
    const off = gerarOffline(input.disciplinaId, input.disciplinaNome, input.tipo, qtd);
    const salvas = await salvarQuestoesBanco(
      input.disciplinaId,
      input.tipo,
      off,
      "Revisão de aulas",
    );
    todas = salvas;
    modo = "offline";
  }

  todas = todas.slice(0, qtd);
  if (todas.length === 0) {
    return { ok: false, error: "Não foi possível montar o simulado. Tente de novo." };
  }

  // 4. Cria a linha do simulado (só ids)
  const row: SimuladoRow = {
    id: `sim-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    autor_local_id: input.autorLocalId,
    disciplina_id: input.disciplinaId,
    tipo: input.tipo,
    questoes: todas.map((q) => q.id),
    respostas: null,
    nota: null,
    percentual: null,
    criado_em: new Date().toISOString(),
  };

  const sb = getSupabase();
  if (sb) {
    const { error } = await sb.from("simulados_realizados").insert([
      {
        id: row.id,
        autor_local_id: row.autor_local_id,
        disciplina_id: row.disciplina_id,
        tipo: row.tipo,
        questoes: row.questoes,
        criado_em: row.criado_em,
      },
    ]);
    if (error) {
      // sem banco (tabela ainda não criada?) → segue só no local
      const local = loadLocal();
      saveLocal([row, ...local]);
    }
  } else {
    const local = loadLocal();
    saveLocal([row, ...local]);
  }

  return {
    ok: true,
    sessao: { ...row, questoesCompletas: todas },
    modo,
    provasUsadas: provasComTexto.length,
  };
}

/** Corrige, calcula nota (0-10) e percentual, persiste e retorna tudo + revisão. */
export async function corrigirSimulado(
  simuladoId: string,
  respostas: (number | null)[],
): Promise<(SimuladoRow & { questoesCompletas: QuestaoBanco[]; acertos: number }) | null> {
  // carrega a linha
  let row: SimuladoRow | null = null;
  const sb = getSupabase();
  if (sb) {
    const { data } = await sb
      .from("simulados_realizados")
      .select("*")
      .eq("id", simuladoId)
      .single();
    if (data) row = rowToSimulado(data);
  }
  if (!row) row = loadLocal().find((s) => s.id === simuladoId) ?? null;
  if (!row) return null;

  const completas = await buscarQuestoesPorIds(row.questoes);
  const marcadas = respostas.slice(0, completas.length);
  let acertos = 0;
  completas.forEach((q, i) => {
    if (marcadas[i] != null && marcadas[i] === q.resposta_correta) acertos++;
  });
  const total = completas.length;
  const percentual = total ? Math.round((acertos / total) * 100) : 0;
  const nota = total ? Math.round((acertos / total) * 100) / 10 : 0;

  const atualizado: SimuladoRow = { ...row, respostas: marcadas, nota, percentual };

  const locais = loadLocal().map((s) => (s.id === atualizado.id ? atualizado : s));
  if (!locais.some((s) => s.id === atualizado.id)) locais.unshift(atualizado);
  saveLocal(locais);

  if (sb) {
    // update do próprio autor (RLS own) — best effort silencioso
    await sb
      .from("simulados_realizados")
      .update({ respostas: marcadas, nota, percentual })
      .eq("id", simuladoId);
  }

  return { ...atualizado, questoesCompletas: completas, acertos };
}

/** Histórico do autor (mais recentes primeiro). */
export async function listarHistorico(autorLocalId: string): Promise<SimuladoRow[]> {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb
      .from("simulados_realizados")
      .select("*")
      .eq("autor_local_id", autorLocalId)
      .order("criado_em", { ascending: false });
    if (!error && data && data.length > 0) return data.map(rowToSimulado);
  }
  return loadLocal()
    .filter((s) => s.autor_local_id === autorLocalId)
    .sort((a, b) => (a.criado_em < b.criado_em ? 1 : -1));
}

/** Revisão detalhada de um simulado do histórico (junta questões do banco). */
export async function carregarRevisao(
  row: SimuladoRow,
): Promise<{ questoes: QuestaoBanco[]; respostas: (number | null)[] } | null> {
  const completas = await buscarQuestoesPorIds(row.questoes);
  if (completas.length === 0) return null;
  return { questoes: completas, respostas: row.respostas ?? [] };
}

export { getIdentidade };
