// src/routes/estatisticas.tsx
// Estatísticas da Turma — dados coletivos de desempenho de todos os alunos.
// Médias por disciplina, taxas de aprovação, disciplinas mais difíceis, etc.
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Users,
  Target,
  Award,
  AlertTriangle,
  Menu,
  GraduationCap,
  LayoutDashboard,
  BookOpen,
  FileText,
  Calendar as CalendarIcon,
  Settings,
  Trophy,
  Headphones,
  Sparkles,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AppBottomNav, AppDesktopNav, AppMobileMenu, HubTabs } from "@/components/AppNav";
import { useState, useMemo, useEffect } from "react";
import { disciplinas } from "@/data/disciplines";
import { getEstatisticasTurma, subscribeRanking, type DisciplinaEstatistica } from "@/lib/ranking";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/estatisticas")({
  component: EstatisticasPage,
  head: () => ({
    title: "Estatísticas da Turma | Rota da Formatura",
    meta: [
      {
        name: "description",
        content: "Estatísticas coletivas de desempenho dos alunos do CEDERJ.",
      },
    ],
  }),
});

interface DisciplinaStats {
  disciplinaId: string;
  disciplinaNome: string;
  mediaGeral: number;
  taxaAprovacao: number;
  totalAlunos: number;
  totalSimulados: number;
  dificuldade: "Fácil" | "Médio" | "Difícil";
  cor: string;
}

// Dados mock de estatísticas (em produção viria do Supabase)
const STATS_MOCK: DisciplinaStats[] = [
  {
    disciplinaId: "EBC",
    disciplinaNome: "Economia Brasileira Contemporânea",
    mediaGeral: 7.2,
    taxaAprovacao: 78,
    totalAlunos: 2847,
    totalSimulados: 1523,
    dificuldade: "Médio",
    cor: "#27AE60",
  },
  {
    disciplinaId: "SO",
    disciplinaNome: "Sociologia das Organizações",
    mediaGeral: 7.8,
    taxaAprovacao: 85,
    totalAlunos: 2654,
    totalSimulados: 1387,
    dificuldade: "Fácil",
    cor: "#2563EB",
  },
  {
    disciplinaId: "CG1",
    disciplinaNome: "Contabilidade Geral I",
    mediaGeral: 6.4,
    taxaAprovacao: 62,
    totalAlunos: 2712,
    totalSimulados: 1654,
    dificuldade: "Difícil",
    cor: "#E74C3C",
  },
  {
    disciplinaId: "MDI",
    disciplinaNome: "Métodos Determinísticos I",
    mediaGeral: 6.1,
    taxaAprovacao: 58,
    totalAlunos: 2589,
    totalSimulados: 1432,
    dificuldade: "Difícil",
    cor: "#E74C3C",
  },
  {
    disciplinaId: "FFN",
    disciplinaNome: "Fundamentos Filosóficos",
    mediaGeral: 7.5,
    taxaAprovacao: 82,
    totalAlunos: 2534,
    totalSimulados: 1198,
    dificuldade: "Médio",
    cor: "#27AE60",
  },
  {
    disciplinaId: "HPA2",
    disciplinaNome: "HPA II",
    mediaGeral: 8.1,
    taxaAprovacao: 89,
    totalAlunos: 2478,
    totalSimulados: 1087,
    dificuldade: "Fácil",
    cor: "#2563EB",
  },
  {
    disciplinaId: "GAI",
    disciplinaNome: "Gestão Ambiental e Inovação",
    mediaGeral: 7.0,
    taxaAprovacao: 75,
    totalAlunos: 2398,
    totalSimulados: 976,
    dificuldade: "Médio",
    cor: "#27AE60",
  },
];

