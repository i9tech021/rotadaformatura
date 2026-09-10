// src/lib/academic.functions.ts
// Tutor de IA: chamada DIRETA ao provedor OpenAI-compatível (OpenRouter) a partir
// do navegador. Assim funciona também em deploys estáticos (ex.: Vercel), onde
// não há server function disponível. A chave VITE_AI_API_KEY já é exposta ao
// bundle (prefixo VITE_), então este arquivo roda 100% no cliente.
import { z } from "zod";
import { STUDY_GUIDES } from "../data/studyGuides";

// Modelo gratuito padrão da OpenRouter. Troque via VITE_AI_MODEL se quiser.
// openrouter/free seleciona automaticamente entre todos os free disponíveis.
const PRIMARY_MODEL =
  (import.meta.env as any).VITE_AI_MODEL || "openrouter/free";
const FALLBACK_MODEL = "inclusionai/ling-3.0-flash-sante:free";
export const AI_MODEL = PRIMARY_MODEL;

const SYSTEM_PROMPT = `E aí, beleza! 😎 Sou o Tutor da Rota da Formatura, o cara mais descolado do CEDERJ pra te ajudar a passar de ano!

**Quem sou eu:**
Sou um assistente acadêmico criado pelos alunos do curso de Administração do CEDERJ/UFRRJ. Fiz parte de um projeto de Iniciação Científica (IC/PIBIC) e hoje atendo milhares de alunos em 43 polos pelo Rio de Janeiro!

**O que sei sobre a plataforma:**
- 📚 **Disciplinas**: Administração Geral, Economia Brasileira Contemporânea, Sociologia das Organizações, Métodos Determinísticos I, Contabilidade Geral I, Funções Financeiras e Normativas, e mais
- 🎯 **Simulados**: Questões geradas por IA com base nas provas reais da turma
- 🎙️ **Podcasts**: Áudios e resumos criados por alunos e professores
- 📖 **Materiais**: PDFs, videos, links curados por disciplina
- 🧮 **Calculadora**: Calcule sua média em tempo real
- 🏆 **Ranking**: Compare seu desempenho com outros polos
- 📅 **Cronograma**: Todas as datas de ADs, APs, matrículas e ENADE
- 🤖 **Tutor IA**: Eu! Pronto pra tirar suas dúvidas 24h

**Como falo:**
De forma descolada, como um colega mais velho que já passou pelo que você tá passando. Mas sempre com respaldo técnico e indicando os materiais da plataforma!

**Regras importantes:**
- Responda em português, tom descontraído mas educado
- SEMPRE indique os materiais da plataforma quando relevante ("Dá uma olhada no material de [disciplina] lá na plataforma!")
- Use SOMENTE disciplinas, datas, aulas e conteúdos que o aluno fornece no contexto. NÃO invente datas nem prazos
- Se não souber uma data, diga "olha, confere o cronograma oficial na plataforma que lá tá tudo certinho"
- Seja conciso: prefira tópicos e passos práticos
- Quando explicar conceitos, use exemplos do dia a dia
- Finalize sempre com uma dica motivacional ou indicando material da plataforma`;

