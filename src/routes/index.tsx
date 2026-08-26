import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BookOpen,
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronRight,
  Clock,
  GraduationCap,
  LayoutDashboard,
  MessageCircle,
  Settings,
  Target,
  Trophy,
  User,
  ArrowRight,
  FileText,
  Menu,
  Headphones,
  Play,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState, useEffect, useMemo, useCallback, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { AcademicChecklist } from "@/components/academic/AcademicChecklist";
import { StudyAssistant } from "@/components/StudyAssistant";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getTarefasPorDia, type TarefaDiaria } from "@/data/studyPlan";
import { ListChecks } from "lucide-react";

export const Route = createFileRoute("/")({
  component: AcademicDashboard,
  head: () => ({
    title: "Rota da Formatura | Dashboard Acadêmico",
    meta: [
      {
        name: "description",
        content:
          "Organize seus estudos do CEDERJ com a Rota da Formatura. Cronogramas, checklists e progresso em tempo real.",
      },
      { property: "og:title", content: "Rota da Formatura | Seu Planner Universitário" },
      {
        property: "og:description",
        content:
          "Dashboard acadêmico personalizado para alunos do CEDERJ com foco em organização e aprovação.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

import { disciplinas as DISCIPLINAS_STATICAS } from "../data/disciplines";
import { getEventosAcao, prazoDe, diasPara, type EventoAcademico } from "../data/events";
import { getEventosAcao as fetchEventosAcao, subscribeEventos } from "@/lib/eventsService";
import { getDisciplinas, subscribeDisciplinas } from "@/lib/disciplinasService";
import { countConcluidas, subscribeCheckpointsAll } from "@/lib/checkpoints";
import { seedDatabase, isSupabaseConfigured } from "@/lib/seed";

function useAgora(intervalMs = 30000) {
  const [agora, setAgora] = useState(() => new Date());
  useEffect(() => {
    const tick = () => setAgora(new Date());
    tick();
    const timer = setInterval(tick, intervalMs);
    const onFocus = () => tick();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [intervalMs]);
  return agora;
}

function AcademicDashboard() {
  const agora = useAgora();

  const [eventosAcao, setEventosAcao] = useState<EventoAcademico[]>(() => getEventosAcao());
  const [seedMsg, setSeedMsg] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  useEffect(() => {
    fetchEventosAcao().then(setEventosAcao);
    const unsubEv = subscribeEventos(() => {
      fetchEventosAcao().then(setEventosAcao);
    });
    return unsubEv;
  }, []);

  const [disciplinas, setDisciplinas] = useState(DISCIPLINAS_STATICAS);
  useEffect(() => {
    getDisciplinas().then(setDisciplinas);
    const unsubDisc = subscribeDisciplinas(() => {
      getDisciplinas().then(setDisciplinas);
    });
    return unsubDisc;
  }, []);

  // Progresso REAL por disciplina = aulas concluídas / total (não hardcoded).
  // Recalcula ao vivo quando qualquer checkpoint muda (realtime).
  const [progressoMap, setProgressoMap] = useState<Record<string, number>>({});
  const recalcProgresso = useCallback(async (lista: typeof DISCIPLINAS_STATICAS) => {
    const map: Record<string, number> = {};
    await Promise.all(
      lista.map(async (d) => {
        const feitas = await countConcluidas(d.id);
        map[d.id] = d.aulas.length ? Math.round((feitas / d.aulas.length) * 100) : 0;
      }),
    );
    setProgressoMap(map);
  }, []);
  useEffect(() => {
    recalcProgresso(disciplinas);
  }, [disciplinas, recalcProgresso]);
  useEffect(() => {
    const unsub = subscribeCheckpointsAll(() => recalcProgresso(disciplinas));
    return unsub;
  }, [disciplinas, recalcProgresso]);

  const proximaAP = eventosAcao.find((e) => e.tipo.startsWith("AP"));
  const diasProxima = proximaAP ? diasPara(proximaAP, agora) : 0;

  const proximosEventosChat = eventosAcao
    .slice(0, 6)
    .map(
      (e) =>
        `${e.tipo} ${e.disciplinaCodigo}: ${format(prazoDe(e), "dd/MM", { locale: ptBR })}${e.horario ? ` às ${e.horario}` : ""}`,
    );

  const contextoGlobal = [
    "Disciplinas do semestre 2026-2 (CEDERJ Administração):",
    ...disciplinas.map((d) => `- ${d.nome} (${d.codigo})`),
    "",
    "Próximas avaliações/entregas (AD/AP/Questionário):",
    ...eventosAcao
      .slice(0, 10)
      .map(
        (e) =>
          `- ${e.tipo} ${e.disciplinaCodigo}: ${format(prazoDe(e), "dd/MM", { locale: ptBR })}${e.horario ? ` às ${e.horario}` : ""} — ${e.conteudo}`,
      ),
  ].join("\n");

  // Seções de urgência (dashboard "O que fazer AGORA?")
  const secoes = useMemo(() => {
    const hojeUrgente: EventoAcademico[] = [];
    const proximo: EventoAcademico[] = [];
    const depois: EventoAcademico[] = [];
    for (const e of eventosAcao) {
      const d = diasPara(e, agora);
      if (d <= 0) hojeUrgente.push(e);
      else if (d <= 7) proximo.push(e);
      else depois.push(e);
    }
    return { hojeUrgente, proximo, depois };
  }, [eventosAcao, agora]);

  const profile = {
    name: "Estudante CEDERJ",
    course: "Administração",
    period: "2026-2",
    university: "UFRRJ/CEDERJ",
  };

  const disciplinesList = useMemo(
    () =>
      disciplinas.map((d) => {
        const proximo = eventosAcao.find((e) => e.disciplinaId === d.id);
        const days = proximo ? diasPara(proximo, agora) : -1;

        return {
          ...d,
          progresso: progressoMap[d.id] ?? d.progresso,
          ch: d.id.includes("hpa") ? "60h" : "45h",
          period: d.aulas.length > 0 ? "2º período" : "Aguardando",
          status:
            days <= 7 && days >= 0 ? "urgent" : days <= 14 && days >= 0 ? "warning" : "normal",
          nextExam: proximo ? { type: proximo.tipo, daysRemaining: days } : null,
        };
      }),
    [disciplinas, eventosAcao, agora],
  );

  const data = { profile, disciplines: disciplinesList };

  const [greeting, setGreeting] = useState("");
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    const hour = agora.getHours();
    if (hour >= 6 && hour < 12) setGreeting("Bom dia");
    else if (hour >= 12 && hour < 18) setGreeting("Boa tarde");
    else setGreeting("Boa noite");
  }, [agora]);

  // Missões do Dia — tarefas do studyPlan + persistência em localStorage
  const tarefasHoje = useMemo(() => getTarefasPorDia(format(agora, "yyyy-MM-dd")), [agora]);
  const [missaoConcluida, setMissaoConcluida] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const chave = `rdf:missao:${format(new Date(), "yyyy-MM-dd")}`;
      return JSON.parse(localStorage.getItem(chave) || "{}");
    } catch {
      return {};
    }
  });

  const toggleMissao = (tarefaId: string) => {
    setMissaoConcluida((prev) => {
      const proximo = { ...prev, [tarefaId]: !prev[tarefaId] };
      const chave = `rdf:missao:${format(new Date(), "yyyy-MM-dd")}`;
      localStorage.setItem(chave, JSON.stringify(proximo));
      return proximo;
    });
  };

  const missaoFeitas = tarefasHoje.filter((t) => missaoConcluida[t.id]).length;
  const missaoTotal = tarefasHoje.length;
  const missaoPct = missaoTotal ? Math.round((missaoFeitas / missaoTotal) * 100) : 0;

  // countdown removido: substituído pelas seções de urgência abaixo

  const getStatusColor = (status: string) => {
    switch (status) {
      case "urgent":
        return "bg-[#E74C3C]";
      case "warning":
        return "bg-[#D4941E]";
      default:
        return "bg-[#27AE60]";
    }
  };

  const getStatusBorder = (status: string) => {
    switch (status) {
      case "urgent":
        return "border-[#E74C3C]";
      case "warning":
        return "border-[#D4941E]";
      default:
        return "border-[#27AE60]";
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#0A3D52] font-sans selection:bg-[#D4941E]/30 pb-20">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-40 w-full bg-[#0A3D52] text-white px-4 py-3 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Sheet>
            <SheetTrigger asChild>
              <button className="p-2 hover:bg-white/10 rounded-xl transition-colors md:hidden cursor-pointer">
                <Menu className="w-6 h-6 text-[#D4941E]" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-[#0A3D52] text-white border-[#D4941E]/20 p-0">
              <div className="p-6 pt-12 flex flex-col gap-6">
                <div className="flex items-center gap-2 mb-4">
                  <GraduationCap className="w-8 h-8 text-[#D4941E]" />
                  <span className="font-bold text-lg tracking-tight uppercase">Menu Acadêmico</span>
                </div>
                <div className="flex flex-col gap-2">
                  <MobileNavLink to="/" icon={LayoutDashboard} label="Dashboard" />
                  <MobileNavLink to="/calendar" icon={CalendarIcon} label="Calendário" />
                  <MobileNavLink to="/disciplines" icon={BookOpen} label="Disciplinas" />
                  <MobileNavLink to="/materials" icon={FileText} label="Materiais" />
                  <MobileNavLink to="/community" icon={MessageCircle} label="Comunidade" />
                  <MobileNavLink to="/settings" icon={Settings} label="Configurações" />
                </div>
              </div>
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2">
            <GraduationCap className="w-8 h-8 text-[#D4941E]" />
            <span className="font-bold text-lg tracking-tight uppercase hidden xs:inline">
              Rota da Formatura
            </span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-6 mr-6">
          <Link
            to="/"
            className="text-xs font-black uppercase tracking-widest hover:text-[#D4941E] transition-colors"
          >
            Dashboard
          </Link>
          <Link
            to="/community"
            className="text-xs font-black uppercase tracking-widest hover:text-[#D4941E] transition-colors"
          >
            Comunidade
          </Link>
          <Link
            to="/calendar"
            className="text-xs font-black uppercase tracking-widest hover:text-[#D4941E] transition-colors"
          >
            Agenda
          </Link>
          <Link
            to="/disciplines"
            className="text-xs font-black uppercase tracking-widest hover:text-[#D4941E] transition-colors"
          >
            Biblioteca
          </Link>
          <Link
            to="/materials"
            className="text-xs font-black uppercase tracking-widest hover:text-[#D4941E] transition-colors"
          >
            Arquivos
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-[10px] opacity-60 leading-none uppercase font-black">
              {data.profile.course}
            </span>
            <span className="text-sm font-bold">{data.profile.name}</span>
          </div>
          <Link
            to="/settings"
            className="w-10 h-10 rounded-full bg-[#D4941E] flex items-center justify-center font-bold text-[#0A3D52] hover:scale-105 transition-transform"
          >
            {data.profile.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)}
          </Link>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-[#0A3D52]">
              {greeting}, {data.profile.name.split(" ")[0]}!
            </h2>
            <p className="text-[#0A3D52]/60 mt-1">
              Seu progresso acadêmico atualizado em tempo real.
            </p>
          </div>

          {isSupabaseConfigured && (
            <div className="flex flex-col items-end gap-1">
              <button
                onClick={async () => {
                  setSeeding(true);
                  setSeedMsg(null);
                  const r = await seedDatabase();
                  setSeedMsg(r.message);
                  setSeeding(false);
                  if (r.ok) fetchEventosAcao().then(setEventosAcao);
                }}
                disabled={seeding}
                className="text-[10px] font-black uppercase tracking-widest bg-[#0A3D52] text-white px-4 py-2 rounded-xl hover:bg-[#0A3D52]/90 disabled:opacity-50 transition-colors"
              >
                {seeding ? "Semando..." : "Seed Database"}
              </button>
              {seedMsg && (
                <span className="text-[10px] font-bold text-[#0A3D52]/50 max-w-[220px] text-right">
                  {seedMsg}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Resumo Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#F5F7FA] p-6 rounded-xl border border-[#0A3D52]/10 shadow-sm flex flex-col items-center text-center">
            <BookOpen className="w-6 h-6 text-[#0A3D52] mb-2" />
            <span className="text-2xl font-black">{data.disciplines.length}</span>
            <span className="text-xs uppercase font-bold text-[#0A3D52]/50 tracking-wider">
              Disciplinas
            </span>
          </div>
          <div className="bg-[#F5F7FA] p-6 rounded-xl border border-[#0A3D52]/10 shadow-sm flex flex-col items-center text-center">
            <Clock className="w-6 h-6 text-[#0A3D52] mb-2" />
            <span className="text-2xl font-black">330h</span>
            <span className="text-xs uppercase font-bold text-[#0A3D52]/50 tracking-wider">
              Carga Total
            </span>
          </div>
          <div className="bg-[#F5F7FA] p-6 rounded-xl border border-[#0A3D52]/10 shadow-sm flex flex-col items-center text-center">
            <CalendarIcon className="w-6 h-6 text-[#D4941E] mb-2" />
            <span className="text-2xl font-black text-[#D4941E]">
              {diasProxima === 0 ? "Hoje" : `${diasProxima} dias`}
            </span>
            <span className="text-xs uppercase font-bold text-[#D4941E]/60 tracking-wider">
              Próxima Avaliação
            </span>
          </div>
        </div>

        {/* Missões do Dia */}
        {tarefasHoje.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-black text-[#0A3D52]/40 uppercase tracking-[0.2em] flex items-center gap-2">
                <ListChecks className="w-4 h-4" /> Missões do Dia
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase text-[#0A3D52]/40">
                  {missaoFeitas}/{missaoTotal}
                </span>
                <div className="w-16 h-1.5 bg-[#0A3D52]/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#D4941E] rounded-full transition-all duration-500"
                    style={{ width: `${missaoPct}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              {tarefasHoje.map((t) => {
                const concluida = !!missaoConcluida[t.id];
                return (
                  <button
                    key={t.id}
                    onClick={() => toggleMissao(t.id)}
                    className={cn(
                      "w-full text-left bg-white p-4 rounded-2xl border shadow-sm flex items-center gap-4 transition-all hover:shadow-md cursor-pointer",
                      concluida
                        ? "border-[#27AE60]/30 bg-[#27AE60]/5"
                        : "border-[#0A3D52]/10 hover:border-[#D4941E]/30",
                    )}
                  >
                    <div
                      className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white transition-all",
                        concluida && "bg-[#27AE60]",
                      )}
                      style={!concluida ? { background: t.disciplinaCor } : undefined}
                    >
                      {concluida ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : t.tipo === "podcast" ? (
                        <Headphones className="w-4 h-4" />
                      ) : t.tipo === "video" ? (
                        <Play className="w-4 h-4" />
                      ) : t.tipo === "simulado" ? (
                        <Target className="w-4 h-4" />
                      ) : t.tipo === "ad" || t.tipo === "ap" ? (
                        <FileText className="w-4 h-4" />
                      ) : (
                        <BookOpen className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span
                          className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded"
                          style={{ color: t.disciplinaCor, background: `${t.disciplinaCor}10` }}
                        >
                          {t.disciplinaCodigo}
                        </span>
                        <span className="text-[9px] font-bold text-[#0A3D52]/30 uppercase">
                          {t.duracaoMinutos}min
                        </span>
                      </div>
                      <h4
                        className={cn(
                          "font-bold text-sm leading-tight truncate",
                          concluida && "line-through text-[#0A3D52]/40",
                        )}
                      >
                        {t.titulo}
                      </h4>
                      <p className="text-[10px] text-[#0A3D52]/40 font-medium truncate mt-0.5">
                        {t.descricao}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* URGÊNCIA: HOJE / URGENTE */}
        <UrgenciaSection
          titulo="Hoje / Urgente"
          icone={<Target className="w-4 h-4" />}
          eventos={secoes.hojeUrgente}
          agora={agora}
          vazio="Nada vencendo ou vencido no momento."
        />

        {/* URGÊNCIA: PRÓXIMO (7 dias) */}
        <UrgenciaSection
          titulo="Próximo (7 dias)"
          icone={<Clock className="w-4 h-4" />}
          eventos={secoes.proximo}
          agora={agora}
          vazio="Nenhuma entrega ou prova nos próximos 7 dias."
        />

        {/* URGÊNCIA: DEPOIS (média prazo) */}
        <UrgenciaSection
          titulo="Depois (média prazo)"
          icone={<CalendarIcon className="w-4 h-4" />}
          eventos={secoes.depois}
          agora={agora}
          vazio="Nada agendado além de 7 dias."
        />

        {/* Disciplinas Grid */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs font-black text-[#0A3D52]/40 uppercase tracking-[0.2em]">
              Disciplinas do Semestre
            </h3>
            <Link
              to="/disciplines"
              className="text-[10px] font-black uppercase text-[#D4941E] border-b-2 border-[#D4941E]"
            >
              Ver Grade Completa
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.disciplines.map((item) => (
              <Link
                key={item.id}
                to="/disciplines/$id"
                params={{ id: item.id }}
                className={cn(
                  "bg-[#F5F7FA] rounded-xl border border-[#0A3D52]/10 p-5 hover:shadow-md transition-shadow group flex flex-col justify-between",
                  item.status === "urgent" && "border-l-4 border-l-[#E74C3C]",
                  item.status === "warning" && "border-l-4 border-l-[#D4941E]",
                )}
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-2xl">{item.icone}</span>
                    <div className="p-1 hover:bg-[#0A3D52]/5 rounded-md text-[#0A3D52]/30">
                      <MoreVertical className="w-5 h-5" />
                    </div>
                  </div>
                  <h4 className="font-bold text-lg leading-tight mb-1 group-hover:text-[#D4941E] transition-colors">
                    {item.nome}
                  </h4>
                  <p className="text-[11px] font-bold text-[#0A3D52]/50 uppercase tracking-wide mb-4">
                    {item.ch} • {item.period}
                  </p>

                  <div className="mb-4">
                    <div className="flex justify-between text-[11px] font-black mb-1.5 uppercase">
                      <span>Progresso</span>
                      <span>{item.progresso}%</span>
                    </div>
                    <div className="w-full h-2 bg-white rounded-full overflow-hidden border border-[#0A3D52]/5">
                      <div
                        className={cn(
                          "h-full transition-all duration-700",
                          getStatusColor(item.status),
                        )}
                        style={{ width: `${item.progresso}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#0A3D52]/5 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <CalendarIcon className="w-3 h-3 text-[#0A3D52]/40" />
                    <span className="text-[10px] font-bold text-[#0A3D52]/60 uppercase tracking-tighter">
                      {item.nextExam
                        ? `Próxima: ${item.nextExam.type} ${item.nextExam.daysRemaining === 0 ? "hoje" : `em ${item.nextExam.daysRemaining} dias`}`
                        : "Aguardando cronograma"}
                    </span>
                  </div>
                  <div className="text-[#0A3D52] hover:text-[#D4941E] transition-colors flex items-center gap-1 text-[10px] font-black uppercase">
                    Entrar na Rota <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>

      {/* Floating Action Button (IA Chat) */}
      <button
        onClick={() => setShowChat(!showChat)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#D4941E] text-[#0A3D52] rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 border-4 border-white"
      >
        <MessageCircle className="w-6 h-6" />
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#E74C3C] border-2 border-white rounded-full flex items-center justify-center text-[10px] text-white font-bold animate-pulse">
          1
        </span>
      </button>

      {/* Chat Interface (Assistente de Estudos com IA) */}
      {showChat && (
        <div className="fixed inset-0 z-[60] flex justify-end">
          <div className="absolute inset-0 bg-black/20" onClick={() => setShowChat(false)} />
          <div className="relative w-full max-w-sm h-full shadow-2xl flex flex-col bg-white">
            <div className="bg-[#0A3D52] p-4 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#D4941E] flex items-center justify-center">
                  <User className="w-4 h-4 text-[#0A3D52]" />
                </div>
                <div>
                  <p className="text-sm font-bold">Assistente Acadêmico</p>
                  <p className="text-[10px] opacity-70">Tutor IA • Rota da Formatura</p>
                </div>
              </div>
              <button onClick={() => setShowChat(false)} className="text-2xl leading-none">
                &times;
              </button>
            </div>

            <div className="flex-1 min-h-0 p-3">
              <StudyAssistant contexto={contextoGlobal} disciplinaCor="#0A3D52" />
            </div>
          </div>
        </div>
      )}

      {/* Bottom Mobile Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#0A3D52]/10 flex justify-around p-3 md:hidden z-40 pb-safe">
        <Link
          to="/"
          activeProps={{ className: "text-[#D4941E]" }}
          inactiveProps={{ className: "text-[#0A3D52]/40" }}
          className="flex flex-col items-center"
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[8px] font-black uppercase mt-1 tracking-tighter">Dashboard</span>
        </Link>
        <Link
          to="/community"
          activeProps={{ className: "text-[#D4941E]" }}
          inactiveProps={{ className: "text-[#0A3D52]/40" }}
          className="flex flex-col items-center"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-[8px] font-black uppercase mt-1 tracking-tighter">Comunidade</span>
        </Link>
        <Link
          to="/calendar"
          activeProps={{ className: "text-[#D4941E]" }}
          inactiveProps={{ className: "text-[#0A3D52]/40" }}
          className="flex flex-col items-center"
        >
          <CalendarIcon className="w-5 h-5" />
          <span className="text-[8px] font-black uppercase mt-1 tracking-tighter">Agenda</span>
        </Link>
        <Link
          to="/materials"
          activeProps={{ className: "text-[#D4941E]" }}
          inactiveProps={{ className: "text-[#0A3D52]/40" }}
          className="flex flex-col items-center"
        >
          <FileText className="w-5 h-5" />
          <span className="text-[8px] font-black uppercase mt-1 tracking-tighter">Materiais</span>
        </Link>
        <Link
          to="/settings"
          activeProps={{ className: "text-[#D4941E]" }}
          inactiveProps={{ className: "text-[#0A3D52]/40" }}
          className="flex flex-col items-center"
        >
          <Settings className="w-5 h-5" />
          <span className="text-[8px] font-black uppercase mt-1 tracking-tighter">Perfil</span>
        </Link>
      </div>
    </div>
  );
}

function MoreVertical({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="19" r="1" />
    </svg>
  );
}

function MobileNavLink({ to, icon: Icon, label }: { to: string; icon: any; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/10"
      activeProps={{ className: "bg-white/10 border-white/20 text-[#D4941E]" }}
    >
      <Icon className="w-5 h-5" />
      <span className="font-black text-xs uppercase tracking-widest">{label}</span>
    </Link>
  );
}

// ============================================================
// Seções de urgência — "O que eu preciso fazer AGORA?"
// ============================================================
function UrgenciaCard({ e, agora }: { e: EventoAcademico; agora: Date }) {
  const dias = diasPara(e, agora);
  const encerrado = dias < 0;
  const venceHoje = dias === 0;
  const isAP = e.tipo.startsWith("AP");
  const isQuest = e.tipo === "QUESTIONARIO";
  const cor = isAP ? "#E74C3C" : isQuest ? "#D4941E" : "#2563EB";
  const prazo = prazoDe(e);
  const prazoLabel =
    format(prazo, "dd/MM", { locale: ptBR }) + (e.horario ? ` às ${e.horario}` : "");
  const statusLabel = encerrado
    ? "🔴 Encerrado"
    : venceHoje
      ? "⚠️ Vence hoje"
      : dias <= 7
        ? `em ${dias} ${dias === 1 ? "dia" : "dias"}`
        : formatDistanceToNow(prazo, { locale: ptBR, addSuffix: true });

  return (
    <div className="bg-white p-4 rounded-2xl border border-[#0A3D52]/10 shadow-sm flex items-center justify-between group hover:border-[#D4941E]/30 transition-all gap-3">
      <div className="flex items-center gap-4 min-w-0">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-black text-white text-xs"
          style={{ backgroundColor: cor }}
        >
          {isAP ? "AP" : isQuest ? "?" : "AD"}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="text-[10px] font-black uppercase tracking-tighter"
              style={{ color: cor }}
            >
              {e.tipo}
            </span>
            <span className="text-[10px] font-bold text-[#0A3D52]/40 uppercase">
              {e.disciplinaCodigo}
            </span>
          </div>
          <h4 className="font-bold text-sm leading-tight mb-1 truncate">{e.titulo}</h4>
          <p className="text-[10px] font-bold text-[#0A3D52]/40 uppercase tracking-tighter truncate">
            {e.disciplinaNome}
            {e.horario ? ` • ${e.horario}` : ""}
          </p>
        </div>
      </div>
      <span
        className={cn(
          "text-[10px] font-black uppercase px-2 py-1 rounded-full shrink-0 text-right",
          encerrado
            ? "bg-[#E74C3C]/10 text-[#E74C3C]"
            : venceHoje
              ? "bg-[#D4941E]/15 text-[#D4941E]"
              : "bg-[#0A3D52]/5 text-[#0A3D52]/60",
        )}
      >
        {statusLabel}
      </span>
    </div>
  );
}

function UrgenciaSection({
  titulo,
  icone,
  eventos,
  agora,
  vazio,
}: {
  titulo: string;
  icone: ReactNode;
  eventos: EventoAcademico[];
  agora: Date;
  vazio: string;
}) {
  return (
    <section className="mb-10">
      <h3 className="text-xs font-black text-[#0A3D52]/40 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
        {icone} {titulo}
      </h3>
      {eventos.length > 0 ? (
        <div className="space-y-3">
          {eventos.map((e) => (
            <UrgenciaCard key={e.id} e={e} agora={agora} />
          ))}
        </div>
      ) : (
        <div className="bg-[#F5F7FA] p-6 rounded-3xl border border-dashed border-[#0A3D52]/10 text-center">
          <p className="text-sm font-bold text-[#0A3D52]/40 uppercase tracking-widest">{vazio}</p>
        </div>
      )}
    </section>
  );
}
