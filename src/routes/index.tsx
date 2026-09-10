import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  BookOpen,
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronDown,
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
  Calculator,
  Users,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AppBottomNav, AppDesktopNav, AppMobileMenu } from "@/components/AppNav";
import { useState, useEffect, useMemo, useCallback, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { AcademicChecklist } from "@/components/academic/AcademicChecklist";
import { StudyAssistant } from "@/components/StudyAssistant";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getTarefasPorDia, type TarefaDiaria } from "@/data/studyPlan";
import { ListChecks } from "lucide-react";
import { toast } from "sonner";

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
      { property: "og:title", content: "Rota da Formatura - CEDERJ" },
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
import { getProgressoEsperado } from "@/lib/progresso";
import {
  getRanking,
  listarPolosRanking,
  publicarNotaRanking,
  type RankingAutor,
} from "@/lib/ranking";
import { seedDatabase, isSupabaseConfigured } from "@/lib/seed";
import { listPodcasts } from "@/lib/podcastService";
import { listPublicacoes } from "@/lib/publicacoesService";
import {
  getStatusEvento,
  getProximaEtapa,
  getDiasParaProximaAP,
  getProgressoSemestre,
  getProgressoTempo,
  formatarDataBrasil,
} from "@/lib/timeline";
import { parseDataLocal } from "@/lib/datas";

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
  const navigate = useNavigate();

  // Conteúdo por disciplina (áudios + docs) — deixa o card clicável e informativo
  const [conteudoMap, setConteudoMap] = useState<Record<string, { audio: number; docs: number }>>(
    {},
  );
  useEffect(() => {
    Promise.all([listPodcasts().catch(() => []), listPublicacoes().catch(() => [])]).then(
      ([pods, pubs]) => {
        const map: Record<string, { audio: number; docs: number }> = {};
        for (const p of pods) {
          const m = map[p.disciplina_id] ?? { audio: 0, docs: 0 };
          m.audio++;
          map[p.disciplina_id] = m;
        }
        for (const p of pubs) {
          const m = map[p.disciplina_id] ?? { audio: 0, docs: 0 };
          if (p.tipo === "podcast") m.audio++;
          else m.docs++;
          map[p.disciplina_id] = m;
        }
        setConteudoMap(map);
      },
    );
  }, []);

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
  const [rankingRefresh, setRankingRefresh] = useState(0);
  const recalcProgresso = useCallback(async (lista: typeof DISCIPLINAS_STATICAS) => {
    const map: Record<string, number> = {};
    await Promise.all(
      lista.map(async (d) => {
        const feitas = await countConcluidas(d.id);
        const pctReal = d.aulas.length ? Math.round((feitas / d.aulas.length) * 100) : 0;
        // Se não há checkpoints, usa progresso esperado pelo cronograma
        map[d.id] = pctReal > 0 ? pctReal : getProgressoEsperado(d);
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

  const proximaEtapa = getProximaEtapa(eventosAcao);
  const diasEtapa = proximaEtapa ? diasPara(proximaEtapa, agora) : null;
  const progressoSemestre = getProgressoSemestre(eventosAcao);
  const progressoTempo = getProgressoTempo(eventosAcao, agora);
  const totalAPs = eventosAcao.filter((e) => e.tipo?.startsWith("AP")).length;
  const apsConcluidas = Math.round((progressoSemestre / 100) * totalAPs);

  // Rodada AP1: provas VINDOURA primeiro, passadas por último
  const ap1s = useMemo(() => {
    const hoje = new Date();
    return eventosAcao
      .filter((e) => e.tipo === "AP1")
      .sort((a, b) => {
        const da = parseDataLocal(a.dataInicio);
        const db = parseDataLocal(b.dataInicio);
        const passadaA = da < hoje;
        const passadaB = db < hoje;
        if (passadaA !== passadaB) return passadaA ? 1 : -1;
        return da.getTime() - db.getTime();
      });
  }, [eventosAcao]);

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
      const status = getStatusEvento(e.dataInicio);
      if (status === "concluido") {
        // eventos já passados — não mostramos na urgência ativa
        // mas podemos contar para progresso
      } else if (status === "hoje") {
        hojeUrgente.push(e);
      } else if (status === "em_breve") {
        proximo.push(e);
      } else {
        depois.push(e);
      }
    }
    return { hojeUrgente, proximo, depois };
  }, [eventosAcao]);

  const profile = {
    name: "Estudante CEDERJ",
    course: "Administração",
    period: "2026-2",
    university: "UFRRJ/CEDERJ",
  };

  const disciplinesList = useMemo(() => {
    let totalAulas = 0;
    let progressoPeso = 0;
    const ad2Events = eventosAcao.filter(
      (e) => e.tipo === "AD2" && parseDataLocal(e.dataInicio) >= new Date(agora),
    );
    const ad2IniciaEm =
      ad2Events.length > 0
        ? new Date(
            Math.min(...ad2Events.map((e) => parseDataLocal(e.dataInicio).getTime())),
          ).toLocaleDateString("pt-BR")
        : "Aguardando";
    const ad2Count = ad2Events.length;
    const dados = disciplinas.map((d) => {
      const feitos = progressoMap[d.id] ?? 0;
      totalAulas += d.aulas.length;
      progressoPeso += feitos;
      const proximo = eventosAcao.find((e) => e.disciplinaId === d.id);
      const days = proximo ? diasPara(proximo, agora) : -1;

      return {
        ...d,
        progresso: feitos,
        ch: d.ch ?? "45h",
        period: d.aulas.length > 0 ? "2º período" : "Aguardando",
        status: days <= 7 && days >= 0 ? "urgent" : days <= 14 && days >= 0 ? "warning" : "normal",
        nextExam: proximo ? { type: proximo.tipo, daysRemaining: days } : null,
      };
    });

    // Calcula CH total do semestre (soma dos valores numéricos)
    const chTotal = dados.reduce<number>((acc, d) => {
      const chStr = String(d.ch ?? "45");
      const match = chStr.match(/(\d+)/);
      return acc + (match ? parseInt(match[1] ?? "45") : 45);
    }, 0);

    const progressoMapTotal = totalAulas ? Math.round((progressoPeso / totalAulas) * 100) : 0;
    return { dados, progressoMapTotal, totalAulas, chTotal, ad2Count, ad2IniciaEm };
  }, [disciplinas, eventosAcao, agora, progressoMap]);
  const { dados, progressoMapTotal, totalAulas, chTotal, ad2Count, ad2IniciaEm } = disciplinesList;

  const data = { profile, disciplines: dados };

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
              <AppMobileMenu />
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2">
            <GraduationCap className="w-8 h-8 text-[#D4941E]" />
            <span className="font-bold text-lg tracking-tight uppercase hidden min-[420px]:inline">
              Rota da Formatura
            </span>
          </div>
        </div>

        <AppDesktopNav />

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
               Seu progresso acadêmico atualizado em tempo real. CEDERJ
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

        {/* Resumo Cards Dinâmicos */}
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
            <span className="text-2xl font-black">{chTotal}h</span>
            <span className="text-xs uppercase font-bold text-[#0A3D52]/50 tracking-wider">
              Carga Horária
            </span>
            <p className="text-xs text-[#0A3D52]/40 mt-1">
              {totalAulas} aulas • {Math.round(progressoMapTotal)}% concluído
            </p>
          </div>
          <div className="bg-[#F5F7FA] p-6 rounded-xl border border-[#0A3D52]/10 shadow-sm flex flex-col items-center text-center">
            <CalendarIcon className="w-6 h-6 text-[#D4941E] mb-2" />
            <span className="text-2xl font-black text-[#D4941E]">
              {diasEtapa === 0
                ? "Hoje"
                : diasEtapa === 1
                  ? "Amanhã"
                  : diasEtapa !== null
                    ? `${diasEtapa} dias`
                    : "—"}
            </span>
            <span className="text-xs uppercase font-bold text-[#D4941E]/60 tracking-wider">
              Próxima Etapa
            </span>
            <p className="text-xs text-[#0A3D52]/40 mt-1">
              {proximaEtapa
                ? `${proximaEtapa.tipo} ${proximaEtapa.disciplinaCodigo}`
                : "Aguardando cronograma"}
            </p>
          </div>
        </div>

        {/* PRÓXIMA ETAPA - AD2 iniciando */}
        <section className="mb-10">
          <h3 className="text-xs font-black text-[#0A3D52]/40 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#D4941E]" /> Próxima Etapa
          </h3>
          <div className="bg-white rounded-2xl border border-[#0A3D52]/10 p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#D4941E]/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-[#D4941E]" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0A3D52]/40">
                  AD2 começa amanhã
                </p>
                <h4 className="font-bold text-lg">
                  {ad2Count > 0 ? `${ad2Count}` : "0"} disciplinas
                </h4>
                <p className="text-[10px] font-bold text-[#0A3D52]/40 uppercase">Questões AD2</p>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0A3D52]/60">
                Próxima prova:{" "}
                {proximaEtapa
                  ? `${proximaEtapa.tipo} ${proximaEtapa.disciplinaCodigo} ${formatarDataBrasil(proximaEtapa.dataInicio)}`
                  : "Aguardando"}
              </p>
              <p className="text-[10px] font-bold text-[#0A3D52]/40 uppercase">
                {ad2Count > 0 ? `AD2 começando ${ad2IniciaEm}` : "Sem AD2 próxima"}
              </p>
            </div>
          </div>

          {/* Barra de progresso do semestre (APs concluídas) */}
          <div className="bg-[#F5F7FA] rounded-2xl border border-[#0A3D52]/10 p-4 mt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#0A3D52]/40">
                Avanço das provas
              </span>
              <span className="text-[10px] font-black uppercase text-[#0A3D52]/60">
                {apsConcluidas}/{totalAPs} • {progressoSemestre}%
              </span>
            </div>
            <div className="w-full h-2 bg-white rounded-full overflow-hidden border border-[#0A3D52]/5">
              <div
                className="h-full bg-[#27AE60] transition-all duration-700"
                style={{ width: `${progressoSemestre}%` }}
              />
            </div>
          </div>

          {/* Barra de tempo do semestre (anda sozinha, sem depender de conclusão) */}
          <div className="bg-[#F5F7FA] rounded-2xl border border-[#0A3D52]/10 p-4 mt-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#0A3D52]/40">
                Semestre decorrido
              </span>
              <span className="text-[10px] font-black uppercase text-[#0A3D52]/60">
                dia {progressoTempo.diasDecorridos}/{progressoTempo.diasTotais} •{" "}
                {progressoTempo.percentual}%
              </span>
            </div>
            <div className="w-full h-2 bg-white rounded-full overflow-hidden border border-[#0A3D52]/5">
              <div
                className="h-full bg-[#D4941E] transition-all duration-700"
                style={{ width: `${progressoTempo.percentual}%` }}
              />
            </div>
            <p className="text-[10px] font-bold text-[#0A3D52]/40 uppercase mt-1.5">
              {progressoTempo.diasRestantes > 0
                ? `Faltam ${progressoTempo.diasRestantes} dias para o fim do semestre`
                : "Semestre encerrado"}
            </p>
          </div>

          {/* Rodada AP1 — vindouras primeiro, passadas no final */}
          <div className="mt-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0A3D52]/40 mb-2 flex items-center gap-2">
              <Target className="w-3.5 h-3.5 text-[#D4941E]" /> Rodada AP1
            </p>
            <div className="space-y-2">
              {ap1s.map((e) => {
                const st = getStatusEvento(e.dataInicio);
                const diasRestantes = diasPara(e, agora);
                const isProxima = st === "em_breve" || st === "hoje";
                const badge =
                  st === "concluido"
                    ? { label: "✓ Concluída", cls: "bg-[#27AE60]/10 text-[#27AE60]" }
                    : st === "hoje"
                      ? { label: "HOJE!", cls: "bg-[#E74C3C]/15 text-[#E74C3C] animate-pulse" }
                      : st === "em_breve"
                        ? {
                            label: `${diasRestantes} dia${diasRestantes !== 1 ? "s" : ""}`,
                            cls: "bg-[#D4941E]/15 text-[#D4941E]",
                          }
                        : {
                            label: formatarDataBrasil(e.dataInicio),
                            cls: "bg-[#0A3D52]/5 text-[#0A3D52]/60",
                          };
                return (
                  <Link
                    key={e.id}
                    to="/disciplines/$id"
                    params={{ id: e.disciplinaId }}
                    search={{ tab: "materiais" }}
                    className={cn(
                      "bg-white rounded-xl border p-3 flex items-center justify-between gap-3 transition-all hover:border-[#D4941E]/50 hover:shadow-md",
                      isProxima
                        ? "border-[#D4941E]/30 shadow-md ring-1 ring-[#D4941E]/10"
                        : "border-[#0A3D52]/10 opacity-60",
                    )}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[10px] font-black uppercase text-[#0A3D52]/40">
                          {e.disciplinaCodigo}
                        </p>
                        {isProxima && (
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-[#D4941E]/10 text-[#D4941E]">
                            Estudar agora
                          </span>
                        )}
                      </div>
                      <p className={cn("font-bold text-sm truncate", isProxima ? "" : "text-[#0A3D52]/60")}>
                        {e.titulo}
                      </p>
                      <p className="text-[10px] font-bold text-[#0A3D52]/40 uppercase mt-0.5">
                        {formatarDataBrasil(e.dataInicio)}
                        {e.horario ? ` às ${e.horario}` : ""}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "text-[10px] font-black uppercase px-2 py-1 rounded-full shrink-0",
                        badge.cls,
                      )}
                    >
                      {badge.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* Missões do Dia (colapsável — secundário) */}
        {tarefasHoje.length > 0 && (
          <SecaoColapsavel
            titulo="Missões do Dia"
            icone={<ListChecks className="w-4 h-4" />}
            resumo={`${missaoFeitas}/${missaoTotal} • ${missaoPct}%`}
          >
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
          </SecaoColapsavel>
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

        {/* URGÊNCIA: DEPOIS (média prazo, colapsável) */}
        <SecaoColapsavel
          titulo={`Depois (média prazo) • ${secoes.depois.length}`}
          icone={<CalendarIcon className="w-4 h-4" />}
        >
          {secoes.depois.length > 0 ? (
            <div className="space-y-3">
              {secoes.depois.map((e) => (
                <UrgenciaCard key={e.id} e={e} agora={agora} />
              ))}
            </div>
          ) : (
            <div className="bg-[#F5F7FA] p-6 rounded-3xl border border-dashed border-[#0A3D52]/10 text-center">
              <p className="text-sm font-bold text-[#0A3D52]/40 uppercase tracking-widest">
                Nada agendado além de 7 dias.
              </p>
            </div>
          )}
        </SecaoColapsavel>

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
            {data.disciplines.map((item) => {
              const conteudo = conteudoMap[item.id] ?? { audio: 0, docs: 0 };
              return (
              <div
                key={item.id}
                onClick={() => navigate({ to: "/disciplines/$id", params: { id: item.id } })}
                className={cn(
                  "bg-[#F5F7FA] rounded-xl border border-[#0A3D52]/10 p-5 hover:shadow-md hover:border-[#D4941E]/40 transition-all group flex flex-col justify-between cursor-pointer",
                  item.status === "urgent" && "border-l-4 border-l-[#E74C3C]",
                  item.status === "warning" && "border-l-4 border-l-[#D4941E]",
                )}
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-2xl">{item.icone}</span>
                    <div className="flex items-center gap-1.5">
                      {conteudo.audio > 0 && (
                        <span className="text-[9px] font-black bg-[#7C3AED]/10 text-[#7C3AED] px-1.5 py-0.5 rounded-full">
                          🎧 {conteudo.audio}
                        </span>
                      )}
                      {conteudo.docs > 0 && (
                        <span className="text-[9px] font-black bg-[#0A3D52]/10 text-[#0A3D52]/60 px-1.5 py-0.5 rounded-full">
                          📄 {conteudo.docs}
                        </span>
                      )}
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
                  <div className="text-[#0A3D52] group-hover:text-[#D4941E] transition-colors flex items-center gap-1 text-[10px] font-black uppercase">
                    Entrar na Rota <ArrowRight className="w-3 h-3" />
                  </div>
                </div>

                {/* Ações rápidas — vão direto ao conteúdo */}
                <div
                  className="grid grid-cols-3 gap-2 mt-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Link
                    to="/disciplines/$id"
                    params={{ id: item.id }}
                    search={{ tab: "materiais" }}
                    className="inline-flex items-center justify-center gap-1 bg-white border border-[#0A3D52]/10 rounded-xl py-2 text-[10px] font-black uppercase tracking-wider text-[#0A3D52] hover:border-[#D4941E] hover:text-[#D4941E] transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" /> Materiais
                  </Link>
                  <Link
                    to="/disciplines/$id/podcast"
                    params={{ id: item.id }}
                    className="inline-flex items-center justify-center gap-1 bg-white border border-[#0A3D52]/10 rounded-xl py-2 text-[10px] font-black uppercase tracking-wider text-[#7C3AED] hover:border-[#7C3AED] transition-colors"
                  >
                    <Headphones className="w-3.5 h-3.5" /> Podcasts
                  </Link>
                  <Link
                    to="/simulados"
                    search={{ disciplina: item.id }}
                    className="inline-flex items-center justify-center gap-1 bg-[#0A3D52] rounded-xl py-2 text-[10px] font-black uppercase tracking-wider text-white hover:bg-[#0A3D52]/90 transition-colors"
                  >
                    <Target className="w-3.5 h-3.5" /> Simular
                  </Link>
                </div>
              </div>
              );
            })}
          </div>
        </section>

        {/* Ranking de Notas */}
        <RankingAlunos disciplinas={dados} refreshKey={rankingRefresh} />

        {/* Publicar Nota */}
        <PublicarNotaSecao
          disciplinas={dados}
          onPublicado={() => setRankingRefresh((k) => k + 1)}
        />
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

      {/* Bottom Mobile Nav (global) */}
      <AppBottomNav />
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
    <Link
      to="/disciplines/$id"
      params={{ id: e.disciplinaId }}
      search={{ tab: "materiais" }}
      className="bg-white p-4 rounded-2xl border border-[#0A3D52]/10 shadow-sm flex items-center justify-between group hover:border-[#D4941E]/40 hover:shadow-md transition-all gap-3"
    >
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
    </Link>
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

// ============================================================
// Seção colapsável — esconde conteúdo secundário para enxugar o dashboard
// ============================================================
function SecaoColapsavel({
  titulo,
  icone,
  resumo,
  padraoAberto = false,
  children,
}: {
  titulo: string;
  icone: ReactNode;
  resumo?: string;
  padraoAberto?: boolean;
  children: ReactNode;
}) {
  const [aberto, setAberto] = useState(padraoAberto);
  return (
    <section className="mb-10">
      <button
        onClick={() => setAberto((v) => !v)}
        className="w-full flex items-center justify-between mb-4 cursor-pointer group"
      >
        <h3 className="text-xs font-black text-[#0A3D52]/40 uppercase tracking-[0.2em] flex items-center gap-2">
          {icone} {titulo}
        </h3>
        <span className="flex items-center gap-2">
          {resumo && (
            <span className="text-[10px] font-black uppercase text-[#0A3D52]/40">{resumo}</span>
          )}
          <ChevronDown
            className={cn(
              "w-4 h-4 text-[#0A3D52]/40 transition-transform group-hover:text-[#D4941E]",
              aberto && "rotate-180",
            )}
          />
        </span>
      </button>
      {aberto && children}
    </section>
  );
}

// ============================================================
// RANKING DE NOTAS (simulados corrigidos + notas publicadas)
// ============================================================
function RankingAlunos({
  disciplinas,
  refreshKey,
}: {
  disciplinas: { id: string; nome: string; codigo?: string }[];
  refreshKey: number;
}) {
  const [rankings, setRankings] = useState<RankingAutor[]>([]);
  const [filtro, setFiltro] = useState<"global" | "disciplina" | "polo">("global");
  const [disciplinaId, setDisciplinaId] = useState("");
  const [polo, setPolo] = useState("");
  const [polos, setPolos] = useState<string[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    listarPolosRanking()
      .then(setPolos)
      .catch(() => {});
  }, [refreshKey]);

  useEffect(() => {
    let vivo = true;
    setCarregando(true);
    getRanking({
      disciplinaId: filtro === "disciplina" && disciplinaId ? disciplinaId : undefined,
      polo: filtro === "polo" && polo ? polo : undefined,
    })
      .then((r) => {
        if (vivo) setRankings(r);
      })
      .catch(() => {})
      .finally(() => {
        if (vivo) setCarregando(false);
      });
    return () => {
      vivo = false;
    };
  }, [filtro, disciplinaId, polo, refreshKey]);

  return (
    <section className="mb-10">
      <h3 className="text-xs font-black text-[#0A3D52]/40 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
        <Trophy className="w-4 h-4 text-[#D4941E]" /> Ranking de Notas
      </h3>
      <div className="bg-white rounded-2xl border border-[#0A3D52]/10 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#0A3D52]/5 flex gap-2 flex-wrap">
          {(["global", "disciplina", "polo"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer",
                filtro === f
                  ? "bg-[#0A3D52] text-white"
                  : "bg-[#F5F7FA] text-[#0A3D52]/50 hover:bg-[#0A3D52]/10",
              )}
            >
              {f === "global" ? "Global" : f === "disciplina" ? "Por Disciplina" : "Por Polo"}
            </button>
          ))}
          {filtro === "disciplina" && (
            <select
              value={disciplinaId}
              onChange={(e) => setDisciplinaId(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-[#F5F7FA] text-[#0A3D52] outline-none cursor-pointer"
            >
              <option value="">Todas</option>
              {disciplinas.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.codigo ?? d.nome}
                </option>
              ))}
            </select>
          )}
          {filtro === "polo" && (
            <select
              value={polo}
              onChange={(e) => setPolo(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-[#F5F7FA] text-[#0A3D52] outline-none cursor-pointer"
            >
              <option value="">Todos</option>
              {polos.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          )}
        </div>
        {carregando ? (
          <p className="px-4 py-6 text-center text-[10px] font-black uppercase tracking-widest text-[#0A3D52]/30">
            Carregando ranking...
          </p>
        ) : rankings.length === 0 ? (
          <p className="px-4 py-6 text-center text-[10px] font-black uppercase tracking-widest text-[#0A3D52]/30">
            Nenhuma nota publicada ainda — seja o primeiro!
          </p>
        ) : (
          <div className="divide-y divide-[#0A3D52]/5">
            {rankings.map((r, i) => (
              <div key={r.autor_local_id} className="flex items-center gap-3 px-4 py-3">
                <span
                  className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0",
                    i === 0
                      ? "bg-[#D4941E]/15 text-[#D4941E]"
                      : i === 1
                        ? "bg-[#0A3D52]/10 text-[#0A3D52]"
                        : "bg-[#F5F7FA] text-[#0A3D52]/40",
                  )}
                >
                  {i + 1}º
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm truncate">{r.autor_nome}</p>
                  <p className="text-[10px] text-[#0A3D52]/40 font-medium">{r.autor_polo}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-black text-sm font-mono">{r.melhor_nota.toFixed(1)}</p>
                  <p className="text-[10px] text-[#0A3D52]/40">
                    média {r.media.toFixed(1)} • {r.total} nota{r.total > 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ============================================================
// PUBLICAR NOTA
// ============================================================
function PublicarNotaSecao({
  disciplinas,
  onPublicado,
}: {
  disciplinas: { id: string; nome: string; codigo?: string }[];
  onPublicado: () => void;
}) {
  const [aberto, setAberto] = useState(false);
  const [disciplinaId, setDisciplinaId] = useState(disciplinas[0]?.id ?? "");
  const [tipo, setTipo] = useState("AP1");
  const [nota, setNota] = useState("");
  const [enviando, setEnviando] = useState(false);

  const handlePublicar = async () => {
    const notaNum = parseFloat(nota);
    if (isNaN(notaNum) || notaNum < 0 || notaNum > 10) return;

    setEnviando(true);
    try {
      const r = await publicarNotaRanking({ disciplinaId, tipo, nota: notaNum });
      if (r.ok) {
        toast.success("Nota publicada com sucesso!");
        setAberto(false);
        setNota("");
        onPublicado();
      } else {
        toast.error(r.error || "Erro ao publicar nota.");
      }
    } catch {
      toast.error("Erro ao publicar nota.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <section className="mb-10">
      {!aberto ? (
        <button
          onClick={() => setAberto(true)}
          className="w-full bg-[#0A3D52]/5 hover:bg-[#0A3D52]/10 border border-dashed border-[#0A3D52]/20 rounded-2xl p-6 text-center transition-colors cursor-pointer"
        >
          <Trophy className="w-6 h-6 mx-auto mb-2 text-[#D4941E]" />
          <p className="font-black text-xs uppercase tracking-widest text-[#0A3D52]/50">
            Publicar Nota
          </p>
          <p className="text-[10px] text-[#0A3D52]/30 mt-1">Compartilhe sua nota no ranking</p>
        </button>
      ) : (
        <div className="bg-white rounded-2xl border border-[#0A3D52]/10 shadow-sm p-6">
          <h3 className="font-black text-sm uppercase tracking-wider text-[#0A3D52] mb-4">
            Publicar Nota
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase text-[#0A3D52]/50 block mb-1">
                  Disciplina
                </label>
                <select
                  value={disciplinaId}
                  onChange={(e) => setDisciplinaId(e.target.value)}
                  className="w-full bg-[#F5F7FA] rounded-xl px-3 py-2.5 text-sm font-bold text-[#0A3D52] outline-none"
                >
                  {disciplinas.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.codigo ?? d.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-[#0A3D52]/50 block mb-1">
                  Etapa
                </label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  className="w-full bg-[#F5F7FA] rounded-xl px-3 py-2.5 text-sm font-bold text-[#0A3D52] outline-none"
                >
                  <option value="AD1">AD1</option>
                  <option value="AP1">AP1</option>
                  <option value="AD2">AD2</option>
                  <option value="AP2">AP2</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-[#0A3D52]/50 block mb-1">
                Nota (0-10)
              </label>
              <input
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                placeholder="Ex: 8.5"
                className="w-full bg-[#F5F7FA] rounded-xl px-3 py-2.5 text-sm font-bold text-[#0A3D52] placeholder:text-[#0A3D52]/30 outline-none focus:ring-2 focus:ring-[#D4941E]"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handlePublicar}
                disabled={enviando || !nota}
                className="flex-1 bg-[#0A3D52] text-white py-2.5 rounded-xl font-black text-xs uppercase tracking-widest disabled:opacity-40 cursor-pointer"
              >
                {enviando ? "Publicando..." : "Confirmar Publicação"}
              </button>
              <button
                onClick={() => setAberto(false)}
                className="px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest text-[#0A3D52]/50 hover:bg-[#F5F7FA] cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
