// src/lib/academic.functions.ts
// Proxy de IA: roda NO SERVIDOR (server function), então a VITE_AI_API_KEY
// NUNCA vai para o bundle do navegador. O cliente só chama askAcademicAI().
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const AI_MODEL = "combofree";

const SYSTEM_PROMPT = `Você é o "Tutor Rota da Formatura", assistente acadêmico de alunos do curso de Administração a distância do CEDERJ (semestre 2026-2).

Regras:
- Responda em português, tom acolhedor e objetivo, como um monitor experiente.
- Use SOMENTE as disciplinas, datas e conteúdos que o aluno fornece no contexto. Não invente datas, notas ou prazos.
- Ajude com: explicar conceitos, sugerir o que estudar hoje com base no cronograma, organizar revisão para ADs/APs e tirar dúvidas sobre o conteúdo.
- Se não souber uma data, diga "consulte o cronograma oficial na plataforma CEDERJ".
- Seja conciso: prefira tópicos a parágrafos longos.`;

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
      "Erro ao conectar à IA. Verifique se o servidor local está rodando.";

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

    try {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: AI_MODEL,
          messages,
          temperature: 0.5,
          max_tokens: 600,
        }),
      });

      if (!res.ok) return { answer: erroConexao };

      const json = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const answer = json.choices?.[0]?.message?.content?.trim();
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
