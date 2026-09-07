// src/lib/questoesService.ts
// Banco de questões reutilizável: busca no banco primeiro, complementa via IA,
// valida o JSON e salva as novas no banco (o banco cresce a cada geração).
import { getSupabase } from "./supabase";

export type EtapaQuestao = "AD1" | "AP1" | "AD2" | "AP2";
export type Dificuldade = "facil" | "medio" | "dificil";

export const ETAPAS_QUESTAO: EtapaQuestao[] = ["AD1", "AP1", "AD2", "AP2"];

export interface QuestaoBanco {
  id: string;
  disciplina_id: string;
  enunciado: string;
  alternativas: string[];
  resposta_correta: number;
  explicacao: string;
  tipo: EtapaQuestao;
  dificuldade: Dificuldade;
  fonte?: string | undefined | null;
  criado_em?: string | undefined;
}

export interface QuestaoGerada {
  enunciado: string;
  alternativas: string[];
  resposta_correta: number;
  explicacao: string;
  dificuldade: Dificuldade;
}

// ============================================================
// Espelho local (quando Supabase não configurado)
// ============================================================
const LS_BANK_KEY = "rdf:questoes-bank";

function loadBankLocal(): QuestaoBanco[] {
  try {
    return JSON.parse(localStorage.getItem(LS_BANK_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveBankLocal(bank: QuestaoBanco[]) {
  localStorage.setItem(LS_BANK_KEY, JSON.stringify(bank));
}

function rowToQuestao(r: {
  id: string;
  disciplina_id: string;
  enunciado: string;
  alternativas: unknown;
  resposta_correta: number;
  explicacao: string | null;
  tipo: string;
  dificuldade?: string | null;
  fonte?: string | null;
  criado_em?: string;
}): QuestaoBanco {
  return {
    id: r.id,
    disciplina_id: r.disciplina_id,
    enunciado: r.enunciado,
    alternativas: Array.isArray(r.alternativas) ? r.alternativas.map(String) : [],
    resposta_correta: Number(r.resposta_correta) || 0,
    explicacao: r.explicacao || "",
    tipo: (r.tipo as EtapaQuestao) || "AP1",
    dificuldade: (["facil", "medio", "dificil"] as Dificuldade[]).includes(
      r.dificuldade as Dificuldade,
    )
      ? (r.dificuldade as Dificuldade)
      : "medio",
    fonte: r.fonte,
    criado_em: r.criado_em,
  };
}

/** Busca questões do banco (embaralhadas) para disciplina + etapa. */
export async function buscarQuestoesBanco(
  disciplinaId: string,
  tipo: EtapaQuestao,
  qtd: number,
): Promise<QuestaoBanco[]> {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb
      .from("questoes")
      .select("*")
      .eq("disciplina_id", disciplinaId)
      .eq("tipo", tipo);
    if (!error && data && data.length > 0) {
      return embaralhar(data.map(rowToQuestao)).slice(0, qtd);
    }
  }
  const local = loadBankLocal().filter((q) => q.disciplina_id === disciplinaId && q.tipo === tipo);
  return embaralhar(local).slice(0, qtd);
}

export function embaralhar<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j] as T, a[i] as T];
  }
  return a;
}

/** Valida UMA questão vinda da IA. Tolerante a variações de schema
 *  (enunciado|texto|pergunta; alternativas|opcoes; índice ou texto da resposta).
 *  Retorna null se inválida. */
