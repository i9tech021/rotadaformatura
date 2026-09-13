// src/lib/aiGabarito.functions.ts
// IA revisa a transcrição da prova (colada pelo aluno de outra IA)
// e monta o gabarito: questão → alternativas → resposta + explicação.
import { STUDY_GUIDES } from "../data/studyGuides";

const PRIMARY_MODEL =
  (import.meta.env as any).VITE_AI_MODEL || "openrouter/free";
const FALLBACK_MODEL = "inclusionai/ling-3.0-flash-sante:free";

export interface QuestaoGabarito {
  numero: number;
  enunciado: string;
  alternativas: string[];
  resposta_correta: number;
  explicacao: string;
  tipo: "objetiva" | "discursiva";
  resposta_modelo?: string;
}

export interface GerarGabaritoInput {
  disciplinaId: string;
  disciplinaNome: string;
  etapa: string;
  textoTranscrito: string;
}

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
        choices?: { message?: { content?: string }; delta?: { content?: string } }[];
      };
      content += json.choices?.[0]?.message?.content ?? json.choices?.[0]?.delta?.content ?? "";
    } catch {}
  }
  return content.trim();
}

function extrairJsonStrict(texto: string): { questoes?: unknown[] } | null {
  const limpo = texto
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/, "")
    .replace(/\s*```$/, "");
  try {
    const parsed = JSON.parse(limpo);
    if (parsed && Array.isArray(parsed.questoes)) return parsed;
  } catch {}
  // tenta blocos {...}
  const guloso = limpo.match(/\{[\s\S]*\}/);
  if (guloso) {
    try {
      const parsed = JSON.parse(guloso[0]);
      if (parsed && Array.isArray(parsed.questoes)) return parsed;
    } catch {}
  }
  return null;
}

function validarQuestao(raw: unknown, idx: number): QuestaoGabarito | null {
  if (!raw || typeof raw !== "object") return null;
  const q = raw as Record<string, unknown>;

  const enunciado = [q.enunciado, q.texto, q.pergunta].find(
    (v) => typeof v === "string" && v.trim().length >= 5,
  );
  if (!enunciado) return null;

  const tipoRaw = String(q.tipo ?? "objetiva").toLowerCase();
  const tipo = tipoRaw.includes("discurs") ? "discursiva" : "objetiva";

  const altsRaw = q.alternativas ?? q.opcoes;
  let alts: string[] = [];
  if (Array.isArray(altsRaw)) {
    alts = altsRaw.map(String).filter((a) => a.trim().length > 0);
  } else if (altsRaw && typeof altsRaw === "object") {
    alts = ["A", "B", "C", "D", "E"]
      .filter((k) => typeof (altsRaw as Record<string, unknown>)[k] === "string")
      .map((k) => `${k}) ${String((altsRaw as Record<string, unknown>)[k]).trim()}`);
  }

  let respIdx = 0;
  const respRaw = q.resposta_correta ?? q.resposta ?? q.gabarito;
  if (typeof respRaw === "number") {
    respIdx = respRaw;
  } else if (typeof respRaw === "string") {
    const letra = /^[A-Ea-e]/.exec(respRaw.trim());
    if (letra) respIdx = "ABCDE".indexOf(letra[0].toUpperCase());
    else {
      const n = parseInt(respRaw, 10);
      if (!isNaN(n)) respIdx = n;
    }
  }

  const explicacao = String(q.explicacao ?? q.justificativa ?? "");
  const respostaModelo = q.resposta_modelo ? String(q.resposta_modelo) : undefined;

  return {
    numero: idx + 1,
    enunciado: String(enunciado).trim(),
    alternativas: tipo === "objetiva" ? alts.slice(0, 4) : [],
    resposta_correta: Math.min(respIdx, Math.max(alts.length - 1, 0)),
    explicacao: explicacao.trim(),
    tipo,
    resposta_modelo: respostaModelo,
  };
}

/**
 * IA revisa a transcrição e monta o gabarito.
 * Fluxo: transcrição → IA valida/estrange → gabarito JSON → questões validadas.
 */
export async function gerarGabaritoIA(
  input: GerarGabaritoInput,
): Promise<{ ok: boolean; questoes?: QuestaoGabarito[]; error?: string }> {
  const env = import.meta.env as any;
  const baseUrl = env.VITE_AI_BASE_URL || "https://openrouter.ai/api/v1";
  const apiKey = env.VITE_AI_API_KEY;

  if (!apiKey) return { ok: false, error: "IA não configurada." };

  // Busca guia de estudo se disponível
  const guide = STUDY_GUIDES.find(
    (g) => g.disciplinaId === input.disciplinaId && g.provaTipo === input.etapa,
  );

  const guideContext = guide
    ? `\nCONTEÚDO COBRADO NESTA PROVA (use pra validar e enriquecer explicações):\n- ${guide.conteudocobrado.join("\n- ")}\n\nTÓPICOS CHAVE: ${guide.topicsChave.join(", ")}`
    : "";

  const prompt = `Você é um professor do CEDERJ (Administração). Um aluno transcreveu uma prova usando outra IA e pediu pra você REVISAR e montar o GABARITO.

