import { createFileRoute, Link, useParams, useNavigate, Outlet, useRouterState } from "@tanstack/react-router";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  FileText,
  Flame,
  History,
  Info,
  Layout,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Play,
  Settings,
  Star,
  Trophy,
  ChevronDown,
  Calculator,
  Target,
  Zap,
  BookOpen,
  Headphones,
  Brain,
  TrendingUp,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AppBottomNav, AppDesktopNav, AppMobileMenu } from "@/components/AppNav";
import { useState, useEffect, useMemo } from "react";
import { disciplinas, type Disciplina } from "@/data/disciplines";
const disciplines = disciplinas;
import { eventos as CALENDAR_EVENTS } from "@/data/events";
import { StudyAssistant } from "@/components/StudyAssistant";
import { GradesCalculator } from "@/components/GradesCalculator";
import { DisciplinaMateriais } from "@/components/DisciplinaMateriais";
import { loadCheckpoints, saveCheckpoint, subscribeCheckpoints } from "@/lib/checkpoints";
import { getSemanaAtual, getProgressoEsperado } from "@/lib/progresso";
import { track } from "@/lib/metricas";
import { cn } from "@/lib/utils";
import { format, isAfter, parseISO, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/disciplines/$id")({
  component: DisciplinePage,
  head: () => ({
    meta: [{ title: "Detalhes da Disciplina | Rota da Formatura" }],
  }),
});

type TabType = "guia" | "cronograma" | "notas" | "materiais" | "provas" | "simulados";

