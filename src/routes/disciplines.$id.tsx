import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  FileText,
  Headphones,
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
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState, useEffect, useMemo } from "react";
import { disciplinas, type Disciplina } from "@/data/disciplines";
const disciplines = disciplinas;
import { eventos as CALENDAR_EVENTS } from "@/data/events";
import { StudyAssistant } from "@/components/StudyAssistant";
import { loadCheckpoints, saveCheckpoint, subscribeCheckpoints } from "@/lib/checkpoints";
import { cn } from "@/lib/utils";
import { format, isAfter, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/disciplines/$id")({
  component: DisciplinePage,
  head: () => ({
    meta: [{ title: "Detalhes da Disciplina | Rota da Formatura" }],
  }),
});

type TabType = 'guia' | 'cronograma' | 'podcasts' | 'resumos' | 'provas' | 'simulados';

function DisciplinePage() {
  const { id } = useParams({ from: "/disciplines/$id" });
  const [activeTab, setActiveTab] = useState<TabType>('cronograma');

  const discipline = useMemo(() => disciplines.find((d) => d.id === id), [id]);
  const events = useMemo(
    () => CALENDAR_EVENTS.filter((e: any) => e.disciplinaId === id),
    [id],
  );

  const nextExam = useMemo(() => {
    return events
      .filter((e: any) => isAfter(parseISO(e.dataInicio), new Date()))
      .sort(
        (a: any, b: any) =>
          parseISO(a.dataInicio).getTime() - parseISO(b.dataInicio).getTime(),
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
  };

  const totalAulas = discipline?.aulas.length ?? 0;
  const feitas = Object.values(concluidas).filter(Boolean).length;
  const progressoCheckpoints = totalAulas ? Math.round((feitas / totalAulas) * 100) : 0;

  const proximosEventosChat = events
    .slice(0, 6)
    .map(
      (e: any) =>
        `${e.tipo}: ${format(parseISO(e.dataInicio), "dd/MM", { locale: ptBR })}${e.horario ? ` às ${e.horario}` : ""}`,
    );

  const contextoDisciplina = [
    `Disciplina: ${discipline.nome} (${discipline.codigo})`,
    discipline.guia?.objetivoGeral
      ? `Objetivo geral: ${discipline.guia.objetivoGeral}`
      : "",
    discipline.guia?.metodoEstudo
      ? `Método de estudo sugerido: ${discipline.guia.metodoEstudo}`
      : "",
    discipline.formulaNota?.aprovacao
      ? `Critério de aprovação: ${discipline.formulaNota.aprovacao}`
      : "",
    "",
    `Progresso do aluno: ${feitas}/${totalAulas} aulas concluídas (checkpoints).`,
    "",
    "Roteiro de aulas (cronograma oficial):",
    ...discipline.aulas.map(
      (a) =>
        `Aula ${a.numero} — ${a.titulo}${a.paginas ? ` (${a.paginas})` : ""} [Semana ${a.semanaEstudo}]${concluidas[a.id] ? " ✓ concluída" : ""}`,
    ),
    "",
    "Próximas avaliações/entregas desta disciplina:",
    ...proximosEventosChat.map((e) => `- ${e}`),
  ]
    .filter(Boolean)
    .join("\n");

  if (!discipline) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4">Disciplina não encontrada</h1>
        <Link
          to="/disciplines"
          className="text-[#D4941E] font-bold uppercase underline"
        >
          Voltar para Biblioteca
        </Link>
      </div>
    );
  }

  const tabs: { id: TabType; label: string; icon: any }[] = [
    { id: 'guia', label: 'Guia', icon: Info },
    { id: 'cronograma', label: 'Cronograma', icon: Layout },
    { id: 'podcasts', label: 'Podcasts', icon: Headphones },
    { id: 'resumos', label: 'Resumos', icon: FileText },
    { id: 'provas', label: 'Provas Antigas', icon: History },
    { id: 'simulados', label: 'Simulados', icon: Star },
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
                <div className="p-6 pt-12 flex flex-col gap-6">
                  <div className="flex items-center gap-2 mb-4">
                    <LayoutDashboard className="w-8 h-8 text-[#D4941E]" />
                    <span className="font-bold text-lg tracking-tight uppercase">Menu Acadêmico</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <MobileNavLink to="/" icon={LayoutDashboard} label="Dashboard" />
                    <MobileNavLink to="/calendar" icon={CalendarIcon} label="Calendário" />
                    <MobileNavLink to="/disciplines" icon={Layout} label="Disciplinas" />
                    <MobileNavLink to="/materials" icon={FileText} label="Materiais" />
                    <MobileNavLink to="/community" icon={MessageSquare} label="Comunidade" />
                    <MobileNavLink to="/settings" icon={Settings} label="Configurações" />
                  </div>
                </div>
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
                  Checkpoints
                </span>
                <span className="text-lg font-black">
                  {feitas}/{totalAulas}
                </span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#27AE60] transition-all duration-1000"
                  style={{ width: `${progressoCheckpoints}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 -mt-10 relative z-20">
        {/* Next Exam Alert */}
        {nextExam && (
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
              {activeTab === 'guia' && (
                <div className="prose prose-slate max-w-none">
                  <h3 className="text-xl font-black mb-4 uppercase tracking-tight flex items-center gap-2">
                    <Info className="w-5 h-5 text-[#D4941E]" /> Guia da Disciplina
                  </h3>
                  <p className="text-[#0A3D52]/70 leading-relaxed font-medium">
                    {discipline.guia?.objetivoGeral ||
                      "Informações sobre a ementa e objetivos da disciplina estarão disponíveis em breve."}
                  </p>
                  <div className="mt-8 p-6 bg-[#F5F7FA] rounded-2xl border border-[#0A3D52]/5">
                    <h4 className="font-bold text-sm uppercase mb-3">
                      Objetivos de Aprendizagem
                    </h4>
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

              {activeTab === 'cronograma' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-black uppercase tracking-tight">
                      Roteiro Semanal
                    </h3>
                    <span className="text-[10px] font-black text-[#27AE60] bg-[#27AE60]/10 px-2 py-1 rounded-full uppercase">
                      {progressoCheckpoints}% concluído
                    </span>
                  </div>

                  <div className="space-y-3">
                    {discipline.aulas.map((a) => {
                      const feita = !!concluidas[a.id];
                      return (
                        <div
                          key={a.id}
                          className={cn(
                            "rounded-2xl border p-4 transition-colors",
                            feita
                              ? "border-[#27AE60]/30 bg-[#27AE60]/5"
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

              {activeTab === 'podcasts' && (
                <div className="space-y-4">
                  <h3 className="text-xl font-black uppercase tracking-tight mb-6">
                    Podcasts & Áudios
                  </h3>
                  <EmptyState icon={Headphones} message="Nenhum podcast disponível" />
                </div>
              )}

              {activeTab === 'resumos' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="col-span-full">
                    <EmptyState icon={FileText} message="Sem resumos cadastrados" />
                  </div>
                </div>
              )}

              {activeTab === 'provas' && (
                <div className="space-y-4">
                  <h3 className="text-xl font-black uppercase tracking-tight mb-6">
                    Banco de Provas
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {discipline.avaliacoes.filter((a) => a.tipo.startsWith("AP"))
                      .length > 0 ? (
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

              {activeTab === 'simulados' && (
                <div className="flex flex-col items-center justify-center text-center py-10 space-y-6">
                  <div className="w-20 h-20 rounded-full bg-[#D4941E]/10 flex items-center justify-center">
                    <Star className="w-10 h-10 text-[#D4941E]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black uppercase mb-2">Simulados Interativos</h3>
                    <p className="text-sm text-[#0A3D52]/60 max-w-xs mx-auto">
                      Teste seus conhecimentos com questões baseadas nas provas reais do CEDERJ.
                    </p>
                  </div>
                  <button className="bg-[#D4941E] text-[#0A3D52] px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-[#D4941E]/20 hover:scale-105 transition-all">
                    Iniciar Simulado AP1
                  </button>
                </div>
              )}
            </div>

            {/* Bloco 3: Assistente de Estudos (IA) */}
            <div>
              <h3 className="text-xs font-black text-[#0A3D52]/40 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <MessageSquare className="w-3 h-3 text-[#D4941E]" /> Tutor IA
              </h3>
              <StudyAssistant
                contexto={contextoDisciplina}
                disciplinaCor={discipline.cor}
              />
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="space-y-6">
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
                {events.map((event: any) => (
                  <div key={event.id} className="flex gap-4 group">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-[#0A3D52] group-hover:bg-[#D4941E] transition-colors" />
                      <div className="w-0.5 flex-1 bg-[#0A3D52]/10 my-1" />
                    </div>
                    <div className="pb-4">
                      <p className="text-[10px] font-black uppercase text-[#0A3D52]/40 tracking-tighter">
                        {format(parseISO(event.dataInicio), "dd/MM/yyyy")}
                      </p>
                      <h5 className="font-bold text-sm text-[#0A3D52] group-hover:text-[#D4941E] transition-colors">
                        {event.titulo}
                      </h5>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function EmptyState({ icon: Icon, message }: { icon: any; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-[#0A3D52]/20">
      <Icon className="w-12 h-12 mb-4" />
      <p className="font-bold text-xs uppercase tracking-widest">{message}</p>
    </div>
  );
}

function MobileNavLink({ to, icon: Icon, label }: { to: string; icon: any; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/10 text-white"
      activeProps={{ className: "bg-white/10 border-white/20 text-[#D4941E]" }}
    >
      <Icon className="w-5 h-5" />
      <span className="font-black text-xs uppercase tracking-widest">{label}</span>
    </Link>
  );
}