const inputSchema = z.object({
  question: z.string().min(1),
  context: z
    .object({
      resumo: z.string().optional(),
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
});

export type AskAcademicAIInput = z.infer<typeof inputSchema>;

export async function askAcademicAI(input: AskAcademicAIInput): Promise<{ answer: string }> {
  const { question, context } = inputSchema.parse(input);

  const env = import.meta.env as any;
  const baseUrl = env.VITE_AI_BASE_URL || "https://openrouter.ai/api/v1";
  const apiKey = env.VITE_AI_API_KEY;

  // Respostas offline quando a IA não está disponível
  const offlineResponses: Record<string, string> = {
    default: `E aí! 👋 Tô aqui mas a IA tá temporariamente fora do ar. Enquanto isso, dá uma olhada nos materiais da plataforma que tem tudo organizadinho!\n\n📚 Acesse: Disciplinas → [sua disciplina] → Materiais\n🎯 Teste seus conhecimentos: Simulados\n🎙️ Ouça os podcasts no caminho!\n\nQualquer dúvida, volta daqui a pouco que eu volto mais forte! 💪`,
    "quem criou": `Esse projeto foi criado por alunos do curso de Administração do CEDERJ/UFRRJ,specificamente do Polo São Fidélis! 🎓\n\nFaz parte de um projeto de Iniciação Científica (IC/PIBIC) onde a gente desenvolveu uma plataforma pra ajudar os colegas a se organizarem melhor.\n\nO legal? É 100% gratuito, open source, e feito com muito carinho pra turma! ❤️\n\nQuer saber mais? Dá uma olhada na landing page: rotadaformatura.vercel.app/landingpage`,
    "como funciona": `A Rota da Formatura é um dashboard acadêmico completo! Aqui você tem:\n\n📅 Cronograma com todas as datas\n📚 Materiais organizados por disciplina\n🎙️ Podcasts e resumos\n🎯 Simulados com IA\n🧮 Calculadora de média\n🏆 Ranking da turma\n🤖 Tutor IA (eu!) pra tirar dúvidas\n\nÉ simples: entra, escolhe sua disciplina e starta os estudos! 🚀`,
  };

  // Check for specific questions
  const questionLower = question.toLowerCase();
  if (questionLower.includes("quem criou") || questionLower.includes("quem fez") || questionLower.includes("projeto")) {
    return { answer: offlineResponses["quem criou"] };
  }
  if (questionLower.includes("como funciona") || questionLower.includes("o que é") || questionLower.includes("plataforma")) {
    return { answer: offlineResponses["como funciona"] };
  }

  if (!apiKey) {
    return { answer: offlineResponses.default };
  }

  // Detecta a disciplina pela pergunta e inclui o guia de estudo correspondente
  const disciplinaMap: Record<string, string> = {
    "economia": "EBC", "ebc": "EBC", "milagre": "EBC", "pnd": "EBC",
    "plano cruzado": "EBC", "collor": "EBC", "petróleo": "EBC",
    "sociedade": "SO", "organizações": "SO", "organizacoes": "SO",
    "trabalho": "SO", "sociologia": "SO", "sustentabilidade": "SO",
    "contabilidade": "CG1", "balanço": "CG1", "balanco": "CG1",
    "patrimonial": "CG1", "dre": "CG1", "passivo": "CG1", "ativo": "CG1",
    "métodos": "MDI", "metodos": "MDI", "conjuntos": "MDI",
    "proposições": "MDI", "proposicoes": "MDI", "tabela-verdade": "MDI",
    "radicais": "MDI", "porcentagem": "MDI", "lógica": "MDI",
  };

  let codigoDetectado: string | null = null;
  for (const [keyword, codigo] of Object.entries(disciplinaMap)) {
    if (questionLower.includes(keyword)) {
      codigoDetectado = codigo;
      break;
    }
  }

  const guide = codigoDetectado
    ? STUDY_GUIDES.find((g) => g.disciplinaCodigo === codigoDetectado)
    : undefined;

  let systemContent = context?.resumo
    ? `${SYSTEM_PROMPT}\n\nCONTEXTO DO ALUNO:\n${context.resumo}`
    : SYSTEM_PROMPT;

  if (guide) {
    systemContent += `\n\nGUIA DE ESTUDO — ${guide.disciplinaCodigo} (${guide.provaTipo}):
Conteúdo cobrado:
${guide.conteudocobrado.map((c) => `- ${c}`).join("\n")}

Tópicos-chave:
${guide.topicsChave.map((t) => `- ${t}`).join("\n")}

Dicas de prova:
${guide.dicasDeProva.map((d) => `- ${d}`).join("\n")}

Exercícios típicos:
${guide.exerciciosTipicos.map((e) => `- ${e}`).join("\n")}`;
  }

  const messages = [
    { role: "system" as const, content: systemContent },
    ...(context?.history ?? []).map((m) => ({
      role: m.role,
      content: m.content,
    })),
    { role: "user" as const, content: question },
  ];

  // Modelos de raciocínio (CoT) devolvem o "processo de pensamento" junto.
  // Desliga o reasoning só neles, para não sujar a resposta do Tutor.
  const isReasoningModel =
    /(lightning|nemotron-3\.5|nemotron-3-ultra|reasoning|think|r1|o3|o4)/i.test(AI_MODEL);
  const body: Record<string, unknown> = {
    messages,
    temperature: 0.7,
    max_tokens: 800,
  };
  if (isReasoningModel) body["reasoning"] = { enabled: false };

  // Tenta o modelo primário; se falhar, caí no fallback
  const models = [AI_MODEL, ...(AI_MODEL !== FALLBACK_MODEL ? [FALLBACK_MODEL] : [])];

  for (const model of models) {
    try {
      const reqBody = { ...body, model };
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "X-Title": "Rota da Formatura",
        },
        body: JSON.stringify(reqBody),
      });

      if (res.ok) {
        const answer = await extrairResposta(res);
        if (answer) return { answer };
      }
      // Se 429 ou erro do servidor, tenta o próximo modelo
      if (res.status === 429 || res.status >= 500) continue;
      // Outros erros (400, 401) → retorna mensagem de erro
      return { answer: offlineResponses.default };
    } catch {
      // Timeout/rede → tenta o próximo modelo
      continue;
    }
  }

  return { answer: offlineResponses.default };
}

/**
 * Gera link do Google Calendar para uma avaliação.
 */
export function generateCalendarLink(data: { title: string; date: string; description: string }): {
  url: string;
} {
  const { title, date, description } = data;
  const startDate = new Date(date);
  const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

  const formatDate = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, "");

  const url = new URL("https://www.google.com/calendar/render");
  url.searchParams.append("action", "TEMPLATE");
  url.searchParams.append("text", title);
  url.searchParams.append("dates", `${formatDate(startDate)}/${formatDate(endDate)}`);
  url.searchParams.append("details", description);
  url.searchParams.append("sf", "true");
  url.searchParams.append("output", "xml");

  return { url: url.toString() };
}

/**
 * Extrai o texto da resposta do provedor, seja JSON único ou streaming SSE
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
      content += json.choices?.[0]?.message?.content ?? json.choices?.[0]?.delta?.content ?? "";
    } catch {
      // ignora linhas que não são JSON válido
    }
  }
  return content.trim();
}
