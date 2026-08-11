import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Mock da integração com IA para responder dúvidas do aluno.
 * Recebe a pergunta e o contexto do dashboard.
 */
export const askAcademicAI = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        question: z.string(),
        context: z.any(), // Inclui matérias, datas, progresso
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    // Simulação de delay de processamento
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const { question } = data;
    const lowerQuestion = question.toLowerCase();

    if (lowerQuestion.includes("prova") || lowerQuestion.includes("avaliação")) {
      return {
        answer:
          "Sua próxima avaliação é a AP1 de Métodos Determinísticos I, no dia 05/09 às 09:30. Você já concluiu 45% do conteúdo recomendado. Quer que eu revise os tópicos de Conjuntos?",
      };
    }

    if (lowerQuestion.includes("estudar") || lowerQuestion.includes("hoje")) {
      return {
        answer:
          "Hoje o cronograma sugere focar na Aula 11 de HPA II (Behaviorismo). Você ainda não marcou a leitura do Caderno Didático como concluída. Vamos começar?",
      };
    }

    return {
      answer:
        "Olá! Sou seu assistente da Rota da Formatura. Posso te ajudar com datas de provas, sugestões de estudo baseadas no cronograma ou tirar dúvidas sobre os conteúdos das disciplinas. O que deseja saber?",
    };
  });

/**
 * Mock para gerar link do Google Calendar para uma avaliação.
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
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // 2h de duração

    const formatDate = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, "");

    const url = new URL("https://www.google.com/calendar/render");
    url.searchParams.append("action", "TEMPLATE");
    url.searchParams.append("text", title);
    url.searchParams.append("dates", `${formatDate(startDate)}/${formatDate(endDate)}`);
    url.searchParams.append("details", description);
    url.searchParams.append("sf", "true");
    url.searchParams.append("output", "xml");

    return { url: url.toString() };
  });
