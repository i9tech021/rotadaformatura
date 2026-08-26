// src/lib/academic.functions.ts
// Proxy de IA: roda NO SERVIDOR (server function), então a VITE_AI_API_KEY
// NUNCA vai para o bundle do navegador. O cliente só chama askAcademicAI().
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Modelo gratuito padrão da OpenRouter. Troque via VITE_AI_MODEL se quiser
// (ex.: nvidia/nemotron-3-ultra-550b-a55b:free, google/gemma-4-26b-a4b-it:free).
export const AI_MODEL =
  (import.meta.env.VITE_AI_MODEL as string) ||
  "nvidia/nemotron-3.5-lightning:free";

const SYSTEM_PROMPT = `Você é o "Tutor Rota da Formatura", assistente acadêmico de alunos do curso de Administração a distância do CEDERJ (semestre 2026-2).

Você ajuda o aluno a:
1. TIRAR DÚVIDAS SOBRE A MATÉRIA: explique conceitos do conteúdo de forma didática, com exemplos simples, como um monitor presencial.
2. ENTENDER O CRONOGRAMA: informe quais ADs/APs/questionários vêm aí, datas e conteúdo cobrado (use SOMENTE o que está no contexto).
3. DECIDIR O QUE ESTUDAR AGORA: com base nas próximas avaliações e no que já foi concluído (checkpoints), indique a próxima aula/atividade a fazer.
4. COMO ESTUDAR: sugira uma rotina (leitura do caderno didático, resolução dos EPs, revisão) ancorada no método de estudo da disciplina.

Regras:
- Responda em português, tom acolhedor e objetivo.
- Use SOMENTE disciplinas, datas, aulas e conteúdos que o aluno fornece no contexto. NÃO invente datas nem prazos.
- Para explicar conceitos específicos, você pode usar conhecimento geral, mas ancore sempre em "Aula X — Título" e nas páginas indicadas quando disponíveis.
- Se não souber uma data, diga "consulte o cronograma oficial na plataforma CEDERJ".
- Seja conciso e prático: prefira tópicos e passos a parágrafos longos.`;

export const askAcademicAI = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        question: z.string().min(1),
        context: z
          .object({
            resumo: z.string().optional(), // resumo da disciplina + próximos eventos
            history: z
              .array(
                z.object({
                  role: z.enum(["user", "assistant"]),
                  content: z.string(),
                }),
              )
              .optional(),
          })
          .optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const baseUrl = import.meta.env.VITE_AI_BASE_URL as string | undefined;
    const apiKey = import.meta.env.VITE_AI_API_KEY as string | undefined;

    const erroConexao =
      "A IA não está disponível agora. Verifique a configuração (VITE_AI_BASE_URL / VITE_AI_API_KEY).";
    const erroLimite =
      "Limite de requisições da IA atingido. Aguarde alguns instantes e tente novamente.";

    if (!baseUrl || !apiKey) {
      // Em deploy (Lovable) sem o servidor local, retorna aviso amigável.
      return { answer: erroConexao };
    }

    const systemContent = data.context?.resumo
      ? `${SYSTEM_PROMPT}\n\nCONTEXTO DO ALUNO:\n${data.context.resumo}`
      : SYSTEM_PROMPT;

    const messages = [
      { role: "system" as const, content: systemContent },
      ...(data.context?.history ?? []).map((m) => ({
        role: m.role,
        content: m.content,
      })),
      { role: "user" as const, content: data.question },
    ];

    // Modelos de raciocínio (CoT) devolvem o "processo de pensamento" junto.
    // Desliga o reasoning só neles, para não sujar a resposta do Tutor.
    const isReasoningModel = /(lightning|nemotron-3\.5|nemotron-3-ultra|reasoning|think|r1|o3|o4)/i.test(
      AI_MODEL,
    );
    const body: Record<string, unknown> = {
      model: AI_MODEL,
      messages,
      temperature: 0.5,
      max_tokens: 600,
    };
    if (isReasoningModel) body.reasoning = { enabled: false };

    try {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "X-Title": "Rota da Formatura",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        return { answer: res.status === 429 ? erroLimite : erroConexao };
      }

      const answer = await extrairResposta(res);
      if (!answer) return { answer: erroConexao };
      return { answer };
    } catch {
      return { answer: erroConexao };
    }
  });

/**
 * Gera link do Google Calendar para uma avaliação.
 */
export const generateCalendarLink = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        title: z.string(),
        date: z.string(),
        description: z.string(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { title, date, description } = data;
    const startDate = new Date(date);
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

    const formatDate = (d: Date) =>
      d.toISOString().replace(/-|:|\.\d\d\d/g, "");

    const url = new URL("https://www.google.com/calendar/render");
    url.searchParams.append("action", "TEMPLATE");
    url.searchParams.append("text", title);
    url.searchParams.append(
      "dates",
      `${formatDate(startDate)}/${formatDate(endDate)}`,
    );
    url.searchParams.append("details", description);
    url.searchParams.append("sf", "true");
    url.searchParams.append("output", "xml");

    return { url: url.toString() };
  });

/**
 * Extrai o texto da resposta do proxy, seja JSON único ou streaming SSE
 * (linhas `data: {json}` terminando em `data: [DONE]`). Suporta content em
 * `message.content` ou `delta.content`.
 */
async function extrairResposta(res: Response): Promise<string> {
  const text = await res.text();
  if (!text.includes("data:")) {
    try {
      const json = JSON.parse(text) as {
        choices?: { message?: { content?: string } }[];
      };
      return json.choices?.[0]?.message?.content?.trim() ?? "";
    } catch {
      return "";
    }
  }

  let content = "";
  for (const line of text.split("\n")) {
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
      content +=
        json.choices?.[0]?.message?.content ??
        json.choices?.[0]?.delta?.content ??
        "";
    } catch {
      // ignora linhas que não são JSON válido
    }
  }
  return content.trim();
}
