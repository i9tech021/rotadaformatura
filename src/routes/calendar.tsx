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
  MessageSquare,
  Bell,
  BellRing,
  ExternalLink,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AppBottomNav, AppDesktopNav, AppMobileMenu } from "@/components/AppNav";
import { useState, useMemo, useCallback, useEffect } from "react";
import { eventos as CALENDAR_EVENTS } from "@/data/events";
import { disciplinas } from "@/data/disciplines";
import { generateCalendarLink } from "@/lib/academic.functions";
import { getLembretes, toggleLembrete, verificarLembretes } from "@/lib/lembretes";
const DISCIPLINES = disciplinas;
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
  parseISO,
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
  const [currentDate, setCurrentDate] = useState(new Date()); // Sincronizado com tempo real
  const [lembretes, setLembretes] = useState<Record<string, boolean>>(() => getLembretes());

  // Dispara notificações dos lembretes ativos dentro da janela de alerta (1x/dia)
  useEffect(() => {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    const devidos = verificarLembretes(CALENDAR_EVENTS);
    for (const ev of devidos) {
      try {
        new Notification(`⏰ ${ev.titulo}`, {
          body: `Prazo chegando! Confira o conteúdo cobrado na plataforma.`,
        });
      } catch {
        // sem permissão/contexto — ignora
      }
    }
  }, []);

  const alternarLembrete = (eventId: string, titulo: string) => {
    if (!("Notification" in window)) return;
    const aplicar = () => {
      const ativo = toggleLembrete(eventId);
      setLembretes((prev) => ({ ...prev, [eventId]: ativo }));
      if (ativo && Notification.permission === "granted") {
        try {
          new Notification("Lembrete ativado!", { body: titulo });
        } catch {
          // ignora
        }
      }
    };
    if (Notification.permission === "default") {
      Notification.requestPermission().then(() => aplicar());
      return;
    }
    aplicar();
  };

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
    return CALENDAR_EVENTS.filter((event) => isSameDay(parseISO(event.dataInicio), day));
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
                <AppMobileMenu />
              </SheetContent>
            </Sheet>
            <div className="flex items-center gap-3">
              <Link to="/" className="hover:bg-white/10 p-2 rounded-full transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="font-bold text-lg uppercase tracking-tight hidden min-[420px]:inline">
                Calendário
              </h1>
            </div>
          </div>

          <AppDesktopNav />

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
                  <button
                    onClick={prevMonth}
                    className="p-2 hover:bg-[#0A3D52]/10 rounded-xl transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setCurrentDate(new Date())}
                    className="px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-[#0A3D52]/10 rounded-xl"
                  >
                    Hoje
                  </button>
                  <button
                    onClick={nextMonth}
                    className="p-2 hover:bg-[#0A3D52]/10 rounded-xl transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Day Labels */}
              <div className="grid grid-cols-7 border-b border-[#0A3D52]/5">
                {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
                  <div
                    key={day}
                    className="py-3 text-center text-[10px] font-black uppercase text-[#0A3D52]/40 tracking-widest"
                  >
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
                        (idx + 1) % 7 === 0 && "border-r-0",
                      )}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span
                          className={cn(
                            "w-7 h-7 flex items-center justify-center text-xs font-black rounded-full transition-colors",
                            isToday ? "bg-[#D4941E] text-[#0A3D52]" : "text-[#0A3D52]/60",
                          )}
                        >
                          {format(day, "d")}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {dayEvents.map((event: any) => (
                          <div
                            key={event.id}
                            className={cn(
                              "text-[8px] font-black p-1.5 rounded-lg border uppercase tracking-tighter truncate leading-none",
                              event.tipo.startsWith("AP")
                                ? "bg-[#E74C3C]/10 border-[#E74C3C]/20 text-[#E74C3C]"
                                : event.tipo.startsWith("AD")
                                  ? "bg-[#D4941E]/10 border-[#D4941E]/20 text-[#D4941E]"
                                  : "bg-[#0A3D52]/10 border-[#0A3D52]/20 text-[#0A3D52]",
                            )}
                          >
                            {event.tipo}:{" "}
                            {DISCIPLINES.find((d) => d.id === event.disciplinaId)?.nome.split(
                              " ",
                            )[0] || event.disciplinaCodigo}
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
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-6 text-white/50">
                Próximos Eventos
              </h3>
              <div className="space-y-6">
                {CALENDAR_EVENTS.filter((e) => parseISO(e.dataInicio) >= new Date())
                  .slice(0, 5)
                  .map((event: any) => {
                    const disc = DISCIPLINES.find((d) => d.id === event.disciplinaId);
                    const calLink = generateCalendarLink({
                      title: `${event.tipo} — ${disc?.nome ?? event.disciplinaCodigo}`,
                      date: event.dataInicio,
                      description: `${event.titulo}\n${event.conteudo || ""}\nLocal: ${event.local || "Polo Presencial"}`,
                    });
                    return (
                      <div
                        key={event.id}
                        className="relative pl-6 border-l-2 border-white/10 group"
                      >
                        <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-[#D4941E] group-hover:scale-150 transition-transform" />
                        <p className="text-[9px] font-black uppercase text-white/40 tracking-widest mb-1">
                          {format(parseISO(event.dataInicio), "dd 'de' MMMM", { locale: ptBR })}
                        </p>
                        <h4 className="font-bold text-sm mb-2">{event.titulo}</h4>
                        <div className="flex items-center gap-3 text-[9px] text-white/60 font-bold uppercase">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {event.horario || "Ver guia"}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> Polo Presencial
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <a
                            href={calLink.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[8px] font-black uppercase text-white/40 hover:text-[#D4941E] transition-colors"
                          >
                            <ExternalLink className="w-2.5 h-2.5" /> Google Calendar
                          </a>
                          <button
                            onClick={() => alternarLembrete(event.id, event.titulo)}
                            className={`flex items-center gap-1 text-[8px] font-black uppercase transition-colors cursor-pointer ${
                              lembretes[event.id]
                                ? "text-[#D4941E]"
                                : "text-white/40 hover:text-[#D4941E]"
                            }`}
                          >
                            {lembretes[event.id] ? (
                              <BellRing className="w-2.5 h-2.5" />
                            ) : (
                              <Bell className="w-2.5 h-2.5" />
                            )}
                            {lembretes[event.id] ? "Lembrete ativo" : "Lembrete"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            <div className="bg-white rounded-[2rem] border border-[#0A3D52]/10 p-6 shadow-sm">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-[#0A3D52]/40">
                Legenda
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded bg-[#E74C3C]" />
                  <span className="text-[10px] font-black uppercase text-[#0A3D52]/60">
                    Avaliação Presencial (AP)
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded bg-[#D4941E]" />
                  <span className="text-[10px] font-black uppercase text-[#0A3D52]/60">
                    Avaliação a Distância (AD)
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded bg-[#27AE60]" />
                  <span className="text-[10px] font-black uppercase text-[#0A3D52]/60">
                    Atividade Prática / Laboratório
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <AppBottomNav />
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
