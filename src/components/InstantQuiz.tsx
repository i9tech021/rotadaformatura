// src/components/InstantQuiz.tsx
// Quiz rápido: gera 5 questões aleatórias da disciplina atual.
// Botão "Me Teste" que aparece nas páginas de disciplina.
import { useState } from "react";
import { Brain, CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import { disciplinas } from "@/data/disciplines";
import { cn } from "@/lib/utils";

interface Questao {
  pergunta: string;
  alternativas: string[];
  resposta: number;
  explicacao: string;
}

interface InstantQuizProps {
  disciplinaId: string;
  className?: string;
}

// Banco de questões por disciplina (amostra para demonstração)
const QUESTOES_POR_DISCIPLINA: Record<string, Questao[]> = {
  EBC: [
    {
      pergunta: "O que foi o Milagre Econômico Brasileiro?",
      alternativas: [
        "Período de crescimento acelerado entre 1968-1973",
        "A crise do petróleo de 1979",
        "O Plano Real de 1994",
        "A estabilização inflacionária de 2000",
      ],
      resposta: 0,
      explicacao: "O Milagre Econômico foi o período de rápido crescimento do PIB brasileiro entre 1968 e 1973, impulsionado por investimentos externos e política de crédito.",
    },
    {
      pergunta: "Qual foi o principal objetivo do Plano Cruzado?",
      alternativas: [
        "Controlar a inflação",
        "Aumentar as exportações",
        "Reduzir o desemprego",
        "Estatizar empresas",
      ],
      resposta: 0,
      explicacao: "O Plano Cruzado (1986) visava controlar a inflação através do congelamento de preços e substituição do Cruzeiro pelo Cruzado.",
    },
    {
      pergunta: "O que caracteriza a economia brasileira no período Vargas?",
      alternativas: [
        "Industrialização por substituição de importações",
        "Agrarismo exportador",
        "Neoliberalismo",
        "Economia digital",
      ],
      resposta: 0,
      explicacao: "Getúlio Vargas implementou a industrialização por substituição de importações, criando indústrias de base e o trabalhismo.",
    },
    {
      pergunta: "Qual evento marcou o início da crise da dívida externa brasileira?",
      alternativas: [
        "Moratória do México (1982)",
        "Crise de 1929",
        "Revolução Industrial",
        "Descoberta do petróleo",
      ],
      resposta: 0,
      explicacao: "A moratória do México em 1982 alertou os mercados sobre a incapacidade de pagamento dos países latino-americanos.",
    },
    {
      pergunta: "O que é PIB?",
      alternativas: [
        "Produto Interno Bruto",
        "Presidente do Instituto Brasileiro",
        "Partido dos Industrial e Banqueiros",
        "Política de Investimento Bancário",
      ],
      resposta: 0,
      explicacao: "PIB é a soma de todos os bens e serviços finais produzidos no país em um período determinado.",
    },
  ],
  SO: [
    {
      pergunta: "O que estuda a Sociologia das Organizações?",
      alternativas: [
        "Comportamento humano no ambiente de trabalho",
        "Contabilidade empresarial",
        "Marketing digital",
        "Direito trabalhista",
      ],
      resposta: 0,
      explicacao: "A Sociologia das Organizações analisa como as pessoas interagem e se comportam dentro das organizações.",
    },
    {
      pergunta: "O que é cultura organizacional?",
      alternativas: [
        "Conjunto de valores e crenças compartilhados",
        "Documentos formalizados",
        "Estrutura hierárquica",
        "Lucro da empresa",
      ],
      resposta: 0,
      explicacao: "Cultura organizacional são os valores, crenças e comportamentos compartilhados pelos membros da organização.",
    },
    {
      pergunta: "Quem é o pai da Sociologia?",
      alternativas: [
        "Émile Durkheim",
        "Adam Smith",
        "Karl Marx",
        "Max Weber",
      ],
      resposta: 0,
      explicacao: "Émile Durkheim é considerado o pai da Sociologia, fundador do método sociológico.",
    },
    {
      pergunta: "O que é burocracia segundo Max Weber?",
      alternativas: [
        "Sistema racional de organização",
        "Desperdício de recursos",
        "Corrupção administrativa",
        "Falta de eficiência",
      ],
      resposta: 0,
      explicacao: "Para Weber, burocracia é o modelo mais racional e eficiente de organização, com regras claras e hierarquia definida.",
    },
    {
      pergunta: "O que é sustentabilidade empresarial?",
      alternativas: [
        "Práticas que atendem sem comprometer gerações futuras",
        "Aumento do lucro a qualquer custo",
        "Redução de funcionários",
        "Fechamento de filiais",
      ],
      resposta: 0,
      explicacao: "Sustentabilidade é o desenvolvimento que atende às necessidades presentes sem comprometer a capacidade de gerações futuras.",
    },
  ],
  CG1: [
    {
      pergunta: "O que é um ativo?",
      alternativas: [
        "Bem ou direito de propriedade da empresa",
        "Dívida da empresa",
        "Lucro acumulado",
        "Capital social",
      ],
      resposta: 0,
      explicacao: "Ativo são todos os bens e direitos que a empresa possui para gerar benefícios futuros.",
    },
    {
      pergunta: "O que é o DRE?",
      alternativas: [
        "Demonstração do Resultado do Exercício",
        "Documento de Registro Empresarial",
        "Diretório de Relações Externas",
        "Declaração de Rendimentos Empresariais",
      ],
      resposta: 0,
      explicacao: "O DRE mostra o resultado líquido da empresa em um período, apresentando receitas, despesas e lucros.",
    },
    {
      pergunta: "Qual a fórmula do Patrimônio Líquido?",
      alternativas: [
        "Ativo - Passivo",
        "Ativo + Passivo",
        "Receita - Despesa",
        "Lucro - Impostos",
      ],
      resposta: 0,
      explicacao: "Patrimônio Líquido = Ativo - Passivo. Representa o capital próprio da empresa.",
    },
    {
      pergunta: "O que é uma conta de passivo?",
      alternativas: [
        "Obrigações e dívidas da empresa",
        "Bens da empresa",
        "Lucros acumulados",
        "Investimentos",
      ],
      resposta: 0,
      explicacao: "Passivo são todas as obrigações e dívidas que a empresa tem com terceiros.",
    },
    {
      pergunta: "O que é depreciação?",
      alternativas: [
        "Perda de valor de um bem pelo tempo de uso",
        "Aumento de valor",
        "Venda de ativo",
        "Compra de novo equipamento",
      ],
      resposta: 0,
      explicacao: "Depreciação é a perda de valor de um ativo por desgaste, uso ou obsolescência.",
    },
  ],
  MDI: [
    {
      pergunta: "O que é um conjunto?",
      alternativas: [
        "Coleção bem definida de elementos",
        "Sequência numérica",
        "Gráfico de funções",
        "Equação do 2º grau",
      ],
      resposta: 0,
      explicacao: "Conjunto é uma coleção de elementos bem definidos e distintos entre si.",
    },
    {
      pergunta: "O que são proposições lógicas?",
      alternativas: [
        "Frases que podem ser verdadeiras ou falsas",
        "Cálculos matemáticos",
        "Problemas de palavras",
        "Exercícios de álgebra",
      ],
      resposta: 0,
      explicacao: "Proposições são frases declarativas que possuem valor lógico verdadeiro ou falso.",
    },
    {
      pergunta: "O que é uma tabela-verdade?",
      alternativas: [
        "Tabela que mostra todos os valores possíveis de uma proposição",
        "Gráfico estatístico",
        "Lista de números primos",
        "Sequência fibonacci",
      ],
      resposta: 0,
      explicacao: "Tabela-verdade apresenta todas as possibilidades de valores lógicos para uma expressão.",
    },
    {
      pergunta: "O que é conjunção (AND)?",
      alternativas: [
        "Operador que retorna verdadeiro se AMBOS forem verdadeiros",
        "Operador que retorna verdadeiro se UM for verdadeiro",
        "Operador que inverte o valor",
        "Operador que soma valores",
      ],
      resposta: 0,
      explicacao: "Conjunção (∧) retorna verdadeiro apenas quando ambas as proposições são verdadeiras.",
    },
    {
      pergunta: "O que é o símbolo de negação (~)?",
      alternativas: [
        "Inverte o valor lógico da proposição",
        "Soma dois valores",
        "Compara valores",
        "Divide valores",
      ],
      resposta: 0,
      explicacao: "Negação (~) inverte o valor lógico: verdadeiro vira falso e vice-versa.",
    },
  ],
};

function embaralhar<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function InstantQuiz({ disciplinaId, className }: InstantQuizProps) {
  const [iniciado, setIniciado] = useState(false);
  const [questaoAtual, setQuestaoAtual] = useState(0);
  const [respostas, setRespostas] = useState<number[]>([]);
  const [respondida, setRespondida] = useState(false);
  const [selecionada, setSelecionada] = useState<number | null>(null);

  const disciplina = disciplinas.find((d) => d.id === disciplinaId);
  const questoes = QUESTOES_POR_DISCIPLINA[disciplinaId] ?? QUESTOES_POR_DISCIPLINA.EBC;
  const questoesEmbaralhadas = embaralhar(questoes).slice(0, 5);

  const iniciar = () => {
    setIniciado(true);
    setQuestaoAtual(0);
    setRespostas([]);
    setRespondida(false);
    setSelecionada(null);
  };

  const responder = (idx: number) => {
    if (respondida) return;
    setSelecionada(idx);
    setRespondida(true);
    setRespostas([...respostas, idx]);
  };

  const proxima = () => {
    if (questaoAtual < questoesEmbaralhadas.length - 1) {
      setQuestaoAtual(questaoAtual + 1);
      setRespondida(false);
      setSelecionada(null);
    }
  };

  const acertos = respostas.filter((r, i) => r === questoesEmbaralhadas[i].resposta).length;
  const terminou = respostas.length === questoesEmbaralhadas.length;

  if (!iniciado) {
    return (
      <button
        onClick={iniciar}
        className={cn(
          "flex items-center gap-2 px-4 py-2 bg-[#D4941E] text-[#0A3D52] rounded-xl font-black text-xs uppercase tracking-wider hover:scale-105 transition-all",
          className
        )}
      >
        <Brain className="w-4 h-4" />
        Me Teste!
      </button>
    );
  }

  const q = questoesEmbaralhadas[questaoAtual];

  if (terminou) {
    const pct = Math.round((acertos / questoesEmbaralhadas.length) * 100);
    return (
      <div className="bg-white rounded-2xl border border-[#0A3D52]/10 p-6 text-center">
        <div className="text-4xl mb-2">{pct >= 80 ? "🎉" : pct >= 50 ? "💪" : "📚"}</div>
        <h3 className="text-lg font-black text-[#0A3D52]">
          {acertos}/{questoesEmbaralhadas.length} acertos
        </h3>
        <p className="text-sm text-[#0A3D52]/60 mt-1">
          {pct >= 80
            ? "Excelente! Você domina o conteúdo!"
            : pct >= 50
            ? "Bom! Mas revisa uns pontos aí."
            : "Precisa estudar mais. Dá uma olhada nos materiais!"}
        </p>
        <button
          onClick={iniciar}
          className="mt-4 flex items-center gap-2 mx-auto px-4 py-2 bg-[#0A3D52] text-white rounded-xl font-bold text-xs uppercase"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[#0A3D52]/10 p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-bold text-[#0A3D52]/40">
          Questão {questaoAtual + 1}/{questoesEmbaralhadas.length}
        </span>
        <span className="text-xs font-bold text-[#27AE60]">
          {acertos} acerto{acertos !== 1 ? "s" : ""}
        </span>
      </div>

      <p className="text-sm font-bold text-[#0A3D52] mb-4">{q.pergunta}</p>

      <div className="space-y-2">
        {q.alternativas.map((alt, idx) => (
          <button
            key={idx}
            onClick={() => responder(idx)}
            disabled={respondida}
            className={cn(
              "w-full text-left p-3 rounded-xl text-xs font-bold transition-all",
              respondida && idx === q.resposta
                ? "bg-[#27AE60]/10 text-[#27AE60] border border-[#27AE60]/30"
                : respondida && idx === selecionada && idx !== q.resposta
                ? "bg-[#E74C3C]/10 text-[#E74C3C] border border-[#E74C3C]/30"
                : "bg-[#F5F7FA] text-[#0A3D52] hover:bg-[#0A3D52]/5 border border-transparent"
            )}
          >
            <span className="flex items-center gap-2">
              {respondida && idx === q.resposta && <CheckCircle2 className="w-4 h-4" />}
              {respondida && idx === selecionada && idx !== q.resposta && <XCircle className="w-4 h-4" />}
              {alt}
            </span>
          </button>
        ))}
      </div>

      {respondida && (
        <div className="mt-4 p-3 bg-[#F5F7FA] rounded-xl">
          <p className="text-xs text-[#0A3D52]/70">{q.explicacao}</p>
          <button
            onClick={proxima}
            className="mt-2 text-xs font-bold text-[#D4941E] hover:underline"
          >
            Próxima →
          </button>
        </div>
      )}
    </div>
  );
}