export function validarQuestao(raw: unknown): QuestaoGerada | null {
  if (!raw || typeof raw !== "object") return null;
  const q = raw as {
    enunciado?: unknown;
    texto?: unknown;
    pergunta?: unknown;
    questao?: unknown;
    alternativas?: unknown;
    opcoes?: unknown;
    options?: unknown;
    alternatives?: unknown;
    resposta_correta?: unknown;
    resposta?: unknown;
    correta?: unknown;
    answer?: unknown;
    resplicacao?: unknown;
    gabarito?: unknown;
    explicacao?: unknown;
    explanation?: unknown;
    justificativa?: unknown;
    dificuldade?: unknown;
  };

  const enunciado =
    [q.enunciado, q.texto, q.pergunta, q.questao].find(
      (v) => typeof v === "string" && v.trim().length >= 10,
    ) ?? null;
  if (!enunciado || typeof enunciado !== "string") return null;

  const altsRaw = [q.alternativas, q.opcoes, q.options, q.alternatives].find((v) =>
    Array.isArray(v),
  ) as unknown[] | undefined;
  let alts: string[];
  if (altsRaw) {
    alts = altsRaw.map(String).filter((a) => a.trim().length > 0);
  } else {
    // alternativas como objeto {"A": "...", "B": "..."} — converte em ordem A-E
    const objAlts = [q.alternativas, q.opcoes, q.options, q.alternatives].find(
      (v) => v && typeof v === "object" && !Array.isArray(v),
    ) as Record<string, unknown> | undefined;
    if (!objAlts) return null;
    alts = ["A", "B", "C", "D", "E"]
      .filter((k) => typeof objAlts[k] === "string" && (objAlts[k] as string).trim())
      .map((k) => `${k}) ${String(objAlts[k]).trim()}`);
  }
  if (alts.length < 2) return null;
  const respRaw = [
    q.resposta_correta,
    q.resposta,
    q.correta,
    q.answer,
    q.resplicacao,
    q.gabarito,
  ].find((v) => v !== undefined && v !== null);
  let idx = -1;
  if (typeof respRaw === "number") {
    idx = respRaw;
  } else if (typeof respRaw === "string") {
    const t = respRaw.trim();
    // letra isolada ("B", "c)") ou número ("2") → posição direta
    const letra = /^[A-Ea-e][).\-:]?\s*$/.exec(t) ?? /^([1-4])\s*$/.exec(t);
    if (letra) {
      const c = letra[1]?.toUpperCase() ?? "";
      idx = "ABCDE".includes(c) ? "ABCDE".indexOf(c) : parseInt(c, 10) - 1;
    } else {
      const comoNumero = parseInt(t, 10);
      if (!Number.isNaN(comoNumero) && String(comoNumero) === t) {
        idx = comoNumero;
      } else {
        const normaliza = (s: string) =>
          s
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/^[(]?[a-d1-4][).\-:]\s*/, "")
            .trim();
        const alvo = normaliza(t);
        idx = alts.findIndex((a) => {
          const n = normaliza(a);
          return n === alvo || (alvo.length > 12 && (n.includes(alvo) || alvo.includes(n)));
        });
      }
    }
  }
  if (idx < 0 || idx >= alts.length) return null;

  const expRaw = [q.explicacao, q.explanation, q.justificativa].find((v) => typeof v === "string");
  const difRaw = typeof q.dificuldade === "string" ? q.dificuldade.toLowerCase() : "";
  const dif = difRaw.includes("facil") ? "facil" : difRaw.includes("dific") ? "dificil" : "medio";
  return {
    enunciado: (enunciado as string).trim(),
    alternativas: alts.slice(0, 4),
    resposta_correta: Math.min(idx, alts.slice(0, 4).length - 1),
    explicacao: typeof expRaw === "string" ? expRaw.trim() : "",
    dificuldade: dif as Dificuldade,
  };
}

