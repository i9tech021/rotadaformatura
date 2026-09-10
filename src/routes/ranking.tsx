import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Trophy,
  Menu,
  Medal,
  Crown,
  Star,
  Filter,
  Users,
  TrendingUp,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AppBottomNav, AppDesktopNav, AppMobileMenu } from "@/components/AppNav";
import { useEffect, useState } from "react";
import { disciplinas } from "@/data/disciplines";
import {
  getRanking,
  listarPolosRanking,
  publicarNotaRanking,
  subscribeRanking,
  type RankingAutor,
} from "@/lib/ranking";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/ranking")({
  component: RankingPage,
  head: () => ({
    title: "Ranking | Rota da Formatura",
    meta: [
      { name: "description", content: "Ranking dos alunos da turma 2026-2." },
    ],
  }),
});

function RankingPage() {
  const [ranking, setRanking] = useState<RankingAutor[]>([]);
  const [polos, setPolos] = useState<string[]>([]);
  const [filtroDisciplina, setFiltroDisciplina] = useState("global");
  const [filtroPolo, setFiltroPolo] = useState("todos");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const p = await listarPolosRanking();
        setPolos(p);
        const filtros: Record<string, string> = {};
        if (filtroDisciplina !== "global") filtros.disciplinaId = filtroDisciplina;
        if (filtroPolo !== "todos") filtros.polo = filtroPolo;
        const r = await getRanking(filtros);
        setRanking(r);
      } catch {
        setRanking([]);
      }
      setLoading(false);
    }
    load();

    // Real-time: atualiza ranking quando qualquer aluno publica nota ou termina simulado
    const unsub = subscribeRanking(() => {
      const filtros: Record<string, string> = {};
      if (filtroDisciplina !== "global") filtros.disciplinaId = filtroDisciplina;
      if (filtroPolo !== "todos") filtros.polo = filtroPolo;
      getRanking(filtros).then(setRanking);
    });
    return unsub;
  }, [filtroDisciplina, filtroPolo]);

  const medalhas = [
    { icon: Crown, cls: "text-[#D4941E] bg-[#D4941E]/10", label: "Ouro" },
    { icon: Medal, cls: "text-[#94A3B8] bg-[#94A3B8]/10", label: "Prata" },
    { icon: Star, cls: "text-[#CD7F32] bg-[#CD7F32]/10", label: "Bronze" },
  ];

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
                Ranking
              </h1>
            </div>
          </div>

          <AppDesktopNav />

          <Trophy className="w-6 h-6 text-[#D4941E]" />
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Trophy Banner */}
        <div className="bg-gradient-to-br from-[#D4941E] to-[#D4941E]/80 rounded-3xl p-6 mb-6 text-[#0A3D52] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
              <Trophy className="w-9 h-9" />
            </div>
            <div>
              <h2 className="text-2xl font-black">Ranking da Turma</h2>
              <p className="text-[11px] font-bold opacity-70 mt-1">
                Notas publicadas + simulados corrigidos • Top 10
              </p>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white p-4 rounded-2xl border border-[#0A3D52]/10 shadow-sm mb-6 flex flex-wrap gap-3 items-center">
          <Filter className="w-4 h-4 text-[#0A3D52]/40" />
          <select
            value={filtroDisciplina}
            onChange={(e) => setFiltroDisciplina(e.target.value)}
            className="bg-[#F5F7FA] border-none rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-wider focus:ring-2 focus:ring-[#D4941E] outline-none"
          >
            <option value="global">Todas as disciplinas</option>
            {disciplinas.map((d) => (
              <option key={d.id} value={d.id}>
                {d.codigo} — {d.nome}
              </option>
            ))}
          </select>
          <select
            value={filtroPolo}
            onChange={(e) => setFiltroPolo(e.target.value)}
            className="bg-[#F5F7FA] border-none rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-wider focus:ring-2 focus:ring-[#D4941E] outline-none"
          >
            <option value="todos">Todos os polos</option>
            {polos.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {/* Ranking List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-[#0A3D52]/10 p-5 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#F5F7FA]" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-[#F5F7FA] rounded w-1/3" />
                    <div className="h-3 bg-[#F5F7FA] rounded w-1/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : ranking.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-[#0A3D52]/20">
            <Trophy className="w-12 h-12 text-[#0A3D52]/10 mx-auto mb-4" />
            <p className="font-bold text-[#0A3D52]/40 uppercase tracking-widest text-sm mb-2">
              Nenhuma nota publicada ainda
            </p>
            <p className="text-[11px] text-[#0A3D52]/30 max-w-xs mx-auto">
              Seja o primeiro a publicar suas notas no ranking! Va ate a calculadora de notas de uma disciplina e publique.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {ranking.map((entry, idx) => {
              const medalha = idx < 3 ? medalhas[idx] : null;
              const MedalIcon = medalha?.icon;
              return (
                <div
                  key={entry.autor_local_id}
                  className={cn(
                    "bg-white rounded-2xl border p-5 flex items-center gap-4 transition-all",
                    idx === 0
                      ? "border-[#D4941E]/30 shadow-lg ring-1 ring-[#D4941E]/10"
                      : "border-[#0A3D52]/10 shadow-sm",
                  )}
                >
                  {/* Posição */}
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-black text-sm",
                      idx === 0
                        ? "bg-[#D4941E]/10 text-[#D4941E]"
                        : idx === 1
                          ? "bg-[#94A3B8]/10 text-[#94A3B8]"
                          : idx === 2
                            ? "bg-[#CD7F32]/10 text-[#CD7F32]"
                            : "bg-[#F5F7FA] text-[#0A3D52]/40",
                    )}
                  >
                    {idx + 1}
                  </div>

                  {/* Medalha */}
                  {MedalIcon && (
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", medalha.cls)}>
                      <MedalIcon className="w-4 h-4" />
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{entry.autor_nome}</p>
                    <p className="text-[9px] font-bold text-[#0A3D52]/40 uppercase">
                      {entry.autor_polo || "Polo não informado"} • {entry.total} nota{entry.total !== 1 ? "s" : ""}
                    </p>
                  </div>

                  {/* Nota */}
                  <div className="text-right shrink-0">
                    <p className="text-xl font-black text-[#D4941E]">
                      {entry.melhor_nota.toFixed(1)}
                    </p>
                    <p className="text-[9px] font-bold text-[#0A3D52]/40 uppercase">
                      melhor nota
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <AppBottomNav />
      </main>
    </div>
  );
}
