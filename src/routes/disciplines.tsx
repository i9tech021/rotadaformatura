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
  MessageSquare
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { metodosDeterministicos, historiaPensamentoAdm, contabilidadeGeral } from "@/data/disciplines";

const DISCIPLINES = [
  metodosDeterministicos,
  historiaPensamentoAdm,
  contabilidadeGeral,
  { id: "fundamentos-financas", name: "Fundamentos de Finanças", icone: "💰", cor: "#D97706", ch: "45h", period: "5º período", progress: 0 },
  { id: "tga-i", name: "Teoria Geral da Administração I", icone: "🏢", cor: "#4F46E5", ch: "45h", period: "5º período", progress: 0 },
];
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/disciplines")({
  component: DisciplinesLibrary,
  head: () => ({
    title: "Biblioteca de Disciplinas | Rota da Formatura",
    meta: [
      { name: "description", content: "Explore todas as disciplinas do seu curso no CEDERJ." },
    ],
  }),
});

function DisciplinesLibrary() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("Todos");

  const periods = ["Todos", "2º período", "3º período", "5º período"];

  const filteredDisciplines = DISCIPLINES.filter((d: any) => {
    const name = d.nome || d.name || "";
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPeriod = selectedPeriod === "Todos" || d.period === selectedPeriod;
    return matchesSearch && matchesPeriod;
  });

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
                    <MobileNavLink to="/community" icon={MessageSquare} label="Comunidade" />
                    <MobileNavLink to="/settings" icon={Settings} label="Configurações" />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            <div className="flex items-center gap-3">
              <Link to="/" className="hover:bg-white/10 p-2 rounded-full transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="font-bold text-lg uppercase tracking-tight hidden xs:inline">Biblioteca</h1>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6 mr-6">
            <Link to="/" className="text-xs font-black uppercase tracking-widest hover:text-[#D4941E] transition-colors">Dashboard</Link>
            <Link to="/calendar" className="text-xs font-black uppercase tracking-widest hover:text-[#D4941E] transition-colors">Agenda</Link>
            <Link to="/disciplines" className="text-xs font-black uppercase tracking-widest text-[#D4941E]">Biblioteca</Link>
            <Link to="/materials" className="text-xs font-black uppercase tracking-widest hover:text-[#D4941E] transition-colors">Arquivos</Link>
          </div>

          <GraduationCap className="w-6 h-6 text-[#D4941E]" />
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Search & Filters */}
        <div className="bg-white p-6 rounded-2xl border border-[#0A3D52]/10 shadow-sm mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0A3D52]/30" />
            <input 
              type="text" 
              placeholder="Buscar disciplina pelo nome..."
              className="w-full bg-[#F5F7FA] border-none rounded-xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-[#D4941E] transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
            <Filter className="w-4 h-4 text-[#0A3D52]/40 shrink-0" />
            {periods.map(period => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border shrink-0",
                  selectedPeriod === period 
                    ? "bg-[#D4941E] text-[#0A3D52] border-[#D4941E]" 
                    : "bg-white text-[#0A3D52]/50 border-[#0A3D52]/10 hover:border-[#D4941E]/30"
                )}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDisciplines.map(discipline => (
            <Link 
              key={discipline.id}
              to="/disciplines/$id"
              params={{ id: discipline.id }}
              className="group bg-white rounded-2xl border border-[#0A3D52]/10 p-6 shadow-sm hover:shadow-xl hover:border-[#D4941E]/30 transition-all flex flex-col justify-between overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <BookOpen className="w-20 h-20 text-[#0A3D52]" />
              </div>
              
              <div className="relative z-10">
                <div className="text-3xl mb-4 transform group-hover:scale-110 transition-transform origin-left">{(discipline as any).icone || (discipline as any).icon}</div>
                <h3 className="font-bold text-lg mb-1 leading-tight text-[#0A3D52] group-hover:text-[#D4941E] transition-colors">
                  {(discipline as any).nome || (discipline as any).name}
                </h3>
                <p className="text-[10px] font-black text-[#0A3D52]/40 uppercase tracking-[0.1em] mb-4">
                  {(discipline as any).ch || "45h"} • {(discipline as any).period || "2º período"}
                </p>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-[9px] font-black uppercase text-[#0A3D52]/60">
                    <span>Conclusão</span>
                    <span>{(discipline as any).progresso ?? (discipline as any).progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#F5F7FA] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#27AE60] transition-all duration-700"
                      style={{ width: `${(discipline as any).progresso ?? (discipline as any).progress}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#0A3D52]/5 flex items-center justify-between relative z-10">
                <span className="text-[10px] font-bold text-[#27AE60] uppercase">Grade Curricular</span>
                <span className="text-[#D4941E] opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all font-black text-[10px] uppercase">Acessar &rarr;</span>
              </div>
            </Link>
          ))}
        </div>

        {filteredDisciplines.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-[#0A3D52]/20">
            <BookOpen className="w-12 h-12 text-[#0A3D52]/10 mx-auto mb-4" />
            <p className="font-bold text-[#0A3D52]/40 uppercase tracking-widest text-sm">Nenhuma disciplina encontrada</p>
          </div>
        )}
      </main>
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