/** Extrai o primeiro objeto JSON válido do texto (robusto a markdown/prosa). */
export function extrairJsonStrict(texto: string): { questoes?: unknown[] } | null {
  const limpo = texto
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/, "")
    .replace(/\s*```$/, "");
  // LLMs emitem quebras literais e barras solitárias (ex.: "R \ {0}" em
  // matemática) — ambas invalidam o JSON. Sanitiza antes de tentar.
  // (escapes legítimos "\n" são 2 chars e não são afetados)
  let semControle = "";
  for (const ch of limpo) {
    const code = ch.codePointAt(0) ?? 32;
    semControle += code < 32 ? " " : ch;
  }
  const sanearBarras = (s: string) => s.replace(/\\(?![/bfnrtu"])/g, "\\\\");
  for (const tentativa of [limpo, semControle, sanearBarras(semControle)]) {
    try {
      return JSON.parse(tentativa);
    } catch {
      // tenta todos os blocos {...} do maior para o menor
      const candidatos: string[] = [];
      const re = /\{[\s\S]*?\n\}/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(tentativa)) !== null) candidatos.push(m[0]);
      // + fallback guloso
      const guloso = tentativa.match(/\{[\s\S]*\}/);
      if (guloso) candidatos.unshift(guloso[0]);
      for (const c of candidatos) {
        try {
          const parsed = JSON.parse(c);
          if (parsed && Array.isArray(parsed.questoes)) return parsed;
        } catch {
          // tenta o próximo
        }
      }
    }
  }
  // Último recurso: JSON truncado (finish:length) — recupera questões
  // completas por escaneamento de chaves balanceadas no array "questoes".
  const parcial = extrairQuestoesParciais(sanearBarras(semControle));
  if (parcial.length > 0) return { questoes: parcial };
  return null;
}

/**
 * Extrai o texto da mensagem do envelope da API (JSON único ou streaming SSE).
 * Mesma lógica do tutor (academic.functions), essencial: sem isso estaríamos
 * tentando ler o envelope como se fosse o conteúdo.
 */
function extrairConteudoResposta(texto: string): string {
  if (!texto.includes("data:")) {
    try {
      const json = JSON.parse(texto) as {
        choices?: { message?: { content?: string } }[];
      };
      return json.choices?.[0]?.message?.content?.trim() ?? "";
    } catch {
      return texto.trim();
    }
  }
  let content = "";
  for (const line of texto.split("\n")) {
    const s = line.trim();
    if (!s.startsWith("data:")) continue;
    const d = s.slice(5).trim();
    if (d === "[DONE]") continue;
    try {
      const json = JSON.parse(d) as {
        choices?: {
          message?: { content?: string };
          delta?: { content?: string };
        }[];
      };
      content += json.choices?.[0]?.message?.content ?? json.choices?.[0]?.delta?.content ?? "";
    } catch {
      // ignora linhas inválidas
    }
  }
  return content.trim();
}

function extrairQuestoesParciais(texto: string): unknown[] {
  const inicio = texto.indexOf('"questoes"');
  if (inicio === -1) return [];
  const arrStart = texto.indexOf("[", inicio);
  if (arrStart === -1) return [];
  const out: unknown[] = [];
  let i = arrStart + 1;
  const n = texto.length;
  while (i < n) {
    while (i < n && texto[i] !== "{") i++;
    if (i >= n) break;
    let depth = 0;
    let inStr = false;
    let esc = false;
    const start = i;
    while (i < n) {
      const ch = texto[i] as string;
      if (inStr) {
        if (esc) esc = false;
        else if (ch === "\\") esc = true;
        else if (ch === '"') inStr = false;
      } else if (ch === '"') {
        inStr = true;
      } else if (ch === "{") {
        depth++;
      } else if (ch === "}") {
        depth--;
        if (depth === 0) {
          i++;
          break;
        }
      }
      i++;
    }
    if (depth === 0) {
      try {
        const obj: unknown = JSON.parse(texto.slice(start, i));
        if (obj && typeof obj === "object") out.push(obj);
      } catch {
        // objeto incompleto — ignora
      }
    } else {
      break; // truncado no meio do objeto — para
    }
  }
  return out;
}

/**
 * Gera questões inéditas via IA (OpenRouter, mesmo padrão do tutor).
 * Retorna APENAS questões validadas.
 */
export async function gerarQuestoesIA(input: {
  disciplinaId: string;
  disciplinaNome: string;
  tipo: EtapaQuestao;
  conteudo?: string | undefined;
  quantidade: number;
  /** Textos de provas antigas reais — a IA baseia as questões neles. */
  contextoProvas?: string;
}): Promise<{ ok: boolean; questoes?: QuestaoGerada[]; error?: string }> {
  const baseUrl = (import.meta.env["VITE_AI_BASE_URL"] as string) || "https://openrouter.ai/api/v1";
  const apiKey = import.meta.env["VITE_AI_API_KEY"] as string | undefined;
  const model =
    (import.meta.env["VITE_AI_MODEL"] as string) || "nvidia/nemotron-3.5-lightning:free";

  if (!apiKey) return { ok: false, error: "IA não configurada (VITE_AI_API_KEY)." };

  const qtd = input.quantidade;
  const etapaLabel =
    input.tipo === "AD1" || input.tipo === "AD2"
      ? "atividade a distância (objetiva, para fazer em casa)"
      : "prova presencial (conteúdo cobrado em prova, nível de AP real)";

  const prompt = `Você é um professor do CEDERJ (Administração). Gere ${qtd} questões INÉDITAS de múltipla escolha para ${input.tipo} (${etapaLabel}) da disciplina "${input.disciplinaNome}".${input.conteudo ? `\nConteúdo cobrado: ${input.conteudo}` : ""}
${input.contextoProvas ? `\nPROVAS ANTIGAS REAIS DE REFERÊNCIA (baseie-se no estilo, nos temas e no nível destas provas — NÃO copie questões inteiras, crie variações inéditas):\n${input.contextoProvas}` : ""}

Responda SOMENTE com JSON válido, sem markdown, sem texto antes ou depois, neste formato exato:
{"questoes":[{"enunciado":"...","alternativas":["A) ...","B) ...","C) ...","D) ..."],"resposta_correta":0,"explicacao":"...","dificuldade":"medio"}]}

Regras obrigatórias:
- Exatamente ${qtd} questões, 4 alternativas cada, apenas UMA correta.
- "resposta_correta" é o índice 0-3 da alternativa certa.
- "dificuldade" é "facil", "medio" ou "dificil" (misture: ~30% facil, ~50% medio, ~20% dificil).
- Questões práticas no nível de prova real do CEDERJ, sem pegadinhas de enunciado ambíguo.
- Explicação objetiva em 1-2 frases.
- Exemplo de UMA questão no formato exato:
{"enunciado":"Quanto é 2+2?","alternativas":["A) 3","B) 4","C) 5","D) 6"],"resposta_correta":1,"explicacao":"2+2=4.","dificuldade":"facil"}`;

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
        max_tokens: 12000,
        reasoning: { enabled: false },
      }),
    });
    if (!res.ok) {
      return {
        ok: false,
        error: res.status === 429 ? "Limite da IA atingido." : `IA erro ${res.status}.`,
      };
    }
    const texto = await res.text();
    // Extrai o conteúdo da mensagem do envelope da API (JSON ou SSE).
    const conteudo = extrairConteudoResposta(texto);
    if (!conteudo) {
      return { ok: false, error: "Resposta vazia da IA." };
    }
    const json = extrairJsonStrict(conteudo);
    if (!json || !Array.isArray(json.questoes)) {
      return { ok: false, error: "IA não retornou JSON válido." };
    }
    const validas = json.questoes
      .map(validarQuestao)
      .filter((q): q is QuestaoGerada => q !== null)
      .slice(0, qtd);
    if (validas.length === 0) return { ok: false, error: "Nenhuma questão válida retornada." };
    return { ok: true, questoes: validas };
  } catch {
    return { ok: false, error: "Falha de conexão com a IA." };
  }
}

/** Salva questões geradas no banco (o banco cresce a cada geração). */
export async function salvarQuestoesBanco(
  disciplinaId: string,
  tipo: EtapaQuestao,
  geradas: QuestaoGerada[],
  fonte = "Simulado IA",
): Promise<QuestaoBanco[]> {
  const novas: QuestaoBanco[] = geradas.map((g, i) => ({
    id: `q-${Date.now().toString(36)}-${i}-${Math.random().toString(36).slice(2, 6)}`,
    disciplina_id: disciplinaId,
    enunciado: g.enunciado,
    alternativas: g.alternativas,
    resposta_correta: g.resposta_correta,
    explicacao: g.explicacao,
    tipo,
    dificuldade: g.dificuldade,
    fonte,
    criado_em: new Date().toISOString(),
  }));

  const sb = getSupabase();
  if (sb) {
    const { error } = await sb.from("questoes").insert(
      novas.map((q) => ({
        id: q.id,
        disciplina_id: q.disciplina_id,
        enunciado: q.enunciado,
        alternativas: q.alternativas,
        resposta_correta: q.resposta_correta,
        explicacao: q.explicacao,
        tipo: q.tipo,
        dificuldade: q.dificuldade,
        fonte: q.fonte,
      })),
    );
    if (error) {
      // cai no espelho local, mas ainda retorna as questões
      const local = loadBankLocal();
      saveBankLocal([...novas, ...local]);
    }
  } else {
    const local = loadBankLocal();
    saveBankLocal([...novas, ...local]);
  }
  return novas;
}

/** Busca questão do banco por id (para correção/histórico). */
export async function buscarQuestaoPorId(id: string): Promise<QuestaoBanco | null> {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb.from("questoes").select("*").eq("id", id).single();
    if (!error && data) return rowToQuestao(data);
  }
  return loadBankLocal().find((q) => q.id === id) ?? null;
}

/** Busca várias questões por ids (ordem preservada). */
export async function buscarQuestoesPorIds(ids: string[]): Promise<QuestaoBanco[]> {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb.from("questoes").select("*").in("id", ids);
    if (!error && data) {
      const mapa = new Map(
        (data as Parameters<typeof rowToQuestao>[0][]).map((r) => [r.id, rowToQuestao(r)]),
      );
      return ids.map((id) => mapa.get(id)).filter((q): q is QuestaoBanco => !!q);
    }
  }
  const local = new Map(loadBankLocal().map((q) => [q.id, q]));
  return ids.map((id) => local.get(id)).filter((q): q is QuestaoBanco => !!q);
}
