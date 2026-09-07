// src/lib/simuladoService.ts
// Simulador de provas — geração por IA, controle de 1/semana, correção automática.
// Padrão: Supabase (tabelas simulados_realizados / questoes) + localStorage fallback.
import { getSupabase, isSupabaseConfigured } from "./supabase";

export interface Questao {
  id: string;
  disciplina_id: string;
  enunciado: string;
  alternativas: string[]; // ["A) ...", "B) ...", "C) ...", "D) ..."]
  resposta_correta: number; // índice 0-3
  explicacao: string;
  tipo: "AD" | "AP";
  fonte?: string;
}

export interface SimuladoRealizado {
  id: string;
  user_id: string;
  disciplina_id: string;
  questoes: Questao[];
  respostas: (number | null)[];
  acertos: number;
  total: number;
  percentual: number;
  criado_em: string;
}

export type GerarResultado =
  | { ok: true; simulado: SimuladoRealizado; modo: "ia" }
  | { ok: false; error: string; bloqueado?: boolean };

const LS_KEY = "rdf:simulados";
const USER_DEFAULT = "anon";

function loadLocal(): SimuladoRealizado[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveLocal(lista: SimuladoRealizado[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(lista));
}

function getUserId(): string {
  try {
    let id = localStorage.getItem("rdf:student_id");
    if (!id) {
      id = `student-${Date.now().toString(36)}`;
      localStorage.setItem("rdf:student_id", id);
    }
    return id;
  } catch {
    return USER_DEFAULT;
  }
}

/** Verifica se o usuário já fez simulado nesta semana (limite de 1). */
export async function podeGerar(): Promise<{ pode: boolean; motivo?: string }> {
  const userId = getUserId();
  const inicioSemana = new Date();
  inicioSemana.setHours(0, 0, 0, 0);
  const dia = inicioSemana.getDay(); // 0=domingo
  const diff = dia === 0 ? 6 : dia - 1; // segundas-feiras
  inicioSemana.setDate(inicioSemana.getDate() - diff);

  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb
      .from("simulados_realizados")
      .select("id")
      .eq("user_id", userId)
      .gte("criado_em", inicioSemana.toISOString());
    if (!error && data && data.length > 0) {
      return {
        pode: false,
        motivo: "Você já realizou 1 simulado esta semana. Novo disponível na segunda-feira.",
      };
    }
  }

  const locais = loadLocal().filter(
    (s) => s.user_id === userId && new Date(s.criado_em) >= inicioSemana,
  );
  if (locais.length > 0) {
    return {
      pode: false,
      motivo: "Você já realizou 1 simulado esta semana. Novo disponível na segunda-feira.",
    };
  }
  return { pode: true };
}

/**
 * Gera um simulado inédito por IA (OpenRouter, mesmo padrão do tutor).
 * O modelo devolve um JSON com questões no formato CEDERJ.
 */
export async function gerarSimuladoIA(input: {
  disciplinaId: string;
  disciplinaNome: string;
  tipo: "AD" | "AP";
  quantidade?: number;
  conteudoCobrado?: string | undefined;
}): Promise<GerarResultado> {
  // 1. Limite semanal
  const { pode, motivo } = await podeGerar();
  if (!pode) {
    return { ok: false, error: motivo ?? "Limite semanal atingido", bloqueado: true };
  }
  const baseUrl = (import.meta.env["VITE_AI_BASE_URL"] as string) || "https://openrouter.ai/api/v1";
  const apiKey = import.meta.env["VITE_AI_API_KEY"] as string | undefined;
  const model =
    (import.meta.env["VITE_AI_MODEL"] as string) || "nvidia/nemotron-3.5-lightning:free";

  if (!apiKey) {
    return {
      ok: false,
      error: "IA não configurada para gerar simulados. Defina VITE_AI_API_KEY.",
    };
  }

  const qtd = Math.min(10, Math.max(4, input.quantidade ?? 8));

  const prompt = `Você é um professor do CEDERJ. Gere um simulado inédito de ${input.tipo}
para a disciplina ADMINISTRAÇÃO: "${input.disciplinaNome}"${input.conteudoCobrado ? `\nConteúdo cobrado: ${input.conteudoCobrado}` : ""}.

Crie exatamente ${qtd} questões de múltipla escolha, no formato de prova presencial.

RETORNE APENAS JSON válido, sem markdown, sem texto extra, neste formato EXATO:
{
  "questoes": [
    {
      "enunciado": "texto da questão",
      "alternativas": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "resposta_correta": 0,
      "explicacao": "passo a passo de por que é essa resposta"
    }
  ]
}

Regras:
- 4 alternativas por questão, apenas uma correta.
- Questões práticas, nível de prova real (não triviais).
- "resposta_correta" é o índice (0-3) da alternativa certa.
- ${
    input.tipo === "AP"
      ? "Provas AP são discursivas na vida real, mas aqui simule como objetivas de múltipla escolha com o conteúdo da AP."
      : "Questões objetivas típicas de AD."
  }`;

  let data: { questoes: Omit<Questao, "id" | "disciplina_id" | "tipo" | "fonte">[] };
  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "X-Title": "Rota da Formatura",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!res.ok) {
      if (res.status === 429)
        return { ok: false, error: "Limite da IA atingido. Tente em instantes." };
      return { ok: false, error: `Falha na geração (erro ${res.status}).` };
    }

    const texto = await res.text();
    const json = extrairJson(texto);
    if (!json || !Array.isArray(json.questoes) || json.questoes.length === 0) {
      return { ok: false, error: "A IA não retornou questões válidas. Tente de novo." };
    }
    data = json as typeof data;

    // Sanitiza alternativas e índice
    const questoes: Questao[] = data.questoes
      .slice(0, qtd)
      .map((q, i) => ({
        id: `q-${Date.now()}-${i}`,
        disciplina_id: input.disciplinaId,
        enunciado: String(q.enunciado ?? ""),
        alternativas: (Array.isArray(q.alternativas) ? q.alternativas : []).map(String).slice(0, 4),
        resposta_correta: clampIndex(
          q.resposta_correta,
          (Array.isArray(q.alternativas) ? q.alternativas : []).length,
        ),
        explicacao: String(q.explicacao ?? ""),
        tipo: input.tipo,
        fonte: "Simulado IA",
      }))
      .filter((q) => q.enunciado && q.alternativas.length >= 2);

    if (questoes.length === 0)
      return { ok: false, error: "A IA não retornou questões válidas. Tente de novo." };

    const simulado = await persistir(questoes, new Array(questoes.length).fill(null));
    return { ok: true, simulado, modo: "ia" };
  } catch {
    return { ok: false, error: "Erro de conexão com a IA. Tente de novo." };
  }
}

