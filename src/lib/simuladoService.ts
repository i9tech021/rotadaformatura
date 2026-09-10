// src/lib/simuladoService.ts
// Simulador de provas — modelo novo:
// - identidade = autor_local_id da Comunidade (getIdentidade), sem segundo sistema
// - limite: 1 simulado a cada 7 dias (rolling) por autor
// - simulados_realizados guarda IDS das questões; correção junta com o banco
// - espelho localStorage quando Supabase não configurado
import { getSupabase } from "./supabase";
import { track } from "./metricas";
import { getIdentidade } from "./publicacoesService";
import { listProvas } from "./provasService";
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
import { listPublicacoes } from "./publicacoesService";

export type { EtapaQuestao };
export type { QuestaoBanco };

export interface SimuladoRow {
  id: string;
  autor_local_id: string;
  autor_nome: string | undefined;
  autor_polo: string | undefined;
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
  autor_nome?: string;
  autor_polo?: string;
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
    autor_nome: (r.autor_nome as string) ?? undefined,
    autor_polo: (r.autor_polo as string) ?? undefined,
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
 * Limite de simulados removido — liberado para todos, sem restrição.
 */
export async function podeGerarSimulado(
  _autorLocalId: string,
): Promise<{ pode: boolean; motivo?: string; liberaEm?: string }> {
  return { pode: true };
}

/** Gera questões offline realistas baseadas nas aulas e avaliações da disciplina. */
function gerarOffline(
  disciplinaId: string,
  disciplinaNome: string,
  tipo: EtapaQuestao,
  qtd: number,
): QuestaoGerada[] {
  const disc = disciplinas.find((d) => d.id === disciplinaId);
  const aulas = (disc?.aulas ?? []).filter((a) => a.titulo);
  const avaliacoes = disc?.avaliacoes ?? [];
  const geradas: QuestaoGerada[] = [];
  const usadas = new Set<string>();

  // Helper: gera alternativas distratoras a partir de um título correto
  function gerarAlternativas(tituloCorreto: string, pool: string[]): string[] {
    const alts = [`A) ${tituloCorreto}`];
    const distratores = pool.filter((t) => t !== tituloCorreto && !usadas.has(t));
    for (const d of distratores.slice(0, 3)) {
      const letra = ["B", "C", "D"][alts.length - 1] ?? "?";
      alts.push(`${letra}) ${d}`);
      usadas.add(d);
    }
    while (alts.length < 4) {
      const letra = ["A", "B", "C", "D"][alts.length] ?? "?";
      alts.push(`${letra}) Conceito não aplicável a ${disciplinaNome}`);
    }
    return alts;
  }

  // 1. Questões baseadas nas aulas (para disciplinas com conteúdo)
  const titulosAulas = aulas.map((a) => a.titulo);
  for (const aula of aulas) {
    if (geradas.length >= qtd) break;
    if (usadas.has(aula.titulo)) continue;

    const alts = gerarAlternativas(aula.titulo, titulosAulas);
    geradas.push({
      enunciado: `Em ${disciplinaNome}, qual conceito é trabalhado na Aula ${aula.numero}?`,
      alternativas: alts,
      resposta_correta: 0,
      explicacao: `Aula ${aula.numero}: ${aula.titulo}.${aula.paginas ? ` Leitura sugerida: ${aula.paginas}.` : ""}`,
      dificuldade: "facil",
    });
    usadas.add(aula.titulo);
  }

  // 2. Questões baseadas nas atividades das aulas (EP, leitura, etc.)
  for (const aula of aulas) {
    if (geradas.length >= qtd) break;
    for (const ativ of aula.atividades) {
      if (geradas.length >= qtd) break;
      const chave = `${aula.numero}-${ativ.tipo}`;
      if (usadas.has(chave)) continue;

      const tipoLabel =
        ativ.tipo === "ep"
          ? "exercício prático"
          : ativ.tipo === "leitura_caderno"
            ? "leitura do caderno"
            : ativ.tipo === "video"
              ? "videoaula"
              : ativ.tipo === "revisao"
                ? "revisão"
                : "atividade complementar";

      geradas.push({
        enunciado: `Na Aula ${aula.numero} de ${disciplinaNome}, qual atividade é obrigatória?`,
        alternativas: [
          `A) ${ativ.descricao}`,
          `B) Estudar o capítulo anterior`,
          `C) Fazer o resumo da aula seguinte`,
          `D) Resolver simulado online`,
        ],
        resposta_correta: 0,
        explicacao: `Atividade obrigatória: ${ativ.descricao}.${ativ.tipo === "ep" ? " Exercício prático essencial para a AP." : ""}`,
        dificuldade: "medio",
      });
      usadas.add(chave);
    }
  }

  // 3. Questões baseadas nas avaliações (conteúdo cobrado)
  const conteudosCobrados = avaliacoes
    .filter((a) => a.conteudoCobrado)
    .map((a) => ({
      conteudo: a.conteudoCobrado!,
      tipo: a.tipo,
    }));

  for (const { conteudo, tipo: tipoAv } of conteudosCobrados) {
    if (geradas.length >= qtd) break;
    const chave = `av-${tipoAv}-${conteudo}`;
    if (usadas.has(chave)) continue;

    const isAD = tipoAv.startsWith("AD");
    geradas.push({
      enunciado: `Em uma ${tipoAv} de ${disciplinaNome}, o conteúdo cobrado é "${conteudo}". Qual tema deve ser priorizado?`,
      alternativas: [
        `A) Estudar todo o conteúdo desde o início do semestre`,
        `B) Focar especificamente em ${conteudo}`,
        `C) Revisar apenas as últimas aulas`,
        `D) Pular esta etapa e estudar para a próxima`,
      ],
      resposta_correta: 1,
      explicacao: `A ${tipoAv} cobra ${conteudo}.${isAD ? " É avaliação a distância — estude com calma em casa." : " É prova presencial — revise com antecedência."}`,
      dificuldade: "medio",
    });
    usadas.add(chave);
  }

  // 4. Questões conceituais gerais da disciplina
  const conceitosGerais: Record<string, string[]> = {
    "metodos-deterministicos-i": [
      "método determinístico",
      "programação linear",
      "otimização",
      "modelo matemático",
      "decisão operacional",
      "análise de sensibilidade",
      "problema de transportes",
      "problema de alocação",
    ],
    "historia-pensamento-administrativo-ii": [
      "escola clássica",
      "escola das relações humanas",
      "abordagem sistêmica",
      "teoria x e y",
      "administração participativa",
      "burocracia weberiana",
      "fayol e princípios da administração",
      "taylor e estudo de tempos",
    ],
    "contabilidade-geral-i": [
      "partida dobrada",
      "balanço patrimonial",
      "demonstração do resultado",
      "razão e razão auxiliar",
      "lançamentos contábeis",
      "balancete de verificação",
      "método do custo histórico",
      "inquérito contábil",
    ],
    "fundamentos-financas": [
      "fluxo de caixa",
      "valor presente",
      "valor futuro",
      "taxa de juros",
      "anuidade",
      "decisão de investimento",
      "orçamento empresarial",
      "capital de giro",
    ],
    "economia-brasileira-contemporanea": [
      "PIB",
      "inflação",
      "política monetária",
      "câmbio",
      "dívida pública",
      "desemprego",
      "setor público",
      "setor privado",
    ],
    "gestao-pessoas-i": [
      "motivação",
      "liderança",
      "comunicação organizacional",
      "desempenho",
      "treinamento",
      "avaliação de desempenho",
      "clima organizacional",
      "qualidade de vida",
    ],
    "sociedade-e-organizacoes": [
      "cultura organizacional",
      "poder e autoridade",
      "conflitos",
      "mudança organizacional",
      "estrutura organizacional",
      "ética empresarial",
      "responsabilidade social",
      "globalização",
    ],
  };

  const conceitos = conceitosGerais[disciplinaId] || [];
  for (const conceito of conceitos) {
    if (geradas.length >= qtd) break;
    if (usadas.has(conceito)) continue;

    const outrosConceitos = conceitos.filter((c) => c !== conceito);
    const alts = gerarAlternativas(conceito, outrosConceitos);
    geradas.push({
      enunciado: `Em ${disciplinaNome}, qual conceito se refere a "${conceito}"?`,
      alternativas: alts,
      resposta_correta: 0,
      explicacao: `${conceito.charAt(0).toUpperCase() + conceito.slice(1)} é um conceito fundamental em ${disciplinaNome}.`,
      dificuldade: "medio",
    });
    usadas.add(conceito);
  }

  // 5. Questões de estudo e estratégia (preenchedor variado)
  const frasesEstudo = [
    {
      enunciado: `Em ${disciplinaNome}, qual a melhor estratégia para revisar o conteúdo antes de uma AP?`,
      alternativas: [
        "A) Reler o caderno didático inteiro sem anotar nada",
        "B) Fazer resumos dos tópicos principais e resolver exercícios",
        "C) Assistir aulas no YouTube sobre o tema",
        "D) Memorizar fórmulas sem entender a aplicação",
      ],
      resposta_correta: 1,
      explicacao:
        "Fazer resumos ativos e resolver exercícios consolida o aprendizado de forma mais eficaz.",
      dificuldade: "facil",
    },
    {
      enunciado: `Em uma prova presencial de ${disciplinaNome}, qual atitude ajuda mais a evitar erros?`,
      alternativas: [
        "A) Marcar rapidamente as respostas que vieram à mente primeiro",
        "B) Ler todas as alternativas antes de marcar, mesmo quando parece óbvio",
        "C) Deixar as questões difíceis para o final sem anotar nada",
        "D) Copiar a resposta do colega ao lado",
      ],
      resposta_correta: 1,
      explicacao:
        "Ler todas as alternativas evita cair em pegadinhas e aumenta as chances de acerto.",
      dificuldade: "facil",
    },
    {
      enunciado: `Ao estudar para uma AD de ${disciplinaNome}, o que mais contribui para um bom desempenho?`,
      alternativas: [
        "A) Estudar tudo na última noite antes do prazo",
        "B) Distribuir o estudo ao longo das semanas e revisar com regularidade",
        "C) Copiar respostas de fontes online sem entender",
        "D) Ignorar os exercícios práticos e focar só na teoria",
      ],
      resposta_correta: 1,
      explicacao:
        "Estudo distribuído ao longo do tempo é comprovadamente mais eficaz que a decoreba de última hora.",
      dificuldade: "medio",
    },
    {
      enunciado: `Qual a importância dos Exercícios Práticos (EPs) em ${disciplinaNome}?`,
      alternativas: [
        "A) São apenas complementares e podem ser ignorados",
        "B) Reforçam o aprendizado e são frequentemente cobrados nas provas",
        "C) Servem apenas para aquecer antes da aula",
        "D) Não têm relação com o conteúdo avaliado",
      ],
      resposta_correta: 1,
      explicacao:
        "Os EPs são fundamentais para fixar o conteúdo e costumam ser a base das questões de prova.",
      dificuldade: "medio",
    },
    {
      enunciado: `Em ${disciplinaNome}, como identificar se um conceito foi realmente compreendido?`,
      alternativas: [
        "A) Consegue repetir a definição de memória",
        "B) Consegue explicar com suas próprias palavras e aplicar a situações práticas",
        "C) Já leu sobre o tema uma vez no caderno",
        "D) Marcou todas as alternativas iguais nas questões anteriores",
      ],
      resposta_correta: 1,
      explicacao:
        "A capacidade de explicar e aplicar um conceito demonstra compreensão profunda, não apenas memorização.",
      dificuldade: "medio",
    },
  ];
  let idxFrase = 0;
  while (geradas.length < qtd) {
    const frase = frasesEstudo[idxFrase % frasesEstudo.length];
    idxFrase++;
    geradas.push({ ...frase });
  }

  return geradas.slice(0, qtd);
}

/**
 * Monta um simulado: banco primeiro, IA complementa, offline como último recurso.
 * Persiste as questões novas no banco e cria a linha em simulados_realizados.
 */
export async function montarSimulado(input: {
  autorLocalId: string;
  autorNome?: string;
  autorPolo?: string;
  disciplinaId: string;
  disciplinaNome: string;
  tipo: EtapaQuestao;
  conteudo?: string | undefined;
  quantidade?: number;
}): Promise<MontarResultado> {
  const qtd = Math.min(15, Math.max(10, input.quantidade ?? 12));

  const { pode, motivo } = await podeGerarSimulado(input.autorLocalId);
  if (!pode) return { ok: false, error: motivo ?? "Limite semanal atingido.", bloqueado: true };

  // 0. Provas antigas (opcional — usa como contexto para IA, mas não bloqueia)
  const provas = await listProvas(input.disciplinaId, input.tipo);
  const provasComTexto = provas.filter(
    (p) => p.texto_extraido && p.texto_extraido.trim().length > 100,
  );

  // Contexto real: trechos das provas (até ~4k chars cada, máx ~8k total)
  const contextoProvas =
    provasComTexto.length > 0
      ? provasComTexto
          .slice(0, 4)
          .map(
            (p, i) => `[PROVA ${i + 1} — ${p.titulo}]\n${(p.texto_extraido ?? "").slice(0, 4000)}`,
          )
          .join("\n\n")
          .slice(0, 8000)
      : "";

  // 1. Banco primeiro
  const doBanco = await buscarQuestoesBanco(input.disciplinaId, input.tipo, qtd);
  let modo: "banco" | "ia" | "misto" | "offline" = "banco";
  let todas: QuestaoBanco[] = [...doBanco];

  // 2. Complementa com IA baseada nas provas reais
  if (todas.length < qtd) {
    const faltam = qtd - todas.length;
    const disc = disciplinas.find((d) => d.id === input.disciplinaId);
    const aulasStr = (disc?.aulas ?? [])
      .map((a) => `Aula ${a.numero}: ${a.titulo}`)
      .join("; ");
    const avaliacoesStr = (disc?.avaliacoes ?? [])
      .filter((a) => a.tipo === input.tipo)
      .map((a) => `${a.tipo} — ${a.conteudoCobrado}${a.observacoes ? ` (${a.observacoes})` : ""}`)
      .join("; ");
    const pubs = await listPublicacoes(input.disciplinaId);
    const pubsTitulos = pubs
      .filter((p) => p.titulo)
      .slice(0, 20)
      .map((p) => p.titulo)
      .join("; ");
    const conteudoEnriquecido = [
      input.conteudo,
      aulasStr ? `Aulas da disciplina: ${aulasStr}` : "",
      avaliacoesStr ? `Avaliações do tipo ${input.tipo}: ${avaliacoesStr}` : "",
      pubsTitulos ? `Materiais compartilhados pela turma: ${pubsTitulos}` : "",
      disc?.guia?.observacoes?.length
        ? `Observações do coordenador: ${disc.guia.observacoes.join("; ")}`
        : "",
    ]
      .filter(Boolean)
      .join("\n");
    const r = await gerarQuestoesIA({
      disciplinaId: input.disciplinaId,
      disciplinaNome: input.disciplinaNome,
      tipo: input.tipo,
      conteudo: conteudoEnriquecido || input.conteudo,
      quantidade: faltam,
      contextoProvas,
    });
    if (r.ok && r.questoes && r.questoes.length > 0) {
      const salvas = await salvarQuestoesBanco(input.disciplinaId, input.tipo, r.questoes);
      todas = [...todas, ...salvas];
      modo = doBanco.length > 0 ? "misto" : "ia";
    }
  }

  // 3. Completa com offline se ainda faltar (garante qtd cheia)
  if (todas.length < qtd) {
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

  todas = todas.slice(0, qtd);
  if (todas.length === 0) {
    return { ok: false, error: "Não foi possível montar o simulado. Tente de novo." };
  }

  // 4. Cria a linha do simulado (só ids)
  const row: SimuladoRow = {
    id: `sim-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    autor_local_id: input.autorLocalId,
    autor_nome: input.autorNome,
    autor_polo: input.autorPolo,
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
        autor_nome: row.autor_nome,
        autor_polo: row.autor_polo,
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

  track("simulado_gerado", {
    disciplinaId: input.disciplinaId,
    tipo: input.tipo,
    modo,
    qtd: todas.length,
  });
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

  track("simulado_corrigido", {
    disciplinaId: row.disciplina_id,
    tipo: row.tipo,
    nota,
    percentual,
  });
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
