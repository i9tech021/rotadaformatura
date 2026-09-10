// src/routes/materials.tsx
// CENTRAL DE MATERIAIS — grid de cards por disciplina.
// Clicar no card leva à página dedicada /materials/$id com todos os materiais.
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  BookOpen,
  FileText,
  Headphones,
  Loader2,
  Menu,
  Search,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AppBottomNav, AppDesktopNav, AppMobileMenu } from "@/components/AppNav";
import { useMemo, useState } from "react";
import { MATERIALS } from "@/data/materials";
import { disciplinas } from "@/data/disciplines";
import { listPublicacoes } from "@/lib/publicacoesService";
import { listPodcasts } from "@/lib/podcastService";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/materials")({
  component: MaterialsGrid,
  head: () => ({
    meta: [{ title: "Materiais de Estudo | Rota da Formatura" }],
  }),
});

function MaterialsGrid() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: publicacoes = [] } = useQuery({
    queryKey: ["publicacoes"],
    queryFn: () => listPublicacoes(),
  });

  const { data: episodios = [] } = useQuery({
    queryKey: ["podcasts"],
    queryFn: () => listPodcasts(),
  });

  // Contagem de materiais por disciplina
  const contadores = useMemo(() => {
    const map: Record<string, { curados: number; pubs: number; pods: number; total: number }> = {};
    for (const d of disciplinas) {
      map[d.id] = { curados: 0, pubs: 0, pods: 0, total: 0 };
    }
    for (const m of MATERIALS) {
      if (map[m.disciplineId]) {
        map[m.disciplineId].curados++;
        map[m.disciplineId].total++;
      }
    }
    for (const p of publicacoes) {
      if (map[p.disciplina_id]) {
        map[p.disciplina_id].pubs++;
        map[p.disciplina_id].total++;
      }
    }
    for (const ep of episodios) {
      if (map[ep.disciplina_id]) {
        map[ep.disciplina_id].pods++;
        map[ep.disciplina_id].total++;
      }
    }
    return map;
  }, [publicacoes, episodios]);

  const disciplinasFiltradas = useMemo(() => {
    if (!searchTerm) return disciplinas;
    const s = searchTerm.toLowerCase();
    return disciplinas.filter(
      (d) =>
        d.nome.toLowerCase().includes(s) ||
        d.codigo.toLowerCase().includes(s),
    );
  }, [searchTerm]);

  const totalMateriais = useMemo(
    () => Object.values(contadores).reduce((a, c) => a + c.total, 0),
    [contadores],
  );

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#0A3D52] pb-24 md:pb-8">
      {/* Header */}
      <nav className="bg-[#0A3D52] text-white px-4 py-4 shadow-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
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
              <div>
                <h1 className="font-bold text-lg uppercase tracking-tight">
                  Materiais de Estudo
                </h1>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                  {totalMateriais} materiais em {disciplinas.length} disciplinas
                </p>
              </div>
            </div>
          </div>
          <AppDesktopNav />
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Busca */}
        <div className="bg-white p-4 rounded-2xl border border-[#0A3D52]/10 shadow-sm mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0A3D52]/30" />
            <input
              type="text"
              placeholder="Buscar disciplina..."
              className="w-full bg-[#F5F7FA] border-none rounded-xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-[#D4941E] outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Grid de cards de disciplinas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {disciplinasFiltradas.map((d) => {
            const c = contadores[d.id];
            return (
              <Link
                key={d.id}
                to="/materials/$id"
                params={{ id: d.id }}
                className="group bg-white rounded-3xl border border-[#0A3D52]/10 overflow-hidden shadow-sm hover:shadow-lg hover:border-[#D4941E]/30 transition-all flex flex-col"
              >
                {/* Header colorido */}
                <div
                  className="px-5 py-4 flex items-center gap-4"
                  style={{ background: `${d.cor}10` }}
                >
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-sm"
                    style={{ background: `${d.cor}20` }}
                  >
                    {d.icone}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span
                      className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full"
                      style={{ background: `${d.cor}20`, color: d.cor }}
                    >
                      {d.codigo}
                    </span>
                    <h2 className="font-black text-base text-[#0A3D52] leading-tight mt-1 line-clamp-2 group-hover:text-[#D4941E] transition-colors">
                      {d.nome}
                    </h2>
                  </div>
                </div>

                {/* Conteúdo */}
                <div className="px-5 py-4 flex-1 flex flex-col justify-between">
                  <p className="text-xs text-[#0A3D52]/50 font-medium mb-3">
                    {d.coordenador}
                  </p>

                  {/* Contadores */}
                  <div className="flex gap-3 flex-wrap">
                    {c.curados > 0 && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-[#D4941E] bg-[#D4941E]/10 px-2 py-1 rounded-lg">
                        <BookOpen className="w-3 h-3" /> {c.curados} oficial{c.curados !== 1 ? "is" : ""}
                      </span>
                    )}
                    {c.pods > 0 && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-[#7C3AED] bg-[#7C3AED]/10 px-2 py-1 rounded-lg">
                        <Headphones className="w-3 h-3" /> {c.pods} áudio{c.pods !== 1 ? "s" : ""}
                      </span>
                    )}
                    {c.pubs > 0 && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-[#2563EB] bg-[#2563EB]/10 px-2 py-1 rounded-lg">
                        <FileText className="w-3 h-3" /> {c.pubs} turma
                      </span>
                    )}
                  </div>

                  {/* Total + seta */}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#0A3D52]/5">
                    <span className="text-xl font-black" style={{ color: d.cor }}>
                      {c.total}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#0A3D52]/30 group-hover:text-[#D4941E] transition-colors">
                      Ver materiais →
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {disciplinasFiltradas.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-[#0A3D52]/20">
            <BookOpen className="w-12 h-12 text-[#0A3D52]/10 mx-auto mb-4" />
            <p className="font-bold text-[#0A3D52]/40 uppercase tracking-widest text-sm">
              Nenhuma disciplina encontrada
            </p>
          </div>
        )}
      </main>
      <AppBottomNav />
    </div>
  );
}