PROVA TRANSCRITA PELO ALUNO:
${input.textoTranscrito}
${guideContext}

SUA TAREFA:
1. LEIA a transcrição com atenção — pode ter erros de OCR/transcrição (letras trocadas, faltando, etc.)
2. CORRIJA erros óbvios de transcrição no enunciado de cada questão
3. IDENTIFIQUE se cada questão é objetiva (múltipla escolha) ou discursiva
4. Para questões OBJETIVAS: identifique as alternativas (A, B, C, D) e a resposta correta + explicação
5. Para questões DISCURSIVAS: forneça uma resposta modelo + passo a passo de como resolver

Responda SOMENTE com JSON válido, sem markdown, neste formato:
{"questoes":[{"numero":1,"enunciado":"...","alternativas":["A) ...","B) ...","C) ...","D) ..."],"resposta_correta":0,"explicacao":"...","tipo":"objetiva"},{"numero":N,"enunciado":"...","alternativas":[],"resposta_correta":0,"explicacao":"...","tipo":"discursiva","resposta_modelo":"..."}]}

Regras:
- "numero" é a ordem da questão na prova (1, 2, 3...)
- "resposta_correta" é o índice 0-3 da alternativa certa (0 para discursiva)
- "tipo" é "objetiva" ou "discursiva"
- Para discursiva, inclua "resposta_modelo" com a resposta completa
- Explicações devem ser didáticas, em 2-3 frases, explicando o porquê
- Se a transcrição estiver ilegível, pule a questão e siga para a próxima
- NÃO invente questões — use APENAS as que estão na transcrição`;

  const models = [PRIMARY_MODEL, ...(PRIMARY_MODEL !== FALLBACK_MODEL ? [FALLBACK_MODEL] : [])];

  for (const model of models) {
    try {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "X-Title": "Rota da Formatura - Gabarito",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
          max_tokens: 15000,
          reasoning: { enabled: false },
        }),
      });

      if (res.ok) {
        const texto = await res.text();
        const conteudo = extrairConteudoResposta(texto);
        if (conteudo) {
          const json = extrairJsonStrict(conteudo);
          if (json && Array.isArray(json.questoes)) {
            const validas = json.questoes
              .map((q, i) => validarQuestao(q, i))
              .filter((q): q is QuestaoGabarito => q !== null);
            if (validas.length > 0) {
              // Renumerar para garantir sequência
              const renumeradas = validas.map((q, i) => ({ ...q, numero: i + 1 }));
              return { ok: true, questoes: renumeradas };
            }
          }
        }
        continue;
      }
      if (res.status === 429 || res.status >= 500) continue;
      return { ok: false, error: `IA erro ${res.status}.` };
    } catch {
      continue;
    }
  }

  return { ok: false, error: "Falha de conexão com a IA." };
}
