import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Search,
  Filter,
  FileText,
  Link as LinkIcon,
  ArrowLeft,
  File,
  Menu,
  ExternalLink,
  BookOpen,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AppBottomNav, AppDesktopNav, AppMobileMenu } from "@/components/AppNav";
import { useState, useMemo } from "react";
import { MATERIALS } from "@/data/materials";
import { disciplinas } from "@/data/disciplines";
const disciplines = disciplinas;
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/materials")({
  component: MaterialsManager,
  head: () => ({
    meta: [{ title: "Materiais | Rota da Formatura" }],
  }),
});

function MaterialsManager() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDiscipline, setFilterDiscipline] = useState("Todas");

  const filteredMaterials = useMemo(() => {
    return MATERIALS.filter((m) => {
      const discipline = disciplines.find((d) => d.id === m.disciplineId);
      const disciplineName = discipline?.nome || "";
      const matchesSearch =
        m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        disciplineName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDiscipline = filterDiscipline === "Todas" || m.disciplineId === filterDiscipline;
      return matchesSearch && matchesDiscipline;
    });
  }, [searchTerm, filterDiscipline]);

  // Contagem por disciplina
  const countByDiscipline = useMemo(() => {
    const map: Record<string, number> = {};
    for (const m of MATERIALS) {
      map[m.disciplineId] = (map[m.disciplineId] || 0) + 1;
    }
    return map;
  }, []);

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
                Materiais de Estudo
              </h1>
            </div>
          </div>
          <AppDesktopNav />
          <BookOpen className="w-6 h-6 text-[#D4941E]" />
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Banner */}
        <div className="bg-gradient-to-br from-[#0A3D52] to-[#0A3D52]/90 rounded-3xl p-6 mb-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4941E]/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
          <div className="relative z-10">
            <h2 className="text-2xl font-black">{MATERIALS.length} Materiais Disponiveis</h2>
            <p className="text-[11px] font-bold text-white/50 mt-1">
              Links oficiais, provas antigas, cadernos e videos organizados por disciplina
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-5 rounded-2xl border border-[#0A3D52]/10 shadow-sm mb-6 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0A3D52]/30" />
            <input
              type="text"
              placeholder="Buscar material..."
              className="w-full bg-[#F5F7FA] border-none rounded-xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-[#D4941E] outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => setFilterDiscipline("Todas")}
              className={cn(
                "px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border shrink-0 cursor-pointer",
                filterDiscipline === "Todas"
                  ? "bg-[#D4941E] text-[#0A3D52] border-[#D4941E]"
                  : "bg-white text-[#0A3D52]/50 border-[#0A3D52]/10 hover:border-[#D4941E]/30",
              )}
            >
              Todas ({MATERIALS.length})
            </button>
            {disciplines.map((d) => (
              <button
                key={d.id}
                onClick={() => setFilterDiscipline(d.id)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border shrink-0 cursor-pointer",
                  filterDiscipline === d.id
                    ? "text-white border-transparent"
                    : "bg-white text-[#0A3D52]/50 border-[#0A3D52]/10 hover:border-[#D4941E]/30",
                )}
                style={filterDiscipline === d.id ? { background: d.cor } : {}}
              >
                {d.codigo} ({countByDiscipline[d.id] || 0})
              </button>
            ))}
          </div>
        </div>

        {/* Materials Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMaterials.map((material) => {
            const discipline = disciplines.find((d) => d.id === material.disciplineId);
            return (
              <a
                key={material.id}
                href={material.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white rounded-2xl border border-[#0A3D52]/10 p-5 shadow-sm hover:shadow-lg hover:border-[#D4941E]/30 transition-all group flex flex-col"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                      material.type === "pdf"
                        ? "bg-[#E74C3C]/10 text-[#E74C3C]"
                        : material.type === "link"
                          ? "bg-[#D4941E]/10 text-[#D4941E]"
                          : "bg-[#27AE60]/10 text-[#27AE60]",
                    )}
                  >
                    {material.type === "pdf" ? (
                      <FileText className="w-5 h-5" />
                    ) : material.type === "link" ? (
                      <LinkIcon className="w-5 h-5" />
                    ) : (
                      <File className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm leading-tight text-[#0A3D52] group-hover:text-[#D4941E] transition-colors line-clamp-2">
                      {material.title}
                    </h4>
                  </div>
                  <ExternalLink className="w-4 h-4 text-[#0A3D52]/15 group-hover:text-[#D4941E] shrink-0 transition-colors" />
                </div>
                {discipline && (
                  <div className="mt-auto pt-3 border-t border-[#0A3D52]/5 flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: discipline.cor }}
                    />
                    <span className="text-[9px] font-black uppercase tracking-wider text-[#0A3D52]/40 truncate">
                      {discipline.codigo} — {discipline.nome}
                    </span>
                  </div>
                )}
              </a>
            );
          })}
        </div>

        {filteredMaterials.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-[#0A3D52]/20">
            <BookOpen className="w-12 h-12 text-[#0A3D52]/10 mx-auto mb-4" />
            <p className="font-bold text-[#0A3D52]/40 uppercase tracking-widest text-sm">
              Nenhum material encontrado
            </p>
          </div>
        )}
      </main>
      <AppBottomNav />
    </div>
  );
}
