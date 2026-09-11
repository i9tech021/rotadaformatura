// src/routes/desafio.tsx
// Desafio da Semana — mini-desafio semanal para toda a turma.
// Quiz coletivo com ranking de quem acertou mais.
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Zap,
  Clock,
  Trophy,
  Star,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Menu,
  LayoutDashboard,
  BookOpen,
  FileText,
  Calendar as CalendarIcon,
  Settings,
  Headphones,
  Sparkles,
  BarChart3,
  Activity,
  Users,
  Target,
  Award,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AppBottomNav, AppDesktopNav, AppMobileMenu, HubTabs } from "@/components/AppNav";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import {
  listDesafioResultados,
  montarRankingDesafio,
  contarParticipantes,
  enviarResultadoDesafio,
  subscribeDesafio,
  formatarTempoSeg,
  type DesafioResultado,
} from "@/lib/desafioService";
import { registrarAtividade } from "@/lib/feedService";
import { disciplinas } from "@/data/disciplines";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/desafio")({
  component: DesafioPage,
  head: () => ({
    title: "Desafio da Semana | Rota da Formatura",
    meta: [
      {
        name: "description",
        content: "Participe do desafio semanal e concorra a destaque na turma!",
      },
    ],
  }),
});

interface QuestaoDesafio {
  id: string;
  pergunta: string;
  opcoes: string[];
  respostaCorreta: number;
  explicacao: string;
}

interface DesafioSemana {
  id: string;
  titulo: string;
  disciplina: string;
  dataInicio: string;
  dataFim: string;
  totalQuestoes: number;
  participantes: number;
  tempoLimite: number; // em minutos
  questoes: QuestaoDesafio[];
}

// Dados mock do desafio atual
const DESAFIO_ATUAL: DesafioSemana = {
  id: "d1",
  titulo: "Desafio Economia Brasileira",
  disciplina: "EBC",
  dataInicio: "2026-09-08",
  dataFim: "2026-09-14",
  totalQuestoes: 5,
  participantes: 847,
  tempoLimite: 10,
  questoes: [
    {
      id: "q1",
      pergunta: "Em que ano foi implementado o Plano Real?",
      opcoes: ["1989", "1990", "1994", "1998"],
      respostaCorreta: 2,
      explicacao:
        "O Plano Real foi implementado em 1 de julho de 1994, durante o governo Itamar Franco.",
    },
    {
      id: "q2",
      pergunta: "Qual foi o principal objetivo do Milagre Econômico?",
      opcoes: [
        "Reduzir a inflação",
        "Aumentar o PIB via crédito externo",
        "Estatizar empresas",
        "Controlar câmbio",
      ],
      respostaCorreta: 1,
      explicacao:
        "O Milagre Econômico (1969-1973) buscou crescimento via endividamento externo e investimentos em infraestrutura.",
    },
    {
      id: "q3",
      pergunta: "O que foi o Plano Cruzado?",
      opcoes: [
        "Plano de estabilização de 1986",
        "Plano de privatização",
        "Plano de educação",
        "Plano agrícola",
      ],
      respostaCorreta: 0,
      explicacao:
        "O Plano Cruzado foi um plano de estabilização econômica implementado em fevereiro de 1986.",
    },
    {
      id: "q4",
      pergunta:
        "Qual presidente criou o Ministério da Reforma e do Desenvolvimento Administrativo?",
      opcoes: [
        "Fernando Henrique Cardoso",
        "Luiz Inácio Lula da Silva",
        "Jair Bolsonaro",
        "Dilma Rousseff",
      ],
      respostaCorreta: 1,
      explicacao: "O Ministério foi criado no governo Lula em 2003.",
    },
    {
      id: "q5",
      pergunta: "Em que década ocorreu a crise da dívida externa brasileira?",
      opcoes: ["1960", "1970", "1980", "1990"],
      respostaCorreta: 2,
      explicacao:
        "A crise da dívida externa explodiu nos anos 1980, afetando toda a América Latina.",
    },
  ],
};

// Ranking mock do desafio
const RANKING_MOCK = [
  { posicao: 1, nome: "Carlos O.", polo: "São Fidélis", acertos: 5, tempo: "3:42" },
  { posicao: 2, nome: "Ana S.", polo: "Petrópolis", acertos: 5, tempo: "4:15" },
  { posicao: 3, nome: "Pedro C.", polo: "Resende", acertos: 4, tempo: "5:30" },
  { posicao: 4, nome: "Maria S.", polo: "Macaé", acertos: 4, tempo: "6:12" },
  { posicao: 5, nome: "Lucia F.", polo: "Angra dos Reis", acertos: 3, tempo: "7:45" },
];

