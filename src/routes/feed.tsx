// src/routes/feed.tsx
// Feed de Atividade — mostra o que outros alunos estão fazendo em tempo real.
// Cria senso de comunidade e motivação no EAD.
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Activity,
  BookOpen,
  CheckCircle2,
  Clock,
  FileText,
  GraduationCap,
  Menu,
  Settings,
  Sparkles,
  Trophy,
  Users,
  Headphones,
  LayoutDashboard,
  Calendar as CalendarIcon,
  BarChart3,
  Zap,
  Star,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AppBottomNav, AppDesktopNav, AppMobileMenu } from "@/components/AppNav";
import { useState, useEffect, useMemo, useCallback, type SVGProps } from "react";
import {
  listAtividades,
  subscribeAtividades,
  tempoRelativo,
  type AtividadeCompartilhada,
} from "@/lib/feedService";
import { getOnlineCount } from "@/lib/presenca";
import { disciplinas } from "@/data/disciplines";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/feed")({
  component: FeedPage,
  head: () => ({
    title: "Feed de Atividade | Rota da Formatura",
    meta: [
      {
        name: "description",
        content: "Veja o que outros alunos do CEDERJ estão estudando agora.",
      },
    ],
  }),
});

interface Atividade {
  id: string;
  usuario: string;
  polo: string;
  acao: string;
  disciplina: string;
  tempo: string;
  tipo: "estudo" | "simulado" | "conquista" | "upload" | "contribuicao";
}

// Dados mock de atividades (em produção viria do Supabase Realtime)
const ATIVIDADES_MOCK: Atividade[] = [
  {
    id: "a1",
    usuario: "Carlos O.",
    polo: "São Fidélis",
    acao: "completou aula de Economia",
    disciplina: "EBC",
    tempo: "agora",
    tipo: "estudo",
  },
  {
    id: "a2",
    usuario: "Ana S.",
    polo: "Petrópolis",
    acao: "fez simulado de Métodos",
    disciplina: "MDI",
    tempo: "2min atrás",
    tipo: "simulado",
  },
  {
    id: "a3",
    usuario: "Pedro C.",
    polo: "Resende",
    acao: "subiu prova de Contabilidade",
    disciplina: "CG1",
    tempo: "5min atrás",
    tipo: "upload",
  },
  {
    id: "a4",
    usuario: "Maria S.",
    polo: "Macaé",
    acao: "ganhou troféu de 7 dias seguidos",
    disciplina: "",
    tempo: "8min atrás",
    tipo: "conquista",
  },
  {
    id: "a5",
    usuario: "Lucia F.",
    polo: "Angra dos Reis",
    acao: "completou 50 questões de Sociologia",
    disciplina: "SO",
    tempo: "12min atrás",
    tipo: "estudo",
  },
  {
    id: "a6",
    usuario: "João P.",
    polo: "Itaperuna",
    acao: "contribuiu com resumo de HPA II",
    disciplina: "HPA2",
    tempo: "15min atrás",
    tipo: "contribuicao",
  },
  {
    id: "a7",
    usuario: "Fernanda M.",
    polo: "Magé",
    acao: "fez simulado de Filosofia",
    disciplina: "FFN",
    tempo: "18min atrás",
    tipo: "simulado",
  },
  {
    id: "a8",
    usuario: "Ricardo L.",
    polo: "Cantagalo",
    acao: "completou aula de Gestão Ambiental",
    disciplina: "GAI",
    tempo: "22min atrás",
    tipo: "estudo",
  },
  {
    id: "a9",
    usuario: "Juliana B.",
    polo: "Rio das Flores",
    acao: "ganhou troféu de 30 questões",
    disciplina: "",
    tempo: "25min atrás",
    tipo: "conquista",
  },
  {
    id: "a10",
    usuario: "Marcos A.",
    polo: "Barra do Piraí",
    acao: "completou checklist de EBC",
    disciplina: "EBC",
    tempo: "28min atrás",
    tipo: "estudo",
  },
];

const TIPO_CONFIG = {
  estudo: { icon: BookOpen, cor: "#27AE60", label: "Estudando" },
  simulado: { icon: Sparkles, cor: "#2563EB", label: "Simulado" },
  conquista: { icon: Trophy, cor: "#D4941E", label: "Conquista" },
  upload: { icon: Upload, cor: "#7C3AED", label: "Upload" },
  contribuicao: { icon: Star, cor: "#E74C3C", label: "Contribuição" },
};