function EstatisticasPage() {
  // nuvem = agregados reais da turma (null = offline/não carregado)
  const [nuvem, setNuvem] = useState<DisciplinaEstatistica[] | null>(null);

  useEffect(() => {
    getEstatisticasTurma().then((rows) => {
      if (rows) setNuvem(rows);
    });
    return subscribeRanking(() => {
      getEstatisticasTurma().then((rows) => {
        if (rows) setNuvem(rows);
      });
    });
  }, []);

  const stats: DisciplinaStats[] = useMemo(() => {
    // Banco vazio => mantém amostra local (sem badge "ao vivo")
    if (!nuvem || !nuvem.length) return STATS_MOCK;
    return nuvem.map((d) => {
      const disc = disciplinas.find((x) => x.id === d.disciplinaId);
      const dificuldade = d.media >= 7.5 ? "Fácil" : d.media >= 6.5 ? "Médio" : "Difícil";
      const cor =
        dificuldade === "Fácil" ? "#2563EB" : dificuldade === "Médio" ? "#27AE60" : "#E74C3C";
      return {
        disciplinaId: d.disciplinaId,
        disciplinaNome: disc?.nome ?? d.disciplinaId,
        mediaGeral: d.media,
        taxaAprovacao: d.taxaAprovacao,
        totalAlunos: d.totalAlunos,
        totalSimulados: d.totalSimulados,
        dificuldade,
        cor,
      } as DisciplinaStats;
    });
  }, [nuvem]);

  const statsGerais = useMemo(() => {
    const media = stats.reduce((acc, s) => acc + s.mediaGeral, 0) / stats.length;
    const aprovacao = stats.reduce((acc, s) => acc + s.taxaAprovacao, 0) / stats.length;
    const maisFacil = stats.reduce((a, b) => (a.mediaGeral > b.mediaGeral ? a : b));
    const maisDificil = stats.reduce((a, b) => (a.mediaGeral < b.mediaGeral ? a : b));
    const totalSimulados = stats.reduce((acc, s) => acc + s.totalSimulados, 0);
    return { media, aprovacao, maisFacil, maisDificil, totalSimulados };
  }, [stats]);

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
              <BarChart3 className="w-5 h-5 text-[#D4941E]" />
              <h1 className="font-bold text-lg uppercase tracking-tight hidden sm:inline">
                Estatísticas da Turma
              </h1>
            </div>
          </div>
          <AppDesktopNav />
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <HubTabs
          items={[
            { to: "/ranking", label: "Alunos" },
            { to: "/estatisticas", label: "Estatísticas" },
          ]}
        />
        {/* Cards de Resumo */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-2xl border border-[#0A3D52]/10">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-[#27AE60]" />
              <span className="text-[10px] font-bold text-[#0A3D52]/40 uppercase">Média Geral</span>
            </div>
            <p className="text-2xl font-black text-[#27AE60]">{statsGerais.media.toFixed(1)}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-[#0A3D52]/10">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-[#2563EB]" />
              <span className="text-[10px] font-bold text-[#0A3D52]/40 uppercase">Aprovação</span>
            </div>
            <p className="text-2xl font-black text-[#2563EB]">
              {statsGerais.aprovacao.toFixed(0)}%
            </p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-[#0A3D52]/10">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-4 h-4 text-[#D4941E]" />
              <span className="text-[10px] font-bold text-[#0A3D52]/40 uppercase">Mais Fácil</span>
            </div>
            <p className="text-sm font-black text-[#D4941E]">
              {statsGerais.maisFacil.disciplinaNome.split(" ")[0]}
            </p>
            <p className="text-xs text-[#0A3D52]/40">Média {statsGerais.maisFacil.mediaGeral}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-[#0A3D52]/10">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-[#E74C3C]" />
              <span className="text-[10px] font-bold text-[#0A3D52]/40 uppercase">
                Mais Difícil
              </span>
            </div>
            <p className="text-sm font-black text-[#E74C3C]">
              {statsGerais.maisDificil.disciplinaNome.split(" ")[0]}
            </p>
            <p className="text-xs text-[#0A3D52]/40">Média {statsGerais.maisDificil.mediaGeral}</p>
          </div>
        </div>

        {/* Simulados Realizados */}
        <div className="bg-gradient-to-r from-[#0A3D52] to-[#0A3D52]/80 rounded-2xl p-6 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">
                Total de Simulados Realizados
              </p>
              <p className="text-4xl font-black mt-1">
                {statsGerais.totalSimulados.toLocaleString("pt-BR")}
              </p>
              <p className="text-xs opacity-60 mt-1">por todos os alunos do CEDERJ</p>
            </div>
            <div className="w-16 h-16 bg-[#D4941E]/20 rounded-full flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-[#D4941E]" />
            </div>
          </div>
        </div>

        {/* Gráfico de Barras - Média por Disciplina */}
        <div className="bg-white rounded-2xl border border-[#0A3D52]/10 p-6 mb-6">
          <h2 className="font-black text-sm uppercase mb-4">Média por Disciplina</h2>
          <div className="space-y-4">
            {stats.map((stat) => (
              <div key={stat.disciplinaId}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold truncate max-w-[200px]">
                    {stat.disciplinaNome}
                  </span>
                  <span className="text-xs font-black" style={{ color: stat.cor }}>
                    {stat.mediaGeral.toFixed(1)}
                  </span>
                </div>
                <div className="h-3 bg-[#F5F7FA] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(stat.mediaGeral / 10) * 100}%`,
                      backgroundColor: stat.cor,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Taxa de Aprovação */}
        <div className="bg-white rounded-2xl border border-[#0A3D52]/10 p-6 mb-6">
          <h2 className="font-black text-sm uppercase mb-4">Taxa de Aprovação</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <div
                key={stat.disciplinaId}
                className={cn(
                  "p-4 rounded-xl border text-center",
                  stat.taxaAprovacao >= 80
                    ? "border-[#27AE60]/20 bg-[#27AE60]/5"
                    : stat.taxaAprovacao >= 60
                      ? "border-[#D4941E]/20 bg-[#D4941E]/5"
                      : "border-[#E74C3C]/20 bg-[#E74C3C]/5",
                )}
              >
                <p className="text-2xl font-black" style={{ color: stat.cor }}>
                  {stat.taxaAprovacao}%
                </p>
                <p className="text-[10px] font-bold text-[#0A3D52]/40 mt-1 truncate">
                  {stat.disciplinaNome.split(" ")[0]}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Nível de Dificuldade */}
        <div className="bg-white rounded-2xl border border-[#0A3D52]/10 p-6">
          <h2 className="font-black text-sm uppercase mb-4">Classificação de Dificuldade</h2>
          <div className="flex flex-wrap gap-3">
            {stats.map((stat) => (
              <div
                key={stat.disciplinaId}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-black",
                  stat.dificuldade === "Fácil"
                    ? "bg-[#27AE60]/10 text-[#27AE60]"
                    : stat.dificuldade === "Médio"
                      ? "bg-[#D4941E]/10 text-[#D4941E]"
                      : "bg-[#E74C3C]/10 text-[#E74C3C]",
                )}
              >
                {stat.disciplinaNome.split(" ")[0]} — {stat.dificuldade}
              </div>
            ))}
          </div>
        </div>
      </main>

      <AppBottomNav />
    </div>
  );
}
