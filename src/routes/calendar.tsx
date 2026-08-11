import { createFileRoute, Link } from "@tanstack/react-router";
import { 
  ArrowLeft, 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  Clock,
  MapPin,
  Menu,
  GraduationCap,
  LayoutDashboard,
  BookOpen,
  FileText,
  Settings,
  MessageSquare
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState, useMemo } from "react";
import { eventos as CALENDAR_EVENTS } from "@/data/events";
import { metodosDeterministicos, historiaPensamentoAdm, contabilidadeGeral } from "@/data/disciplines";
const DISCIPLINES = [metodosDeterministicos, historiaPensamentoAdm, contabilidadeGeral];
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  parseISO
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/calendar")({
  component: AcademicCalendarPage,
  head: () => ({
    meta: [{ title: "Calendário Acadêmico | Rota da Formatura" }],
  }),
});

function AcademicCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 8, 1)); // Set to Sept 2026 to match mock data

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const getEventsForDay = (day: Date) => {
    return CALENDAR_EVENTS.filter(event => isSameDay(parseISO(event.dataInicio), day));
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#0A3D52] pb-20">
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
              <h1 className="font-bold text-lg uppercase tracking-tight hidden xs:inline">Calendário</h1>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6 mr-6">
            <Link to="/" className="text-xs font-black uppercase tracking-widest hover:text-[#D4941E] transition-colors">Dashboard</Link>
            <Link to="/calendar" className="text-xs font-black uppercase tracking-widest text-[#D4941E]">Agenda</Link>
            <Link to="/disciplines" className="text-xs font-black uppercase tracking-widest hover:text-[#D4941E] transition-colors">Biblioteca</Link>
            <Link to="/materials" className="text-xs font-black uppercase tracking-widest hover:text-[#D4941E] transition-colors">Arquivos</Link>
          </div>

          <button className="bg-[#D4941E] text-[#0A3D52] px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-wider hover:scale-105 transition-all">
            Sincronizar
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Calendar Grid */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-[2rem] border border-[#0A3D52]/10 shadow-sm overflow-hidden">
              {/* Calendar Header */}
              <div className="p-6 border-b border-[#0A3D52]/5 flex items-center justify-between bg-[#0A3D52]/5">
                <h2 className="text-xl font-black uppercase tracking-tight">
                  {format(currentDate, "MMMM yyyy", { locale: ptBR })}
                </h2>
                <div className="flex items-center gap-2">
                  <button onClick={prevMonth} className="p-2 hover:bg-[#0A3D52]/10 rounded-xl transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-[#0A3D52]/10 rounded-xl">
                    Hoje
                  </button>
                  <button onClick={nextMonth} className="p-2 hover:bg-[#0A3D52]/10 rounded-xl transition-colors">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Day Labels */}
              <div className="grid grid-cols-7 border-b border-[#0A3D52]/5">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                  <div key={day} className="py-3 text-center text-[10px] font-black uppercase text-[#0A3D52]/40 tracking-widest">
                    {day}
                  </div>
                ))}
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7">
                {calendarDays.map((day, idx) => {
                  const dayEvents = getEventsForDay(day);
                  const isCurrentMonth = isSameMonth(day, monthStart);
                  const isToday = isSameDay(day, new Date());

                  return (
                    <div 
                      key={idx} 
                      className={cn(
                        "min-h-[120px] p-2 border-b border-r border-[#0A3D52]/5 transition-colors hover:bg-[#F5F7FA]/50",
                        !isCurrentMonth && "bg-[#F5F7FA]/30 opacity-40",
                        (idx + 1) % 7 === 0 && "border-r-0"
                      )}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className={cn(
                          "w-7 h-7 flex items-center justify-center text-xs font-black rounded-full transition-colors",
                          isToday ? "bg-[#D4941E] text-[#0A3D52]" : "text-[#0A3D52]/60"
                        )}>
                          {format(day, 'd')}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {dayEvents.map((event: any) => (
                          <div 
                            key={event.id}
                            className={cn(
                              "text-[8px] font-black p-1.5 rounded-lg border uppercase tracking-tighter truncate leading-none",
                              event.tipo.startsWith('AP') ? "bg-[#E74C3C]/10 border-[#E74C3C]/20 text-[#E74C3C]" : 
                              event.tipo.startsWith('AD') ? "bg-[#D4941E]/10 border-[#D4941E]/20 text-[#D4941E]" : 
                              "bg-[#0A3D52]/10 border-[#0A3D52]/20 text-[#0A3D52]"
                            )}
                          >
                            {event.tipo}: {DISCIPLINES.find(d => d.id === event.disciplinaId)?.nome.split(' ')[0] || event.disciplinaCodigo}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Events Sidebar */}
          <div className="space-y-6">
            <div className="bg-[#0A3D52] text-white rounded-[2rem] p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-6 text-white/50">Próximos Eventos</h3>
              <div className="space-y-6">
                {CALENDAR_EVENTS.slice(0, 5).map((event: any) => (
                  <div key={event.id} className="relative pl-6 border-l-2 border-white/10 group">
                    <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-[#D4941E] group-hover:scale-150 transition-transform" />
                    <p className="text-[9px] font-black uppercase text-white/40 tracking-widest mb-1">
                      {format(parseISO(event.dataInicio), "dd 'de' MMMM", { locale: ptBR })}
                    </p>
                    <h4 className="font-bold text-sm mb-2">{event.titulo}</h4>
                    <div className="flex items-center gap-3 text-[9px] text-white/60 font-bold uppercase">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {event.horario || 'Ver guia'}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> Polo Presencial</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-[2rem] border border-[#0A3D52]/10 p-6 shadow-sm">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-[#0A3D52]/40">Legenda</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded bg-[#E74C3C]" />
                  <span className="text-[10px] font-black uppercase text-[#0A3D52]/60">Avaliação Presencial (AP)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded bg-[#D4941E]" />
                  <span className="text-[10px] font-black uppercase text-[#0A3D52]/60">Avaliação a Distância (AD)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded bg-[#27AE60]" />
                  <span className="text-[10px] font-black uppercase text-[#0A3D52]/60">Atividade Prática / Laboratório</span>
                </div>
              </div>
            </div>
          </div>
        </div>
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