function FeedPage() {
  // nuvem = feed coletivo em tempo real (null = offline/não carregado)
  const [nuvem, setNuvem] = useState<Atividade[] | null>(null);
  const [local, setLocal] = useState<Atividade[]>(ATIVIDADES_MOCK);
  const atividades = nuvem ?? local;
  const [filtro, setFiltro] = useState("todas");
  const [online, setOnline] = useState(() => getOnlineCount());

  const recarregar = useCallback(async () => {
    const rows: AtividadeCompartilhada[] | null = await listAtividades();
    if (rows) {
      setNuvem(
        rows.map((a) => ({
          id: a.id,
          usuario: a.usuario,
          polo: a.polo,
          acao: a.acao,
          disciplina: a.disciplinaId,
          tempo: tempoRelativo(a.criadoEm),
          tipo: a.tipo,
        })),
      );
    }
  }, []);

  useEffect(() => {
    recarregar();
    const unsub = subscribeAtividades((a) => {
      setNuvem((prev) =>
        [
          {
            id: a.id,
            usuario: a.usuario,
            polo: a.polo,
            acao: a.acao,
            disciplina: a.disciplinaId,
            tempo: "agora",
            tipo: a.tipo,
          },
          ...(prev ?? []),
        ].slice(0, 30),
      );
    });
    const tick = setInterval(() => setOnline(getOnlineCount()), 10_000);
    return () => {
      unsub();
      clearInterval(tick);
    };
  }, [recarregar]);

  // Simula movimento apenas no modo offline (sem banco, sem realtime)
  useEffect(() => {
    if (nuvem) return;
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      const novasAcoes = [
        { acao: "começou a estudar", tipo: "estudo" as const },
        { acao: "fez um simulado", tipo: "simulado" as const },
        { acao: "subiu uma prova", tipo: "upload" as const },
        { acao: "ganhou um troféu", tipo: "conquista" as const },
      ];
      const usuarios = ["Ana P.", "Carlos M.", "Maria L.", "Pedro S.", "Lucia R."];
      const polos = ["Petrópolis", "São Fidélis", "Macaé", "Resende", "Angra dos Reis"];
      const discs = disciplinas.map((d) => d.id);

      const random = novasAcoes[Math.floor(Math.random() * novasAcoes.length)] ?? novasAcoes[0]!;
      const usuario = usuarios[Math.floor(Math.random() * usuarios.length)] ?? "Aluno";
      const polo = polos[Math.floor(Math.random() * polos.length)] ?? "";
      const discId = discs[Math.floor(Math.random() * discs.length)] ?? "EBC";
      const novaAtividade: Atividade = {
        id: `a${Date.now()}`,
        usuario,
        polo,
        acao: `${random.acao} ${discId}`,
        disciplina: discId,
        tempo: "agora",
        tipo: random.tipo,
      };

      setLocal((prev) => [novaAtividade, ...prev.slice(0, 19)]);
    }, 30000);

    return () => clearInterval(interval);
  }, [nuvem]);

  const atividadesFiltradas = useMemo(() => {
    if (filtro === "todas") return atividades;
    return atividades.filter((a) => a.tipo === filtro);
  }, [atividades, filtro]);

  const stats = useMemo(() => {
    const estudando = atividades.filter((a) => a.tipo === "estudo").length;
    const simulados = atividades.filter((a) => a.tipo === "simulado").length;
    return { online, estudando, simulados };
  }, [atividades, online]);

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
              <Activity className="w-5 h-5 text-[#D4941E]" />
              <h1 className="font-bold text-lg uppercase tracking-tight hidden sm:inline">
                Feed de Atividade
              </h1>
              {nuvem && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-[#27AE60]/20 rounded-full text-[9px] font-black uppercase text-[#7CFC9A]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#27AE60] animate-pulse" />
                  Ao vivo
                </span>
              )}
            </div>
          </div>
          <AppDesktopNav />
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-[#27AE60]/10 p-4 rounded-2xl border border-[#27AE60]/20 text-center">
            <p className="text-2xl font-black text-[#27AE60]">{stats.online}</p>
            <p className="text-[10px] font-bold text-[#0A3D52]/40 uppercase">Online Agora</p>
          </div>
          <div className="bg-[#2563EB]/10 p-4 rounded-2xl border border-[#2563EB]/20 text-center">
            <p className="text-2xl font-black text-[#2563EB]">{stats.estudando}</p>
            <p className="text-[10px] font-bold text-[#0A3D52]/40 uppercase">Estudando</p>
          </div>
          <div className="bg-[#D4941E]/10 p-4 rounded-2xl border border-[#D4941E]/20 text-center">
            <p className="text-2xl font-black text-[#D4941E]">{stats.simulados}</p>
            <p className="text-[10px] font-bold text-[#0A3D52]/40 uppercase">Fazendo Simulado</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { value: "todas", label: "Todas" },
            { value: "estudo", label: "Estudos" },
            { value: "simulado", label: "Simulados" },
            { value: "conquista", label: "Conquistas" },
            { value: "upload", label: "Uploads" },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFiltro(f.value)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors",
                filtro === f.value
                  ? "bg-[#0A3D52] text-white"
                  : "bg-white text-[#0A3D52] border border-[#0A3D52]/10",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Feed */}
        <div className="space-y-3">
          {atividadesFiltradas.map((atividade) => {
            const config = TIPO_CONFIG[atividade.tipo];
            const Icon = config.icon;
            return (
              <div
                key={atividade.id}
                className="bg-white rounded-2xl border border-[#0A3D52]/10 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${config.cor}20` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: config.cor }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-sm">{atividade.usuario}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F5F7FA] text-[#0A3D52]/60">
                        {atividade.polo}
                      </span>
                    </div>
                    <p className="text-xs text-[#0A3D52]/60 mt-0.5">{atividade.acao}</p>
                  </div>
                  <span className="text-[10px] text-[#0A3D52]/30 flex-shrink-0">
                    {atividade.tempo}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <AppBottomNav />
    </div>
  );
}

function Upload(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}
