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
  Play
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { AcademicChecklist } from "@/components/academic/AcademicChecklist";
import { formatDistanceToNow, differenceInDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/")({
  component: AcademicDashboard,
  head: () => ({
    title: "Rota da Formatura | Dashboard Acadêmico",
    meta: [
      { name: "description", content: "Organize seus estudos do CEDERJ com a Rota da Formatura. Cronogramas, checklists e progresso em tempo real." },
      { property: "og:title", content: "Rota da Formatura | Seu Planner Universitário" },
      { property: "og:description", content: "Dashboard acadêmico personalizado para alunos do CEDERJ com foco em organização e aprovação." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" }
    ],
  }),
});

import { disciplinas } from '../data/disciplines';
import { getProximosEventos, getEventosUrgentes } from '../data/events';
import { getTarefasPendentes } from '../data/studyPlan';

function AcademicDashboard() {
  const proximosEventos = useMemo(() => getProximosEventos(60), []);
  const missaoPrioritaria = useMemo(() => proximosEventos[0], [proximosEventos]);

  const [data] = useState({
    profile: {
      name: "Estudante CEDERJ",
      course: "Administração",
      period: "2026-2",
      university: "UFRRJ/CEDERJ",
    },
    disciplines: disciplinas.map(d => {
      const exam = d.avaliacoes
        .filter(a => parseISO(a.dataPresencial || a.dataFim || '') > new Date())
        .sort((a, b) => parseISO(a.dataPresencial || a.dataFim || '').getTime() - parseISO(b.dataPresencial || b.dataFim || '').getTime())[0];
      
      const days = exam ? differenceInDays(parseISO(exam.dataPresencial || exam.dataFim || ''), new Date()) : -1;
      
      return {
        ...d,
        ch: d.id.includes('hpa') ? "60h" : "45h",
        period: d.aulas.length > 0 ? "2º período" : "Aguardando",
        status: days <= 7 && days >= 0 ? "urgent" : (days <= 14 && days >= 0 ? "warning" : "normal"),
        nextExam: exam ? { type: exam.tipo, daysRemaining: days } : { type: "N/A", daysRemaining: 0 }
      };
    }),
  });

  const [greeting, setGreeting] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [countdown, setCountdown] = useState("");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) setGreeting("Bom dia");
    else if (hour >= 12 && hour < 18) setGreeting("Boa tarde");
    else setGreeting("Boa noite");
  }, []);

  useEffect(() => {
    if (!missaoPrioritaria) return;
    
    const updateCountdown = () => {
      const target = parseISO(missaoPrioritaria.dataInicio);
      setCountdown(formatDistanceToNow(target, { locale: ptBR, addSuffix: true }));
    };
    
    updateCountdown();
    const timer = setInterval(updateCountdown, 60000);
    return () => clearInterval(timer);
  }, [missaoPrioritaria]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "urgent": return "bg-[#E74C3C]";
      case "warning": return "bg-[#D4941E]";
      default: return "bg-[#27AE60]";
    }
  };

  const getStatusBorder = (status: string) => {
    switch (status) {
      case "urgent": return "border-[#E74C3C]";
      case "warning": return "border-[#D4941E]";
      default: return "border-[#27AE60]";
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
            <span className="font-bold text-lg tracking-tight uppercase hidden xs:inline">Rota da Formatura</span>
          </div>
        </div>
        
        <div className="hidden md:flex items-center gap-6 mr-6">
          <Link to="/" className="text-xs font-black uppercase tracking-widest hover:text-[#D4941E] transition-colors">Dashboard</Link>
          <Link to="/community" className="text-xs font-black uppercase tracking-widest hover:text-[#D4941E] transition-colors">Comunidade</Link>
          <Link to="/calendar" className="text-xs font-black uppercase tracking-widest hover:text-[#D4941E] transition-colors">Agenda</Link>
          <Link to="/disciplines" className="text-xs font-black uppercase tracking-widest hover:text-[#D4941E] transition-colors">Biblioteca</Link>
          <Link to="/materials" className="text-xs font-black uppercase tracking-widest hover:text-[#D4941E] transition-colors">Arquivos</Link>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-[10px] opacity-60 leading-none uppercase font-black">{data.profile.course}</span>
            <span className="text-sm font-bold">{data.profile.name}</span>
          </div>
          <Link to="/settings" className="w-10 h-10 rounded-full bg-[#D4941E] flex items-center justify-center font-bold text-[#0A3D52] hover:scale-105 transition-transform">
            {data.profile.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
          </Link>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-[#0A3D52]">{greeting}, {data.profile.name.split(" ")[0]}!</h2>
          <p className="text-[#0A3D52]/60 mt-1">Seu progresso acadêmico atualizado em tempo real.</p>
        </div>

        {/* Resumo Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#F5F7FA] p-6 rounded-xl border border-[#0A3D52]/10 shadow-sm flex flex-col items-center text-center">
            <BookOpen className="w-6 h-6 text-[#0A3D52] mb-2" />
            <span className="text-2xl font-black">{data.disciplines.length}</span>
            <span className="text-xs uppercase font-bold text-[#0A3D52]/50 tracking-wider">Disciplinas</span>
          </div>
          <div className="bg-[#F5F7FA] p-6 rounded-xl border border-[#0A3D52]/10 shadow-sm flex flex-col items-center text-center">
            <Clock className="w-6 h-6 text-[#0A3D52] mb-2" />
            <span className="text-2xl font-black">330h</span>
            <span className="text-xs uppercase font-bold text-[#0A3D52]/50 tracking-wider">Carga Total</span>
          </div>
          <div className="bg-[#F5F7FA] p-6 rounded-xl border border-[#0A3D52]/10 shadow-sm flex flex-col items-center text-center">
            <CalendarIcon className="w-6 h-6 text-[#D4941E] mb-2" />
            <span className="text-2xl font-black text-[#D4941E]">
              {missaoPrioritaria ? differenceInDays(parseISO(missaoPrioritaria.dataInicio), new Date()) : 0} dias
            </span>
            <span className="text-xs uppercase font-bold text-[#D4941E]/60 tracking-wider">Próxima Avaliação</span>
          </div>
        </div>

        {/* Próxima Missão */}
        <section className="mb-10">
          <h3 className="text-xs font-black text-[#0A3D52]/40 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <Target className="w-4 h-4" /> Próxima Missão Prioritária
          </h3>
          <div className="bg-white border-2 border-[#D4941E] rounded-2xl p-6 shadow-lg shadow-[#D4941E]/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Trophy className="w-24 h-24 text-[#D4941E]" />
            </div>
            <div className="relative z-10">
              <span className="inline-block bg-[#D4941E] text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter mb-2">
                {missaoPrioritaria?.tipo || 'Próximo Evento'}
              </span>
              <h4 className="text-xl md:text-2xl font-bold mb-2">{missaoPrioritaria?.disciplinaNome || 'Nenhum evento próximo'}</h4>
              <p className="text-[#0A3D52]/70 text-sm mb-4">
                {missaoPrioritaria?.conteudo || 'Fique atento ao seu cronograma acadêmico.'}
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 bg-[#F5F7FA] px-3 py-1.5 rounded-lg border border-[#0A3D52]/10">
                  <Clock className="w-4 h-4 text-[#0A3D52]/60" />
                  <span className="text-sm font-bold">Inicia: {countdown || '...'}</span>
                </div>
                <Link to="/community/chat" className="bg-[#D4941E] hover:bg-[#B87D17] text-[#0A3D52] px-6 py-2 rounded-lg font-black text-sm uppercase transition-colors shadow-md text-center">
                  Entrar no Chat da Turma
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Missões Diárias */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-black text-[#0A3D52]/40 uppercase tracking-[0.2em]">Sua Rota Hoje: {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</h3>
            <span className="text-[10px] font-black uppercase text-[#27AE60]">Meta Diária</span>
          </div>
          <div className="space-y-3">
            {getTarefasPendentes().length > 0 ? (
              getTarefasPendentes().map(tarefa => (
                <div key={tarefa.id} className="bg-white p-4 rounded-2xl border border-[#0A3D52]/10 shadow-sm flex items-center justify-between group hover:border-[#D4941E]/30 transition-all">
                  <div className="flex items-center gap-4">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", 
                      tarefa.tipo === 'podcast' ? "bg-[#7C3AED]/10 text-[#7C3AED]" : 
                      tarefa.tipo === 'video' ? "bg-[#2563EB]/10 text-[#2563EB]" : "bg-[#D4941E]/10 text-[#D4941E]")}>
                      {tarefa.tipo === 'podcast' ? <Headphones className="w-5 h-5" /> : 
                       tarefa.tipo === 'video' ? <Play className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm leading-tight mb-1">{tarefa.titulo}</h4>
                      <p className="text-[10px] font-bold text-[#0A3D52]/40 uppercase tracking-tighter">{tarefa.disciplinaNome} • {tarefa.duracaoMinutos} min</p>
                    </div>
                  </div>
                  <button className="w-8 h-8 rounded-full border-2 border-[#0A3D52]/10 flex items-center justify-center hover:border-[#27AE60] hover:bg-[#27AE60]/10 transition-colors group">
                    <CheckCircle2 className="w-4 h-4 text-[#0A3D52]/10 group-hover:text-[#27AE60]" />
                  </button>
                </div>
              ))
            ) : (
              <div className="bg-[#F5F7FA] p-8 rounded-3xl border border-dashed border-[#0A3D52]/10 text-center">
                <Trophy className="w-8 h-8 text-[#D4941E] mx-auto mb-2 opacity-50" />
                <p className="text-sm font-bold text-[#0A3D52]/40 uppercase tracking-widest">Tudo limpo por hoje! Descanse ou adiante algo.</p>
              </div>
            )}
          </div>
        </section>

        {/* Disciplinas Grid */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs font-black text-[#0A3D52]/40 uppercase tracking-[0.2em]">Disciplinas do Semestre</h3>
            <Link to="/disciplines" className="text-[10px] font-black uppercase text-[#D4941E] border-b-2 border-[#D4941E]">Ver Grade Completa</Link>
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
                  item.status === "warning" && "border-l-4 border-l-[#D4941E]"
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
                        className={cn("h-full transition-all duration-700", getStatusColor(item.status))} 
                        style={{ width: `${item.progresso}%` }} 
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#0A3D52]/5 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <CalendarIcon className="w-3 h-3 text-[#0A3D52]/40" />
                    <span className="text-[10px] font-bold text-[#0A3D52]/60 uppercase tracking-tighter">
                      Próxima: {item.nextExam.type} em {item.nextExam.daysRemaining} dias
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

      {/* Chat Interface (Simple Sidebar Toggle) */}
      {showChat && (
        <div className="fixed inset-0 z-[60] flex justify-end">
          <div className="absolute inset-0 bg-black/20" onClick={() => setShowChat(false)} />
          <div className="relative w-full max-w-sm bg-white h-full shadow-2xl flex flex-col">
            <div className="bg-[#0A3D52] p-4 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#D4941E] flex items-center justify-center">
                  <User className="w-4 h-4 text-[#0A3D52]" />
                </div>
                <div>
                  <p className="text-sm font-bold">Assistente Acadêmico</p>
                  <p className="text-[10px] opacity-70">Online • Rota da Formatura</p>
                </div>
              </div>
              <button onClick={() => setShowChat(false)} className="text-2xl">&times;</button>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto bg-[#F5F7FA] space-y-4">
              <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-[#0A3D52]/10 text-sm shadow-sm max-w-[85%]">
                Olá Vinícius! Sou seu tutor virtual. Vi que você tem <strong>Métodos Determinísticos</strong> na lista hoje. Quer revisar os Exercícios Programados (EPs)?
              </div>
              <div className="bg-[#0A3D52] p-3 rounded-2xl rounded-tr-none text-white text-sm shadow-sm self-end ml-auto max-w-[85%]">
                Quando é minha próxima prova?
              </div>
              <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-[#0A3D52]/10 text-sm shadow-sm max-w-[85%]">
                Sua próxima prova é a <strong>AP1 de Métodos Determinísticos I</strong>, em 5 dias (05/09). Você já completou 45% do progresso! 🚀
              </div>
            </div>

            <div className="p-4 border-t border-[#0A3D52]/10 flex gap-2">
              <input 
                type="text" 
                placeholder="Pergunte sobre sua rota..."
                className="flex-1 bg-[#F5F7FA] border-none rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-[#D4941E]"
              />
              <button className="bg-[#0A3D52] text-white px-4 py-2 rounded-lg font-bold text-sm">
                Enviar
              </button>
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