function DesafioPage() {
  const [desafio] = useState<DesafioSemana>(DESAFIO_ATUAL);
  const [emAndamento, setEmAndamento] = useState(false);
  const [questaoAtual, setQuestaoAtual] = useState(0);
  const [respostas, setRespostas] = useState<(number | null)[]>([]);
  const [respondendo, setRespondendo] = useState(false);
  const [finalizado, setFinalizado] = useState(false);
  const [tempoRestante, setTempoRestante] = useState(desafio.tempoLimite * 60);
  const [recorde, setRecorde] = useLocalStorage<number>("rdf:desafio-recorde", 0);
  const [novoRecorde, setNovoRecorde] = useState(false);
  // Tentativas coletivas em tempo real (null = offline/não carregado)
  const [nuvem, setNuvem] = useState<DesafioResultado[] | null>(null);
  const enviadoRef = useRef(false);

  const recarregar = useCallback(async () => {
    const rows = await listDesafioResultados(desafio.id);
    if (rows) setNuvem(rows);
  }, [desafio.id]);

  useEffect(() => {
    recarregar();
    return subscribeDesafio(recarregar);
  }, [recarregar]);

  const ranking = useMemo(
    () =>
      nuvem
        ? montarRankingDesafio(nuvem).map((r) => ({ ...r, tempo: formatarTempoSeg(r.tempoSeg) }))
        : RANKING_MOCK,
    [nuvem],
  );
  const participantes = nuvem ? contarParticipantes(nuvem) : desafio.participantes;

  // Timer
  useEffect(() => {
    if (!emAndamento || respondendo) return;
    const timer = setInterval(() => {
      setTempoRestante((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          finalizarDesafio();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [emAndamento, respondendo]);

  const iniciarDesafio = () => {
    setEmAndamento(true);
    setQuestaoAtual(0);
    setNovoRecorde(false);
    enviadoRef.current = false;
    setRespostas(new Array(desafio.totalQuestoes).fill(null));
    setTempoRestante(desafio.tempoLimite * 60);
    setFinalizado(false);
  };

  const responderQuestao = (indiceOpcao: number) => {
    if (respondendo) return;
    setRespondendo(true);
    const novasRespostas = [...respostas];
    novasRespostas[questaoAtual] = indiceOpcao;
    setRespostas(novasRespostas);

    setTimeout(() => {
      setRespondendo(false);
      if (questaoAtual < desafio.totalQuestoes - 1) {
        setQuestaoAtual(questaoAtual + 1);
      } else {
        finalizarDesafio();
      }
    }, 1500);
  };

  const finalizarDesafio = () => {
    setFinalizado(true);
    setEmAndamento(false);
  };

  const resetarDesafio = () => {
    setEmAndamento(false);
    setQuestaoAtual(0);
    setRespostas([]);
    setFinalizado(false);
    setTempoRestante(desafio.tempoLimite * 60);
  };

  const acertos = respostas.reduce<number>((acc, resp, idx) => {
    if (resp !== null && resp === desafio.questoes[idx]?.respostaCorreta) return acc + 1;
    return acc;
  }, 0);

  const formatarTempo = (segundos: number) => {
    const min = Math.floor(segundos / 60);
    const seg = segundos % 60;
    return `${min}:${String(seg).padStart(2, "0")}`;
  };

  // Salva recorde + publica tentativa coletiva ao finalizar
  useEffect(() => {
    if (!finalizado || enviadoRef.current) return;
    enviadoRef.current = true;
    if (acertos > recorde) {
      setRecorde(acertos);
      setNovoRecorde(true);
    }
    const tempoSeg = Math.max(0, desafio.tempoLimite * 60 - tempoRestante);
    void enviarResultadoDesafio({
      desafioId: desafio.id,
      acertos,
      total: desafio.totalQuestoes,
      tempoSeg,
    });
    void registrarAtividade({
      acao: `fez o desafio (${acertos}/${desafio.totalQuestoes})`,
      disciplinaId: desafio.disciplina,
      tipo: "simulado",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalizado]);

  const progresso = emAndamento ? ((questaoAtual + 1) / desafio.totalQuestoes) * 100 : 0;

  // questaoAtual é sempre válido enquanto emAndamento; fallback evita undefined no TS
  const questao = desafio.questoes[questaoAtual] ?? desafio.questoes[0]!;

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#0A3D52] pb-20">
      {/* Header */}
      <nav className="bg-[#0A3D52] text-white px-4 py-4 shadow-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Sheet>
              <SheetTrigger asChild>
                <button className="p-2 hover:bg-white/10 rounded-xl transition-colors md:hidden cursor-pointer">
                  <Menu className="w-6 h-6 text-[#D4941E]" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="bg-[#0A3D52] text-white border-[#D4941E]/20 p-0">
                <AppMobileMenu />
              </SheetContent>
            </Sheet>
            <Link to="/" className="hover:bg-white/10 p-2 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#D4941E]" />
              <h1 className="font-bold text-lg uppercase tracking-tight hidden sm:inline">
                Desafio da Semana
              </h1>
            </div>
          </div>
          <AppDesktopNav />
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <HubTabs
          items={[
            { to: "/simulados", label: "Simulados" },
            { to: "/desafio", label: "Desafio" },
          ]}
        />
        {/* Banner do Desafio */}
        <div className="bg-gradient-to-r from-[#D4941E] to-[#D4941E]/80 rounded-2xl p-6 mb-8 text-[#0A3D52]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                Semana de {new Date(desafio.dataInicio).toLocaleDateString("pt-BR")} a{" "}
                {new Date(desafio.dataFim).toLocaleDateString("pt-BR")}
              </p>
              <h2 className="text-2xl font-black mt-1">{desafio.titulo}</h2>
              <p className="text-sm opacity-70 mt-1">
                {desafio.totalQuestoes} questões • {desafio.tempoLimite} minutos
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-black">{participantes}</p>
              <p className="text-[10px] font-bold opacity-70">participantes</p>
            </div>
          </div>
        </div>

        {/* Área do Desafio */}
        {!emAndamento && !finalizado && (
          <div className="bg-white rounded-2xl border border-[#0A3D52]/10 p-8 text-center mb-8">
            <div className="w-20 h-20 bg-[#D4941E]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-10 h-10 text-[#D4941E]" />
            </div>
            <h3 className="text-xl font-black mb-2">Pronto para o desafio?</h3>
            <p className="text-sm text-[#0A3D52]/60 mb-2 max-w-md mx-auto">
              Teste seus conhecimentos em{" "}
              {disciplinas.find((d) => d.id === desafio.disciplina)?.nome} e veja como você se
              compara com a turma!
            </p>
            {recorde > 0 && (
              <p className="text-xs font-black text-[#D4941E] mb-4">
                <Trophy className="w-3.5 h-3.5 inline mr-1" />
                Seu recorde: {recorde} de {desafio.totalQuestoes}
              </p>
            )}
            <button
              onClick={iniciarDesafio}
              className="bg-[#D4941E] text-[#0A3D52] px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-wider hover:scale-105 transition-all mt-2"
            >
              {recorde > 0 ? "Tentar superar recorde" : "Iniciar Desafio"}
            </button>
          </div>
        )}

        {/* Questão em Andamento */}
        {emAndamento && (
          <div className="bg-white rounded-2xl border border-[#0A3D52]/10 p-6 mb-8">
            {/* Barra de Progresso */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-[#0A3D52]/40">
                Questão {questaoAtual + 1} de {desafio.totalQuestoes}
              </span>
              <span
                className={cn(
                  "text-xs font-black px-3 py-1 rounded-full",
                  tempoRestante < 60
                    ? "bg-[#E74C3C]/10 text-[#E74C3C]"
                    : "bg-[#27AE60]/10 text-[#27AE60]",
                )}
              >
                <Clock className="w-3 h-3 inline mr-1" />
                {formatarTempo(tempoRestante)}
              </span>
            </div>
            <div className="h-2 bg-[#F5F7FA] rounded-full overflow-hidden mb-6">
              <div
                className="h-full bg-[#D4941E] rounded-full transition-all duration-300"
                style={{ width: `${progresso}%` }}
              />
            </div>

            {/* Questão */}
            <h3 className="text-lg font-black mb-6">{questao.pergunta}</h3>

            {/* Opções */}
            <div className="space-y-3">
              {questao.opcoes.map((opcao, idx) => {
                const selecionada = respostas[questaoAtual] === idx;
                const correta = idx === questao.respostaCorreta;
                const mostrandoResultado = respondendo && (selecionada || correta);

                return (
                  <button
                    key={idx}
                    onClick={() => responderQuestao(idx)}
                    disabled={respondendo}
                    className={cn(
                      "w-full p-4 rounded-xl text-left font-bold text-sm transition-all",
                      mostrandoResultado && correta
                        ? "bg-[#27AE60]/10 border-2 border-[#27AE60] text-[#27AE60]"
                        : mostrandoResultado && selecionada && !correta
                          ? "bg-[#E74C3C]/10 border-2 border-[#E74C3C] text-[#E74C3C]"
                          : "bg-[#F5F7FA] border-2 border-transparent hover:border-[#D4941E]/30",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-xs font-black",
                          mostrandoResultado && correta
                            ? "bg-[#27AE60] text-white"
                            : mostrandoResultado && selecionada && !correta
                              ? "bg-[#E74C3C] text-white"
                              : "bg-[#0A3D52]/10 text-[#0A3D52]",
                        )}
                      >
                        {mostrandoResultado && correta ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : mostrandoResultado && selecionada && !correta ? (
                          <XCircle className="w-4 h-4" />
                        ) : (
                          String.fromCharCode(65 + idx)
                        )}
                      </div>
                      {opcao}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Explicação */}
            {respondendo && (
              <div className="mt-4 p-4 bg-[#F5F7FA] rounded-xl">
                <p className="text-xs font-bold text-[#0A3D52]/60 mb-1">Explicação:</p>
                <p className="text-sm text-[#0A3D52]/80">{questao.explicacao}</p>
              </div>
            )}
          </div>
        )}

        {/* Resultado */}
        {finalizado && (
          <div className="bg-white rounded-2xl border border-[#0A3D52]/10 p-8 text-center mb-8">
            <div
              className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4",
                acertos >= 4
                  ? "bg-[#27AE60]/10"
                  : acertos >= 2
                    ? "bg-[#D4941E]/10"
                    : "bg-[#E74C3C]/10",
              )}
            >
              {acertos >= 4 ? (
                <Trophy className="w-10 h-10 text-[#27AE60]" />
              ) : acertos >= 2 ? (
                <Star className="w-10 h-10 text-[#D4941E]" />
              ) : (
                <Target className="w-10 h-10 text-[#E74C3C]" />
              )}
            </div>
            <h3 className="text-2xl font-black mb-2">
              {acertos} de {desafio.totalQuestoes} acertos
            </h3>
            {novoRecorde && (
              <p className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#D4941E]/10 text-[#D4941E] text-xs font-black uppercase mb-3">
                <Trophy className="w-3.5 h-3.5" />
                Novo recorde!
              </p>
            )}
            <p className="text-sm text-[#0A3D52]/60 mb-6">
              {acertos >= 4
                ? "Parabéns! Você arrasou!"
                : acertos >= 2
                  ? "Bom trabalho! Continue assim!"
                  : "Não desista! Estude mais e tente novamente."}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={resetarDesafio}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-[#0A3D52]/20 text-sm font-bold"
              >
                <RotateCcw className="w-4 h-4" />
                Tentar Novamente
              </button>
              <Link
                to="/ranking"
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#D4941E] text-[#0A3D52] text-sm font-black"
              >
                <Trophy className="w-4 h-4" />
                Ver Ranking
              </Link>
            </div>
          </div>
        )}

        {/* Ranking do Desafio */}
        <div className="bg-white rounded-2xl border border-[#0A3D52]/10 p-6">
          <h2 className="font-black text-sm uppercase mb-4 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[#D4941E]" />
            Ranking da Semana
          </h2>
          <div className="space-y-3">
            {ranking.map((entry) => (
              <div
                key={entry.posicao}
                className={cn(
                  "flex items-center gap-4 p-3 rounded-xl",
                  entry.posicao <= 3 ? "bg-[#D4941E]/5" : "bg-[#F5F7FA]",
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center font-black text-xs",
                    entry.posicao === 1
                      ? "bg-[#D4941E] text-white"
                      : entry.posicao === 2
                        ? "bg-[#94A3B8] text-white"
                        : entry.posicao === 3
                          ? "bg-[#CD7F32] text-white"
                          : "bg-[#0A3D52]/10 text-[#0A3D52]/40",
                  )}
                >
                  {entry.posicao}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{entry.nome}</p>
                  <p className="text-[10px] text-[#0A3D52]/40">{entry.polo}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-[#27AE60]">
                    {entry.acertos}/{desafio.totalQuestoes}
                  </p>
                  <p className="text-[10px] text-[#0A3D52]/40">{entry.tempo}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <AppBottomNav />
    </div>
  );
}
