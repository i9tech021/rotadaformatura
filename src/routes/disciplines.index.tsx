import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BookOpen,
  Search,
  Filter,
  ArrowLeft,
  GraduationCap,
  Menu,
  LayoutDashboard,
  Calendar as CalendarIcon,
  FileText,
  Settings,
  MessageSquare,
  Clock,
  ChevronRight,
  Target,
  Zap,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AppBottomNav, AppDesktopNav, AppMobileMenu } from "@/components/AppNav";
import { useEffect, useState, useMemo } from "react";
import { disciplinas, type Disciplina } from "@/data/disciplines";
import { getProgressoTodas, getSemanaAtual, type ProgressoDisciplina } from "@/lib/progresso";
import { SugerirDisciplina } from "@/components/SugerirDisciplina";
import { eventos as ALL_EVENTS } from "@/data/events";
import { isAfter, parseISO, format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

const DISCIPLINES = disciplinas;
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/disciplines/")({
  component: DisciplinesLibrary,
  head: () => ({
    title: "Disciplinas | Rota da Formatura",
    meta: [
      { name: "description", content: "Explore todas as disciplinas do seu curso no CEDERJ." },
    ],
  }),
});

function DisciplinesLibrary() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("Todos");
  const [progresso, setProgresso] = useState<Record<string, ProgressoDisciplina>>({});

  const semanaAtual = getSemanaAtual();

  useEffect(() => {
    getProgressoTodas(DISCIPLINES)
      .then(setProgresso)
      .catch(() => {});
  }, []);

  // Próxima prova por disciplina
  const proximasProvas = useMemo(() => {
    const agora = new Date();
    const map: Record<string, { tipo: string; data: string; diasRestantes: number } | null> = {};
    for (const d of DISCIPLINES) {
      const provas = ALL_EVENTS
        .filter((e: any) => e.disciplinaId === d.id && e.tipo?.startsWith("AP"))
        .filter((e: any) => isAfter(parseISO(e.dataInicio), agora))
        .sort((a: any, b: any) => parseISO(a.dataInicio).getTime() - parseISO(b.dataInicio).getTime());
      if (provas.length > 0) {
        const prox = provas[0] as any;
        map[d.id] = {
          tipo: prox.titulo.replace("AP1 ", "").replace("AP2 ", ""),
          data: prox.dataInicio,
          diasRestantes: differenceInDays(parseISO(prox.dataInicio), agora),
        };
      } else {
        map[d.id] = null;
      }
    }
    return map;
  }, []);

  const periods = ["Todos", ...new Set(DISCIPLINES.map((d) => d.period || "Aguardando"))];

  const filteredDisciplines = DISCIPLINES.filter((d: Disciplina) => {
    const name = d.nome || "";
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPeriod = selectedPeriod === "Todos" || d.period === selectedPeriod;
    return matchesSearch && matchesPeriod;
  });

  // Stats gerais
  const totalAulas = DISCIPLINES.reduce((acc, d) => acc + d.aulas.length, 0);
  const aulasFeitas = Object.values(progresso).reduce((acc, p) => acc + p.aulasFeitas, 0);
  const pctGeral = totalAulas > 0 ? Math.round((aulasFeitas / totalAulas) * 100) : 0;

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
            <div className="flex items-center gap-3">
              <Link to="/" className="hover:bg-white/10 p-2 rounded-full transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="font-bold text-lg uppercase tracking-tight hidden min-[420px]:inline">
                Disciplinas
              </h1>
            </div>
          </div>

          <AppDesktopNav />

          <GraduationCap className="w-6 h-6 text-[#D4941E]" />
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Semester Progress Banner */}
        <div className="bg-gradient-to-br from-[#0A3D52] to-[#0A3D52]/90 rounded-3xl p-6 mb-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-[#D4941E]/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">
                  Semana {semanaAtual} de {14}
                </p>
                <h2 className="text-2xl font-black mt-1">Seu Progresso Geral</h2>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black text-[#D4941E]">{pctGeral}%</p>
                <p className="text-[9px] font-bold text-white/50 uppercase">
                  {aulasFeitas}/{totalAulas} aulas
                </p>
              </div>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#D4941E] rounded-full transition-all duration-1000"
                style={{ width: `${pctGeral}%` }}
              />
            </div>
            <p className="text-[10px] text-white/40 mt-2 font-medium">
              Progresso combinado: aulas concluídas + provas realizadas
            </p>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-white p-5 rounded-2xl border border-[#0A3D52]/10 shadow-sm mb-6 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0A3D52]/30" />
            <input
              type="text"
              placeholder="Buscar disciplina pelo nome..."
              className="w-full bg-[#F5F7FA] border-none rounded-xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-[#D4941E] transition-all outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            <Filter className="w-4 h-4 text-[#0A3D52]/40 shrink-0" />
            {periods.map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border shrink-0",
                  selectedPeriod === period
                    ? "bg-[#D4941E] text-[#0A3D52] border-[#D4941E]"
                    : "bg-white text-[#0A3D52]/50 border-[#0A3D52]/10 hover:border-[#D4941E]/30",
                )}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDisciplines.map((discipline) => {
            const prog = progresso[discipline.id];
            const provasInfo = proximasProvas[discipline.id];
            const pct = prog?.pct ?? 0;
            const pctEsperado = prog?.pctEsperado ?? 0;

            return (
              <Link
                key={discipline.id}
                to="/disciplines/$id"
                params={{ id: discipline.id }}
                className="group bg-white rounded-2xl border border-[#0A3D52]/10 shadow-sm hover:shadow-xl hover:border-[#D4941E]/30 transition-all flex flex-col overflow-hidden relative"
              >
                {/* Color accent bar */}
                <div
                  className="h-1.5 w-full"
                  style={{ background: `linear-gradient(90deg, ${discipline.cor}, ${discipline.cor}88)` }}
                />

                <div className="p-5 flex flex-col flex-1">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                        style={{ backgroundColor: `${discipline.cor}15` }}
                      >
                        {discipline.icone}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm leading-tight text-[#0A3D52] group-hover:text-[#D4941E] transition-colors">
                          {discipline.nome}
                        </h3>
                        <p className="text-[9px] font-black text-[#0A3D52]/40 uppercase tracking-[0.1em]">
                          {discipline.codigo} • {discipline.ch ?? "45h"} • {discipline.period || "—"}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#0A3D52]/20 group-hover:text-[#D4941E] group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                  </div>

                  {/* Progress bars */}
                  <div className="space-y-2 mt-auto">
                    <div className="flex justify-between text-[9px] font-black uppercase text-[#0A3D52]/60">
                      <span>Conclusão</span>
                      <span className="text-[#27AE60]">{pct}%</span>
                    </div>
                    <div className="w-full h-2 bg-[#F5F7FA] rounded-full overflow-hidden relative">
                      {/* Expected progress (ghost bar) */}
                      <div
                        className="absolute inset-y-0 left-0 bg-[#0A3D52]/8 rounded-full"
                        style={{ width: `${pctEsperado}%` }}
                      />
                      {/* Actual progress */}
                      <div
                        className="absolute inset-y-0 left-0 bg-[#27AE60] rounded-full transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-[9px] font-bold text-[#0A3D52]/40 uppercase">
                      {prog?.aulasFeitas ?? 0}/{prog?.totalAulas ?? discipline.aulas.length} aulas
                      {prog?.etapasFeitas != null && prog.etapasFeitas > 0 && (
                        <> • {prog.etapasFeitas}/{prog.totalEtapas} provas</>
                      )}
                    </p>
                  </div>

                  {/* Next exam badge */}
                  {provasInfo && (
                    <div
                      className={cn(
                        "mt-3 flex items-center gap-2 px-3 py-2 rounded-xl border text-[10px] font-bold",
                        provasInfo.diasRestantes <= 7
                          ? "bg-[#D4941E]/8 border-[#D4941E]/20 text-[#D4941E]"
                          : "bg-[#0A3D52]/3 border-[#0A3D52]/8 text-[#0A3D52]/60",
                      )}
                    >
                      <Target className="w-3 h-3 shrink-0" />
                      <span className="truncate">
                        {provasInfo.tipo}
                      </span>
                      <span className="ml-auto shrink-0">
                        {provasInfo.diasRestantes === 0
                          ? "Hoje!"
                          : provasInfo.diasRestantes === 1
                            ? "Amanhã"
                            : `${provasInfo.diasRestantes}d`}
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {filteredDisciplines.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-[#0A3D52]/20">
            <BookOpen className="w-12 h-12 text-[#0A3D52]/10 mx-auto mb-4" />
            <p className="font-bold text-[#0A3D52]/40 uppercase tracking-widest text-sm">
              Nenhuma disciplina encontrada
            </p>
          </div>
        )}

        {/* Sugestão de disciplina (discreta) */}
        <div className="mt-8">
          <SugerirDisciplina />
        </div>
        <AppBottomNav />
      </main>
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