function clampIndex(v: unknown, nAlt: number): number {
  const n = typeof v === "number" ? v : parseInt(String(v), 10);
  if (Number.isNaN(n) || n < 0) return 0;
  return Math.min(n, Math.max(0, nAlt - 1));
}

function extrairJson(texto: string): { questoes?: unknown[] } | null {
  const limpo = texto.trim();
  try {
    return JSON.parse(limpo);
  } catch {
    // tenta isolar o primeiro {...} ou [...] com JSON
    const m = limpo.match(/\{[\s\S]*\}/);
    if (m) {
      try {
        return JSON.parse(m[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

/** Registra simulado no banco + localStorage. Retorna o objeto persistido. */
async function persistir(
  questoes: Questao[],
  respostas: (number | null)[],
): Promise<SimuladoRealizado> {
  const simulado: SimuladoRealizado = {
    id: `sim-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    user_id: getUserId(),
    disciplina_id: questoes[0]?.disciplina_id ?? "",
    questoes,
    respostas,
    acertos: 0,
    total: questoes.length,
    percentual: 0,
    criado_em: new Date().toISOString(),
  };

  const sb = getSupabase();
  if (sb) {
    await sb.from("simulados_realizados").upsert({
      id: simulado.id,
      user_id: simulado.user_id,
      disciplina_id: simulado.disciplina_id,
      questoes: questoes.map((q) => ({ ...q })),
      respostas,
      acertos: 0,
      total: questoes.length,
      percentual: 0,
      criado_em: simulado.criado_em,
    });
  }

  const local = loadLocal();
  local.unshift(simulado);
  saveLocal(local);
  return simulado;
}

/** Corrige as respostas e retorna o simulado atualizado. */
export async function corrigirSimulado(
  simuladoId: string,
  respostas: (number | null)[],
): Promise<SimuladoRealizado | null> {
  // Encontra localmente (ou do banco)
  let simulado = loadLocal().find((s) => s.id === simuladoId);
  if (!simulado) {
    // se Supabase configurado, busca lá
    const sb = getSupabase();
    if (sb) {
      const { data } = await sb
        .from("simulados_realizados")
        .select("*")
        .eq("id", simuladoId)
        .single();
      if (data) {
        simulado = {
          id: data.id as string,
          user_id: data.user_id as string,
          disciplina_id: data.disciplina_id as string,
          questoes: (data.questoes as Questao[]) ?? [],
          respostas: (data.respostas as (number | null)[]) ?? [],
          acertos: (data.acertos as number) ?? 0,
          total: (data.total as number) ?? 0,
          percentual: (data.percentual as number) ?? 0,
          criado_em: data.criado_em as string,
        };
      }
    }
  }
  if (!simulado) return null;

  const marcadas = respostas.slice(0, simulado.questoes.length);
  let acertos = 0;
  simulado.questoes.forEach((q, i) => {
    if (marcadas[i] != null && marcadas[i] === q.resposta_correta) acertos++;
  });

  const total = simulado.questoes.length;
  const percentual = total ? Math.round((acertos / total) * 100) : 0;

  const atualizado: SimuladoRealizado = {
    ...simulado,
    respostas: marcadas,
    acertos,
    percentual,
  };

  // Persiste
  const locais = loadLocal().map((s) => (s.id === atualizado.id ? atualizado : s));
  saveLocal(locais);

  const sb = getSupabase();
  if (sb) {
    await sb
      .from("simulados_realizados")
      .update({ respostas: marcadas, acertos, percentual })
      .eq("id", simuladoId);
  }

  return atualizado;
}

/** Histórico de simulados do usuário. */
export async function listarSimulados(): Promise<SimuladoRealizado[]> {
  const userId = getUserId();
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb
      .from("simulados_realizados")
      .select("*")
      .eq("user_id", userId)
      .order("criado_em", { ascending: false });
    if (!error && data && data.length > 0) {
      return data.map((s) => ({
        id: s.id as string,
        user_id: s.user_id as string,
        disciplina_id: s.disciplina_id as string,
        questoes: (s.questoes as Questao[]) ?? [],
        respostas: (s.respostas as (number | null)[]) ?? [],
        acertos: (s.acertos as number) ?? 0,
        total: (s.total as number) ?? 0,
        percentual: (s.percentual as number) ?? 0,
        criado_em: s.criado_em as string,
      }));
    }
  }
  return loadLocal().filter((s) => s.user_id === userId);
}

export { isSupabaseConfigured };
