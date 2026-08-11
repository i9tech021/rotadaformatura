import { createFileRoute, Link } from "@tanstack/react-router";
import { 
  FileUp, 
  Search, 
  Filter, 
  FileText, 
  Link as LinkIcon, 
  Trash2, 
  Download, 
  ArrowLeft,
  GraduationCap,
  Plus,
  File
} from "lucide-react";
import { useState, useMemo } from "react";
import { MATERIALS, type Material } from "@/data/materials";
import { DISCIPLINES } from "@/data/disciplines";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

export const Route = createFileRoute("/materials")({
  component: MaterialsManager,
  head: () => ({
    meta: [{ title: "Biblioteca de Materiais | Rota da Formatura" }],
  }),
});

function MaterialsManager() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDiscipline, setFilterDiscipline] = useState("Todas");

  const filteredMaterials = useMemo(() => {
    return MATERIALS.filter(m => {
      const discipline = DISCIPLINES.find(d => d.id === m.disciplineId);
      const disciplineName = discipline?.name || "";
      const matchesSearch = m.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           disciplineName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDiscipline = filterDiscipline === "Todas" || m.disciplineId === filterDiscipline;
      return matchesSearch && matchesDiscipline;
    });
  }, [searchTerm, filterDiscipline]);

  const handleDelete = (id: string) => {
    toast.error("Exclusão simulada. No futuro, isso removerá o arquivo do servidor.");
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#0A3D52] pb-20">
      {/* Header */}
      <nav className="bg-[#0A3D52] text-white px-4 py-4 shadow-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="hover:bg-white/10 p-2 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="font-bold text-lg uppercase tracking-tight">Meus Materiais</h1>
          </div>
          <button className="bg-[#D4941E] text-[#0A3D52] p-2 rounded-xl hover:scale-105 transition-all">
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Controls */}
        <div className="bg-white p-6 rounded-3xl border border-[#0A3D52]/10 shadow-sm mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0A3D52]/30" />
            <input 
              type="text" 
              placeholder="Buscar por título ou matéria..."
              className="w-full bg-[#F5F7FA] border-none rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-[#D4941E]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#0A3D52]/30 shrink-0" />
            <select 
              className="flex-1 bg-[#F5F7FA] border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#D4941E]"
              value={filterDiscipline}
              onChange={(e) => setFilterDiscipline(e.target.value)}
            >
              <option value="Todas">Todas as Disciplinas</option>
              {DISCIPLINES.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Upload Area (Premium UI) */}
        <div className="mb-8 p-10 bg-white border-2 border-dashed border-[#0A3D52]/10 rounded-[2.5rem] flex flex-col items-center justify-center text-center group hover:border-[#D4941E]/30 transition-all cursor-pointer">
          <div className="w-16 h-16 rounded-full bg-[#F5F7FA] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <FileUp className="w-8 h-8 text-[#0A3D52]/20 group-hover:text-[#D4941E]" />
          </div>
          <h3 className="font-black text-sm uppercase tracking-widest mb-2">Upload de Materiais</h3>
          <p className="text-xs text-[#0A3D52]/40 max-w-xs uppercase font-bold leading-relaxed">
            Arraste arquivos PDF ou clique para selecionar.<br/>Limite de 20MB por arquivo.
          </p>
        </div>

        {/* List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-4 text-[10px] font-black uppercase tracking-[0.2em] text-[#0A3D52]/40">
            <span>Arquivo</span>
            <span className="hidden md:block">Data de Upload</span>
            <span>Ações</span>
          </div>
          
          {filteredMaterials.map(material => {
            const discipline = DISCIPLINES.find(d => d.id === material.disciplineId);
            return (
              <div key={material.id} className="bg-white rounded-2xl p-4 border border-[#0A3D52]/10 shadow-sm flex items-center justify-between group hover:border-[#D4941E]/30 transition-all">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                    material.type === 'pdf' ? "bg-[#E74C3C]/10 text-[#E74C3C]" : 
                    material.type === 'link' ? "bg-[#D4941E]/10 text-[#D4941E]" : "bg-[#27AE60]/10 text-[#27AE60]"
                  )}>
                    {material.type === 'pdf' ? <FileText className="w-6 h-6" /> : 
                     material.type === 'link' ? <LinkIcon className="w-6 h-6" /> : <File className="w-6 h-6" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm leading-tight group-hover:text-[#D4941E] transition-colors">{material.title}</h4>
                    <p className="text-[10px] font-bold text-[#0A3D52]/40 uppercase tracking-tighter mt-0.5">
                      {discipline?.name || "Geral"}
                    </p>
                  </div>
                </div>

                <div className="hidden md:block text-[10px] font-black text-[#0A3D52]/30 uppercase">
                  {format(parseISO(material.uploadedAt), "dd/MM/yyyy HH:mm")}
                </div>

                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-[#F5F7FA] rounded-lg text-[#0A3D52]/40 hover:text-[#0A3D52] transition-colors">
                    <Download className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(material.id)}
                    className="p-2 hover:bg-[#E74C3C]/10 rounded-lg text-[#0A3D52]/40 hover:text-[#E74C3C] transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}

          {filteredMaterials.length === 0 && (
            <div className="text-center py-20">
              <FileUp className="w-12 h-12 text-[#0A3D52]/10 mx-auto mb-4" />
              <p className="font-bold text-[#0A3D52]/30 uppercase text-xs tracking-widest">Nenhum material encontrado</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