function DisciplinePage() {
  const { id } = useParams({ from: "/disciplines/$id" });
  const navigate = useNavigate();
  const location = useRouterState({ select: (s) => s.location });
  const isPodcastRoute = location.pathname.endsWith("/podcast");

  if (isPodcastRoute) {
    return <Outlet />;
  }
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    // deep-link: /disciplines/$id?tab=materiais (usado pelo dashboard)
    if (typeof window === "undefined") return "cronograma";
    const t = new URLSearchParams(window.location.search).get("tab");
    return t === "guia" ||
      t === "cronograma" ||
      t === "notas" ||
      t === "materiais" ||
      t === "provas" ||
      t === "simulados"
      ? t
      : "cronograma";
  });

  const discipline = useMemo(() => disciplines.find((d) => d.id === id), [id]);
  const events = useMemo(() => CALENDAR_EVENTS.filter((e: any) => e.disciplinaId === id), [id]);

  const nextExam = useMemo(() => {
    return events
      .filter((e: any) => isAfter(parseISO(e.dataInicio), new Date()))
      .sort(
        (a: any, b: any) => parseISO(a.dataInicio).getTime() - parseISO(b.dataInicio).getTime(),
      )[0];
  }, [events]);

  // ============================================================
  // CHECKPOINTS (progresso de aula — persiste no Supabase/localStorage)
  // ============================================================
  const [concluidas, setConcluidas] = useState<Record<string, boolean>>({});
  useEffect(() => {
    if (!discipline) return;
    let ativo = true;
    loadCheckpoints(discipline.id).then((m) => {
      if (ativo) setConcluidas(m);
    });
    const unsub = subscribeCheckpoints(discipline.id, () => {
      loadCheckpoints(discipline.id).then((m) => {
        if (ativo) setConcluidas(m);
      });
    });
    return () => {
      ativo = false;
      unsub();
    };
  }, [discipline?.id]);

  const toggleCheckpoint = (aulaId: string) => {
    if (!discipline) return;
    const proximo = !concluidas[aulaId];
    setConcluidas((m) => ({ ...m, [aulaId]: proximo }));
    saveCheckpoint(discipline.id, aulaId, proximo);
    track("checkpoint_concluido", { disciplinaId: discipline.id, aulaId, concluido: proximo });
  };

  const totalAulas = discipline?.aulas.length ?? 0;
  const feitas = Object.values(concluidas).filter(Boolean).length;
  const progressoCheckpointsRaw = totalAulas ? Math.round((feitas / totalAulas) * 100) : 0;
  const semanaAtual = getSemanaAtual();
  const pctEsperado = discipline ? getProgressoEsperado(discipline) : 0;
  // Se não há checkpoints, usa progresso esperado pelo cronograma
  const hasCheckpoints = Object.keys(concluidas).length > 0;
  const progressoCheckpoints = progressoCheckpointsRaw > 0 ? progressoCheckpointsRaw : (hasCheckpoints ? 0 : pctEsperado);

  // ============================================================
  // MODO AP: detecta se há prova próxima (≤14 dias)
  // ============================================================
  const diasRestantesProva = nextExam
    ? differenceInDays(parseISO((nextExam as any).dataInicio), new Date())
    : null;
  const modoAP = diasRestantesProva !== null && diasRestantesProva <= 14 && diasRestantesProva >= 0;
  const provaHoje = diasRestantesProva === 0;
  const provaAmanha = diasRestantesProva === 1;

  // Aulas que entram no conteúdo da AP (baseado no nextExam.conteudo)
  const aulasAP = useMemo(() => {
    if (!discipline || !nextExam) return [];
    const conteudo = (nextExam as any).conteudo || "";
    // Tenta extrair número de aulas do conteúdo (ex: "Aulas 1 a 7")
    const match = conteudo.match(/(\d+)\s*a\s*(\d+)/);
    if (match) {
      const inicio = parseInt(match[1]);
      const fim = parseInt(match[2]);
      return discipline.aulas.filter((a) => a.numero >= inicio && a.numero <= fim);
    }
    // Se não conseguir extrair, retorna todas as aulas
    return discipline.aulas;
  }, [discipline, nextExam]);

  const aulasAPFeitas = aulasAP.filter((a) => concluidas[a.id]).length;
  const progressoAP = aulasAP.length > 0 ? Math.round((aulasAPFeitas / aulasAP.length) * 100) : 0;

  const proximosEventosChat = events
    .slice(0, 6)
    .map(
      (e: any) =>
        `${e.tipo}: ${format(parseISO(e.dataInicio), "dd/MM", { locale: ptBR })}${e.horario ? ` às ${e.horario}` : ""}`,
    );

  const contextoDisciplina = !discipline
    ? ""
    : [
        `Disciplina: ${discipline.nome} (${discipline.codigo}) — CEDERJ Administração 2026-2`,
        `Modalidade: EAD com avaliações presenciais (AP) e a distância (AD)`,
        modoAP ? `⚠️ MODO AP ATIVO — prova em ${diasRestantesProva} dia(s)! Focar no conteúdo da AP.` : "",
        discipline.guia?.objetivoGeral ? `Objetivo geral: ${discipline.guia.objetivoGeral}` : "",
        discipline.guia?.metodoEstudo
          ? `Método de estudo sugerido: ${discipline.guia.metodoEstudo}`
          : "",
        discipline.formulaNota?.aprovacao
          ? `Critério de aprovação: ${discipline.formulaNota.aprovacao}`
          : "",
        discipline.formulaNota?.n1 ? `Fórmula N1: ${discipline.formulaNota.n1}` : "",
        discipline.formulaNota?.n2 ? `Fórmula N2: ${discipline.formulaNota.n2}` : "",
        "",
        `Progresso do aluno: ${feitas}/${totalAulas} aulas concluídas.`,
        modoAP ? `Progresso AP: ${aulasAPFeitas}/${aulasAP.length} aulas da AP (${progressoAP}%)` : "",
        `CH: ${discipline.ch ?? "45h"}`,
        "",
        "Roteiro de aulas (cronograma oficial):",
        ...discipline.aulas.map(
          (a) =>
            `Aula ${a.numero} — ${a.titulo}${a.paginas ? ` (${a.paginas})` : ""} [Semana ${a.semanaEstudo}]${concluidas[a.id] ? " ✓ concluída" : ""}${aulasAP.some((aa) => aa.id === a.id) ? " ★ NA AP" : ""}`,
        ),
        "",
        "Próximas avaliações/entregas desta disciplina:",
        ...proximosEventosChat.map((e) => `- ${e}`),
        "",
        "INSTRUÇÕES PARA O TUTOR:",
        "- Responda sempre no contexto do CEDERJ (formato AD/AP, EAD)",
        "- Seja prático e objetivo, focado em ajudar a se preparar para as provas",
        modoAP ? "- PRIORIDADE MÁXIMA: focar no conteúdo que cai na AP que está próxima" : "",
        "- Use exemplos reais quando possível",
        "- Se não souber algo específico do CEDERJ, diga 'consulte o cronograma oficial'",
      ]
        .filter(Boolean)
        .join("\n");

  if (!discipline) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4">Disciplina não encontrada</h1>
        <Link to="/disciplines" className="text-[#D4941E] font-bold uppercase underline">
          Voltar para Disciplinas
        </Link>
      </div>
    );
  }

  const tabs: { id: TabType; label: string; icon: typeof LayoutDashboard }[] = [
    { id: "guia", label: "Guia", icon: Info },
    { id: "cronograma", label: "Cronograma", icon: Layout },
    { id: "notas", label: "Notas", icon: Calculator },
    { id: "materiais", label: "Materiais", icon: FileText },
    { id: "provas", label: "Provas Antigas", icon: History },
    { id: "simulados", label: "Simulados", icon: Star },
  ];

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#0A3D52] pb-20">
      {/* Premium Header */}
      <header className="bg-[#0A3D52] text-white pt-6 pb-20 px-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4941E]/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="flex items-center gap-4 mb-6">
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
            <Link
              to="/disciplines"
              className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-[10px] font-black uppercase tracking-[0.2em]"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar
            </Link>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="text-4xl mb-3">{discipline.icone}</div>
              <h1 className="text-3xl md:text-4xl font-black mb-2 leading-tight">
                {discipline.nome}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-white/70 uppercase tracking-widest">
                <span>{discipline.ch || "45h"}</span>
                <span className="w-1 h-1 bg-white/30 rounded-full" />
                <span>{discipline.period || "Aguardando"}</span>
                {discipline.formulaNota && (
                  <>
                    <span className="w-1 h-1 bg-white/30 rounded-full" />
                    <span className="text-[#D4941E]">{discipline.formulaNota.n1}</span>
                  </>
                )}
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 min-w-[240px]">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-white/60">
                  Semana {semanaAtual}
                </span>
                <span className="text-lg font-black">
                  {feitas}/{totalAulas}
                </span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden relative">
                <div
                  className="absolute inset-y-0 left-0 bg-white/20 rounded-full"
                  style={{ width: `${pctEsperado}%` }}
                />
                <div
                  className="absolute inset-y-0 left-0 bg-[#27AE60] transition-all duration-1000"
                  style={{ width: `${progressoCheckpoints}%` }}
                />
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-[9px] text-white/40">
                  Esperado: {pctEsperado}%
                </span>
                <span className="text-[9px] text-[#27AE60] font-bold">
                  {progressoCheckpoints}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 -mt-10 relative z-20">
        {/* ============================================================
            MODO AP BANNER — aparece quando prova está ≤14 dias
            ============================================================ */}
        {modoAP && nextExam && (
          <div
            className={cn(
              "rounded-2xl p-5 shadow-lg mb-8 border-l-8 relative overflow-hidden",
              provaHoje
                ? "bg-[#E74C3C]/5 border-[#E74C3C] animate-pulse"
                : provaAmanha
                  ? "bg-[#D4941E]/5 border-[#D4941E]"
                  : "bg-[#D4941E]/5 border-[#D4941E]",
            )}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4941E]/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center",
                    provaHoje ? "bg-[#E74C3C]/10" : "bg-[#D4941E]/10",
                  )}
                >
                  {provaHoje ? (
                    <Flame className="w-7 h-7 text-[#E74C3C]" />
                  ) : (
                    <Target className="w-7 h-7 text-[#D4941E]" />
                  )}
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0A3D52]/40">
                    {provaHoje
                      ? "🔥 PROVA HOJE!"
                      : provaAmanha
                        ? "⚡ PROVA AMANHÃ!"
                        : `⏱ ${diasRestantesProva} DIAS PARA A PROVA`}
                  </p>
                  <h4 className="font-black text-xl">
                    {(nextExam as any).titulo}
                  </h4>
                  <p className="text-sm text-[#0A3D52]/60 font-medium mt-0.5">
                    {format(parseISO((nextExam as any).dataInicio), "dd 'de' MMMM", { locale: ptBR })}
                    {(nextExam as any).horario ? ` às ${(nextExam as any).horario}` : ""}
                    {(nextExam as any).local ? ` • ${(nextExam as any).local}` : ""}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Progresso da AP */}
                <div className="text-center mr-4">
                  <p className="text-2xl font-black text-[#D4941E]">{progressoAP}%</p>
                  <p className="text-[9px] font-bold text-[#0A3D52]/40 uppercase">
                    {aulasAPFeitas}/{aulasAP.length} aulas da AP
                  </p>
                </div>
                {/* Ações rápidas */}
                <button
                  onClick={() => {
                    navigate({ to: "/simulados", search: { disciplina: discipline.id } });
                  }}
                  className="bg-[#D4941E] text-[#0A3D52] px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider hover:scale-105 transition-all shadow-md flex items-center gap-2"
                >
                  <Zap className="w-3.5 h-3.5" /> Simular AP
                </button>
              </div>
            </div>

            {/* Barra de progresso da AP */}
            <div className="mt-4 relative z-10">
              <div className="w-full h-1.5 bg-[#0A3D52]/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#D4941E] rounded-full transition-all duration-700"
                  style={{ width: `${progressoAP}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Next Exam Alert (quando NÃO está em modo AP) */}
        {!modoAP && nextExam && (
          <div className="bg-white rounded-2xl border-l-8 border-[#D4941E] p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#D4941E]/10 flex items-center justify-center">
                <CalendarIcon className="w-6 h-6 text-[#D4941E]" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0A3D52]/40">
                  Próxima Avaliação
                </p>
                <h4 className="font-bold text-lg">
                  {(nextExam as any).tipo} •{" "}
                  {format(parseISO((nextExam as any).dataInicio), "dd 'de' MMMM", {
                    locale: ptBR,
                  })}
                </h4>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] font-black uppercase text-[#0A3D52]/40">Horário</p>
                <p className="font-bold">{(nextExam as any).horario || "Ver guia"}</p>
              </div>
            </div>
          </div>
        )}

        {/* Card Podcast — chamativo, full-width */}
        <Link
          to="/disciplines/$id/podcast"
          params={{ id: discipline.id }}
          className="block bg-gradient-to-r from-[#7C3AED] to-[#7C3AED]/80 rounded-2xl p-5 mb-8 text-white shadow-lg shadow-[#7C3AED]/20 hover:shadow-xl hover:shadow-[#7C3AED]/30 hover:scale-[1.01] transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-sm shrink-0">
              <Headphones className="w-7 h-7" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-black text-lg uppercase leading-tight">Podcasts da Disciplina</h4>
              <p className="text-[11px] font-bold text-white/60 mt-0.5">
                Ouça revisoes e resumos em audio — compartilhe com a turma
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-white/40 shrink-0" />
          </div>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs Navigation */}
            <div className="bg-white rounded-2xl border border-[#0A3D52]/10 p-2 shadow-sm flex overflow-x-auto no-scrollbar gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shrink-0",
                    activeTab === tab.id
                      ? "bg-[#0A3D52] text-white shadow-md"
                      : "text-[#0A3D52]/50 hover:bg-[#F5F7FA]",
                  )}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-3xl border border-[#0A3D52]/10 p-8 shadow-sm min-h-[400px]">
              {activeTab === "guia" && (
                <div className="prose prose-slate max-w-none">
                  <h3 className="text-xl font-black mb-4 uppercase tracking-tight flex items-center gap-2">
                    <Info className="w-5 h-5 text-[#D4941E]" /> Guia da Disciplina
                  </h3>
                  <p className="text-[#0A3D52]/70 leading-relaxed font-medium">
                    {discipline.guia?.objetivoGeral ||
                      "Informações sobre a ementa e objetivos da disciplina estarão disponíveis em breve."}
                  </p>
                  <div className="mt-8 p-6 bg-[#F5F7FA] rounded-2xl border border-[#0A3D52]/5">
                    <h4 className="font-bold text-sm uppercase mb-3">Objetivos de Aprendizagem</h4>
                    <ul className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <li key={i} className="flex gap-3 text-sm text-[#0A3D52]/70">
                          <CheckCircle2 className="w-4 h-4 text-[#27AE60] shrink-0" />
                          Compreender os conceitos fundamentais do módulo {i}.
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === "cronograma" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-black uppercase tracking-tight">
                      {modoAP ? "Aulas da AP" : "Roteiro Semanal"}
                    </h3>
                    <span className="text-[10px] font-black text-[#27AE60] bg-[#27AE60]/10 px-2 py-1 rounded-full uppercase">
                      {progressoCheckpoints}% concluído
                    </span>
                  </div>

                  <div className="space-y-3">
                    {(modoAP && aulasAP.length > 0 ? aulasAP : discipline.aulas).map((a) => {
                      const feita = !!concluidas[a.id];
                      const naAP = aulasAP.some((aa) => aa.id === a.id);
                      return (
                        <div
                          key={a.id}
                          className={cn(
                            "rounded-2xl border p-4 transition-colors",
                            feita
                              ? "border-[#27AE60]/30 bg-[#27AE60]/5"
                              : naAP && modoAP
                                ? "border-[#D4941E]/30 bg-[#D4941E]/5"
                                : "border-[#0A3D52]/10 bg-white",
                          )}
                        >
                          <label className="flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={feita}
                              onChange={() => toggleCheckpoint(a.id)}
                              className="mt-1 w-5 h-5 shrink-0 accent-[#27AE60] cursor-pointer"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                {naAP && modoAP && (
                                  <Star className="w-3.5 h-3.5 text-[#D4941E] fill-[#D4941E]" />
                                )}
                                <span
                                  className={cn(
                                    "font-bold text-sm",
                                    feita && "line-through text-[#0A3D52]/40",
                                  )}
                                >
                                  Aula {a.numero} — {a.titulo}
                                </span>
                                <span className="text-[10px] font-bold uppercase text-[#0A3D52]/40">
                                  Semana {a.semanaEstudo}
                                </span>
                              </div>
                              {a.paginas && (
                                <p className="text-[11px] font-bold text-[#0A3D52]/50 mt-0.5">
                                  {a.paginas}
                                </p>
                              )}
                              <ul className="mt-2 space-y-1.5">
                                {a.atividades.map((at, idx) => (
                                  <li
                                    key={idx}
                                    className="flex items-start gap-2 text-xs text-[#0A3D52]/60"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5 text-[#D4941E] shrink-0 mt-0.5" />
                                    <span>
                                      {at.descricao}
                                      {!at.obrigatoria && (
                                        <span className="text-[#0A3D52]/30"> (opcional)</span>
                                      )}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeTab === "notas" && (
                <div className="space-y-6">
                  <GradesCalculator disciplinaId={discipline.id} disciplinaCor={discipline.cor} />
                </div>
              )}

              {activeTab === "materiais" && <DisciplinaMateriais disciplinaId={discipline.id} disciplinaNome={discipline.nome} />}

              {activeTab === "provas" && (
                <div className="space-y-4">
                  <h3 className="text-xl font-black uppercase tracking-tight mb-6">
                    Banco de Provas
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {discipline.avaliacoes.filter((a) => a.tipo.startsWith("AP")).length > 0 ? (
                      discipline.avaliacoes
                        .filter((a) => a.tipo.startsWith("AP"))
                        .map((exam) => (
                          <div
                            key={exam.id}
                            className="p-4 bg-white border border-[#0A3D52]/10 rounded-2xl flex items-center justify-between group hover:border-[#D4941E]/30 transition-all shadow-sm"
                          >
                            <div className="flex items-center gap-3">
                              <History className="w-5 h-5 text-[#0A3D52]/30" />
                              <div>
                                <h4 className="font-bold text-sm">{exam.tipo}</h4>
                                <p className="text-[10px] font-bold text-[#0A3D52]/40 uppercase">
                                  {format(parseISO(exam.dataPresencial || ""), "yyyy")}
                                </p>
                              </div>
                            </div>
                            <button className="text-[#D4941E] hover:underline text-[10px] font-black uppercase tracking-widest">
                              Baixar PDF
                            </button>
                          </div>
                        ))
                    ) : (
                      <div className="col-span-full">
                        <EmptyState icon={History} message="Nenhuma prova antiga listada" />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "simulados" && (
                <SimuladoTab discipline={discipline} modoAP={modoAP} nextExam={nextExam} />
              )}
            </div>

            {/* Bloco 3: Assistente de Estudos (IA) */}
            <div>
              <h3 className="text-xs font-black text-[#0A3D52]/40 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <MessageSquare className="w-3 h-3 text-[#D4941E]" /> Tutor IA
                {modoAP && (
                  <span className="text-[#D4941E] ml-2 text-[9px] bg-[#D4941E]/10 px-2 py-0.5 rounded-full">
                    Focado na AP
                  </span>
                )}
              </h3>
              <StudyAssistant contexto={contextoDisciplina} disciplinaCor={discipline.cor} />
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="space-y-6">
            {/* Métricas de Estudo */}
            <div className="bg-[#F5F7FA] rounded-3xl p-6 border border-[#0A3D52]/5">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <TrendingUp className="w-3 h-3 text-[#D4941E]" /> Métricas de Estudo
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-3 rounded-xl border border-[#0A3D52]/5 text-center">
                  <p className="text-xl font-black text-[#27AE60]">{feitas}</p>
                  <p className="text-[9px] font-bold text-[#0A3D52]/40 uppercase">Aulas Feitas</p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-[#0A3D52]/5 text-center">
                  <p className="text-xl font-black text-[#D4941E]">{totalAulas - feitas}</p>
                  <p className="text-[9px] font-bold text-[#0A3D52]/40 uppercase">Restantes</p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-[#0A3D52]/5 text-center">
                  <p className="text-xl font-black text-[#0A3D52]">{semanaAtual}</p>
                  <p className="text-[9px] font-bold text-[#0A3D52]/40 uppercase">Semana</p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-[#0A3D52]/5 text-center">
                  <p className={cn(
                    "text-xl font-black",
                    progressoCheckpoints >= pctEsperado ? "text-[#27AE60]" : "text-[#E74C3C]",
                  )}>
                    {progressoCheckpoints >= pctEsperado ? "✓" : "!"}
                  </p>
                  <p className="text-[9px] font-bold text-[#0A3D52]/40 uppercase">
                    {progressoCheckpoints >= pctEsperado ? "No Ritmo" : "Atrasado"}
                  </p>
                </div>
              </div>
            </div>

            {/* Critérios de Aprovação */}
            <div className="bg-[#F5F7FA] rounded-3xl p-6 border border-[#0A3D52]/5">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <Trophy className="w-3 h-3 text-[#D4941E]" /> Critérios de Aprovação
              </h4>
              <div className="space-y-3">
                <div className="bg-white p-3 rounded-xl border border-[#0A3D52]/5 text-center">
                  <code className="text-[#0A3D52] font-black text-sm">
                    {discipline.formulaNota?.n1 || "N=(AD1+AD2+AP1+AP2)/2"}
                  </code>
                </div>
                <p className="text-[10px] text-[#0A3D52]/60 font-medium">
                  Média mínima para aprovação sem AP3: <strong>6.0</strong>
                  <br />
                  Média mínima após AP3: <strong>5.0</strong>
                </p>
              </div>
            </div>

            {/* Calendário da Disciplina */}
            <div className="bg-white rounded-3xl border border-[#0A3D52]/10 p-6 shadow-sm">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <CalendarIcon className="w-3 h-3 text-[#D4941E]" /> Datas Importantes
              </h4>
              <div className="space-y-4">
                {events.map((event: any) => {
                  const isFuture = isAfter(parseISO(event.dataInicio), new Date());
                  return (
                    <div key={event.id} className="flex gap-4 group">
                      <div className="flex flex-col items-center">
                        <div
                          className={cn(
                            "w-2 h-2 rounded-full transition-colors",
                            isFuture ? "bg-[#D4941E] group-hover:bg-[#D4941E]" : "bg-[#0A3D52]/20",
                          )}
                        />
                        <div className="w-0.5 flex-1 bg-[#0A3D52]/10 my-1" />
                      </div>
                      <div className="pb-4">
                        <p className="text-[10px] font-black uppercase text-[#0A3D52]/40 tracking-tighter">
                          {format(parseISO(event.dataInicio), "dd/MM/yyyy")}
                        </p>
                        <h5
                          className={cn(
                            "font-bold text-sm transition-colors",
                            isFuture ? "text-[#0A3D52] group-hover:text-[#D4941E]" : "text-[#0A3D52]/40",
                          )}
                        >
                          {event.titulo}
                        </h5>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Ações Rápidas */}
            <div className="bg-gradient-to-br from-[#0A3D52] to-[#0A3D52]/90 rounded-3xl p-6 text-white">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-white/60">
                Ações Rápidas
              </h4>
              <div className="space-y-2">
                <Link
                  to="/simulados"
                  search={{ disciplina: discipline.id }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <Zap className="w-4 h-4 text-[#D4941E]" />
                  <span className="text-xs font-bold">Iniciar Simulado</span>
                </Link>
                <Link
                  to="/materials"
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <FileText className="w-4 h-4 text-[#D4941E]" />
                  <span className="text-xs font-bold">Ver Materiais</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
        <AppBottomNav />
      </main>
    </div>
  );
}

// ============================================================
// SimuladoTab — conectado ao simulador real
// ============================================================
function SimuladoTab({
  discipline,
  modoAP,
  nextExam,
}: {
  discipline: Disciplina;
  modoAP: boolean;
  nextExam: any;
}) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
          <Star className="w-5 h-5 text-[#D4941E]" /> Simulados
          {modoAP && (
            <span className="text-[10px] font-black text-[#D4941E] bg-[#D4941E]/10 px-2 py-0.5 rounded-full uppercase">
              Focado na AP
            </span>
          )}
        </h3>
      </div>

      {/* Cards de ação */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => {
            navigate({ to: "/simulados", search: { disciplina: discipline.id } });
            track("simulado_gerado", { disciplinaId: discipline.id, origem: "discipline_tab" });
          }}
          className="bg-gradient-to-br from-[#D4941E] to-[#D4941E]/80 text-[#0A3D52] p-6 rounded-2xl text-left hover:scale-[1.02] transition-all shadow-lg shadow-[#D4941E]/20"
        >
          <Zap className="w-8 h-8 mb-3" />
          <h4 className="font-black text-lg uppercase">
            {modoAP ? "Simular AP Agora" : "Novo Simulado"}
          </h4>
          <p className="text-[11px] font-bold opacity-70 mt-1">
            Questões geradas por IA baseadas no conteúdo real
          </p>
        </button>

        {nextExam && (
          <div className="bg-[#F5F7FA] border border-[#0A3D52]/10 p-6 rounded-2xl">
            <Target className="w-8 h-8 mb-3 text-[#D4941E]" />
            <h4 className="font-black text-lg uppercase">
              {(nextExam as any).tipo}
            </h4>
            <p className="text-[11px] font-bold text-[#0A3D52]/60 mt-1">
              {format(parseISO((nextExam as any).dataInicio), "dd/MM/yyyy")}
              {(nextExam as any).horario ? ` às ${(nextExam as any).horario}` : ""}
            </p>
            <p className="text-[10px] font-bold text-[#0A3D52]/40 mt-2 uppercase">
              Conteúdo: {(nextExam as any).conteudo || "Ver guia"}
            </p>
          </div>
        )}
      </div>

      {/* Dicas */}
      <div className="bg-[#F5F7FA] rounded-2xl p-5 border border-[#0A3D52]/5">
        <h5 className="font-black text-xs uppercase mb-3 flex items-center gap-2">
          <Brain className="w-3.5 h-3.5 text-[#D4941E]" /> Dicas para o Simulado
        </h5>
        <ul className="space-y-2 text-[11px] text-[#0A3D52]/70 font-medium">
          <li className="flex gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#27AE60] shrink-0 mt-0.5" />
            Leia cada questão com atenção antes de responder
          </li>
          <li className="flex gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#27AE60] shrink-0 mt-0.5" />
            {modoAP
              ? "Foque nas questões sobre o conteúdo que cai na AP"
              : "Revise o conteúdo antes de iniciar"}
          </li>
          <li className="flex gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#27AE60] shrink-0 mt-0.5" />
            Após corrigir, revise as questões que errou
          </li>
        </ul>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, message }: { icon: typeof LayoutDashboard; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-[#0A3D52]/20">
      <Icon className="w-12 h-12 mb-4" />
      <p className="font-bold text-xs uppercase tracking-widest">{message}</p>
    </div>
  );
}
