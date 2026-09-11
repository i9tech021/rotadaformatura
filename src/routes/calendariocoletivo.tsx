// src/routes/calendariocoletivo.tsx
// Calendário Coletivo — eventos que afetam TODOS os alunos do CEDERJ.
// Prazos de monografia, TCC, estágio, formaturas, colação de grau, etc.
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Clock,
  Users,
  GraduationCap,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Menu,
  LayoutDashboard,
  BookOpen,
  Settings,
  Trophy,
  Headphones,
  Sparkles,
  BarChart3,
  Activity,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AppBottomNav, AppDesktopNav, AppMobileMenu, HubTabs } from "@/components/AppNav";
import { useState, useMemo, useEffect, useCallback } from "react";
import {
  listEventosColetivos,
  sugerirEventoColetivo,
  subscribeEventosColetivos,
  type EventoColetivo,
  type TipoEventoColetivo,
} from "@/lib/calendarioColetivoService";
import { registrarAtividade } from "@/lib/feedService";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/calendariocoletivo")({
  component: CalendarioColetivoPage,
  head: () => ({
    title: "Calendário Coletivo | Rota da Formatura",
    meta: [
      {
        name: "description",
        content: "Calendário compartilhado com prazos e eventos importantes do CEDERJ.",
      },
    ],
  }),
});

interface EventoCalendario extends EventoColetivo {
  afetaTodos: boolean;
  dataFim?: string;
}

const toUI = (e: EventoColetivo): EventoCalendario => ({ ...e, afetaTodos: true });

// Dados mock de eventos coletivos
const EVENTOS_MOCK: EventoCalendario[] = [
  {
    id: "e1",
    titulo: "Início das Aulas 2026-2",
    descricao: "Primeiro dia de aulas do semestre. Verifique seu horário no portal.",
    data: "2026-07-28",
    tipo: "aula",
    afetaTodos: true,
    criadoPor: "CEDERJ",
  },
  {
    id: "e2",
    titulo: "Prazo Monografia - Versão Preliminar",
    descricao: "Entrega da versão preliminar da monografia para orientação.",
    data: "2026-09-15",
    tipo: "prazo",
    afetaTodos: true,
    criadoPor: "Coordenação",
  },
  {
    id: "e3",
    titulo: "AD1 - Métodos Determinísticos I",
    descricao: "Prova de Avaliação Diagnóstica 1. Peso: 20% da média final.",
    data: "2026-09-05",
    hora: "14:00",
    tipo: "prova",
    afetaTodos: true,
    criadoPor: "Prof. Silva",
  },
  {
    id: "e4",
    titulo: "Feriado - Independência",
    descricao: "Não haverá aulas. Aproveite para estudar!",
    data: "2026-09-07",
    tipo: "evento",
    afetaTodos: true,
    criadoPor: "CEDERJ",
  },
  {
    id: "e5",
    titulo: "Prazo TCC - Projeto Final",
    descricao: "Entrega do projeto final do TCC para aprovação da banca.",
    data: "2026-10-30",
    tipo: "prazo",
    afetaTodos: true,
    criadoPor: "Coordenação",
  },
  {
    id: "e6",
    titulo: "Colação de Grau - Turma 2025-2",
    descricao: "Cerimônia de colação de grau dos formandos do semestre anterior.",
    data: "2026-11-15",
    hora: "10:00",
    tipo: "formatura",
    afetaTodos: true,
    criadoPor: "CEDERJ",
  },
  {
    id: "e7",
    titulo: "Prazo Estágio - Relatório Final",
    descricao: "Entrega do relatório final de estágio para validação.",
    data: "2026-12-01",
    tipo: "prazo",
    afetaTodos: true,
    criadoPor: "Coordenação",
  },
  {
    id: "e8",
    titulo: "Semana de Provas Finais",
    descricao: "Período de provas finais do semestre. Confira seu horário no portal.",
    data: "2026-12-10",
    dataFim: "2026-12-20",
    tipo: "prova",
    afetaTodos: true,
    criadoPor: "CEDERJ",
  },
];

const TIPO_CONFIG = {
  prova: { icon: FileText, cor: "#E74C3C", bg: "#E74C3C10" },
  prazo: { icon: AlertTriangle, cor: "#D4941E", bg: "#D4941E10" },
  evento: { icon: CalendarIcon, cor: "#2563EB", bg: "#2563EB10" },
  formatura: { icon: GraduationCap, cor: "#27AE60", bg: "#27AE6010" },
  aula: { icon: BookOpen, cor: "#7C3AED", bg: "#7C3AED10" },
};

function CalendarioColetivoPage() {
  const [nuvem, setNuvem] = useState<EventoCalendario[] | null>(null);
  const eventos = useMemo(
    () => nuvem ?? EVENTOS_MOCK.map((e) => ({ ...e, afetaTodos: true })),
    [nuvem],
  );
  const [mesAtual, setMesAtual] = useState(new Date(2026, 8, 1)); // Setembro 2026
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [showSugerir, setShowSugerir] = useState(false);

  const recarregar = useCallback(async () => {
    const rows = await listEventosColetivos();
    if (rows) setNuvem(rows.map(toUI));
  }, []);

  useEffect(() => {
    recarregar();
    return subscribeEventosColetivos(recarregar);
  }, [recarregar]);

  const handleSugerir = async (input: {
    titulo: string;
    descricao: string;
    data: string;
    hora?: string | undefined;
    tipo: TipoEventoColetivo;
  }) => {
    const res = await sugerirEventoColetivo(input);
    setShowSugerir(false);
    if (res.ok) {
      void registrarAtividade({
        acao: `sugeriu evento: ${input.titulo}`,
        tipo: "contribuicao",
      });
    }
  };

  const eventosFiltrados = useMemo(() => {
    return eventos.filter((e) => {
      if (filtroTipo !== "todos" && e.tipo !== filtroTipo) return false;
      return true;
    });
  }, [eventos, filtroTipo]);

  const eventosMes = useMemo(() => {
    const mes = mesAtual.getMonth();
    const ano = mesAtual.getFullYear();
    return eventosFiltrados
      .filter((e) => {
        const d = new Date(e.data);
        return d.getMonth() === mes && d.getFullYear() === ano;
      })
      .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
  }, [eventosFiltrados, mesAtual]);

  const eventosProximos = useMemo(() => {
    const hoje = new Date();
    return eventosFiltrados
      .filter((e) => new Date(e.data) >= hoje)
      .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
      .slice(0, 5);
  }, [eventosFiltrados]);

  const diasNoMes = useMemo(() => {
    const mes = mesAtual.getMonth();
    const ano = mesAtual.getFullYear();
    const primeiroDia = new Date(ano, mes, 1).getDay();
    const diasNoMes = new Date(ano, mes + 1, 0).getDate();
    return { primeiroDia, diasNoMes };
  }, [mesAtual]);

  const nomesMes = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const obterEventosDoDia = (dia: number) => {
    const mes = mesAtual.getMonth();
    const ano = mesAtual.getFullYear();
    const dataStr = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
    return eventosFiltrados.filter((e) => e.data === dataStr);
  };

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
              <CalendarIcon className="w-5 h-5 text-[#D4941E]" />
              <h1 className="font-bold text-lg uppercase tracking-tight hidden sm:inline">
                Calendário Coletivo
              </h1>
            </div>
          </div>
          <AppDesktopNav />
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <HubTabs
          items={[
            { to: "/calendar", label: "Acadêmico" },
            { to: "/calendariocoletivo", label: "Coletivo" },
          ]}
        />
        <button
          onClick={() => setShowSugerir(true)}
          className="w-full bg-[#D4941E] text-[#0A3D52] py-3 rounded-2xl font-black text-sm uppercase tracking-wider hover:scale-[1.02] transition-all flex items-center justify-center gap-2 mb-6"
        >
          <Plus className="w-4 h-4" />
          Sugerir evento
        </button>

        {/* Filtros */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { value: "todos", label: "Todos" },
            { value: "prova", label: "Provas" },
            { value: "prazo", label: "Prazos" },
            { value: "evento", label: "Eventos" },
            { value: "formatura", label: "Formaturas" },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFiltroTipo(f.value)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors",
                filtroTipo === f.value
                  ? "bg-[#0A3D52] text-white"
                  : "bg-white text-[#0A3D52] border border-[#0A3D52]/10",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Calendário */}
          <div className="bg-white rounded-2xl border border-[#0A3D52]/10 p-6">
            {/* Navegação do Mês */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() =>
                  setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() - 1))
                }
                className="p-2 hover:bg-[#F5F7FA] rounded-xl transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="font-black text-sm uppercase">
                {nomesMes[mesAtual.getMonth()]} {mesAtual.getFullYear()}
              </h2>
              <button
                onClick={() =>
                  setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1))
                }
                className="p-2 hover:bg-[#F5F7FA] rounded-xl transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Dias da Semana */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {diasSemana.map((dia) => (
                <div key={dia} className="text-center text-[10px] font-bold text-[#0A3D52]/40 py-2">
                  {dia}
                </div>
              ))}
            </div>

            {/* Dias do Mês */}
            <div className="grid grid-cols-7 gap-1">
              {/* Espaços vazios antes do primeiro dia */}
              {Array.from({ length: diasNoMes.primeiroDia }).map((_, i) => (
                <div key={`empty-${i}`} className="h-10" />
              ))}

              {/* Dias */}
              {Array.from({ length: diasNoMes.diasNoMes }).map((_, i) => {
                const dia = i + 1;
                const eventosDia = obterEventosDoDia(dia);
                const hoje = new Date();
                const ehHoje =
                  dia === hoje.getDate() &&
                  mesAtual.getMonth() === hoje.getMonth() &&
                  mesAtual.getFullYear() === hoje.getFullYear();

                return (
                  <div
                    key={dia}
                    className={cn(
                      "h-10 rounded-lg flex flex-col items-center justify-center relative",
                      ehHoje ? "bg-[#D4941E] text-white font-black" : "hover:bg-[#F5F7FA]",
                    )}
                  >
                    <span className="text-xs">{dia}</span>
                    {eventosDia.length > 0 && (
                      <div className="flex gap-0.5 mt-0.5">
                        {eventosDia.slice(0, 3).map((e) => (
                          <div
                            key={e.id}
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: TIPO_CONFIG[e.tipo].cor }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Legenda */}
            <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-[#0A3D52]/10">
              {Object.entries(TIPO_CONFIG).map(([tipo, config]) => (
                <div key={tipo} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: config.cor }} />
                  <span className="text-[10px] text-[#0A3D52]/60 capitalize">{tipo}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Eventos do Mês */}
          <div>
            <h2 className="font-black text-sm uppercase mb-4">
              Eventos de {nomesMes[mesAtual.getMonth()]}
            </h2>
            <div className="space-y-3">
              {eventosMes.length === 0 ? (
                <div className="bg-white rounded-2xl border border-[#0A3D52]/10 p-8 text-center">
                  <CalendarIcon className="w-8 h-8 text-[#0A3D52]/20 mx-auto mb-3" />
                  <p className="text-xs text-[#0A3D52]/40">Neste mês</p>
                </div>
              ) : (
                eventosMes.map((evento) => {
                  const config = TIPO_CONFIG[evento.tipo];
                  const Icon = config.icon;
                  return (
                    <div
                      key={evento.id}
                      className="bg-white rounded-2xl border border-[#0A3D52]/10 p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: config.bg }}
                        >
                          <Icon className="w-5 h-5" style={{ color: config.cor }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-sm">{evento.titulo}</h3>
                          <p className="text-xs text-[#0A3D52]/60 mt-1">{evento.descricao}</p>
                          <div className="flex items-center gap-3 mt-2 text-[10px] text-[#0A3D52]/40">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(evento.data).toLocaleDateString("pt-BR")}
                              {evento.hora && ` às ${evento.hora}`}
                            </span>
                            {evento.afetaTodos && (
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                Todos os alunos
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Próximos Eventos */}
        <div className="mt-8">
          <h2 className="font-black text-sm uppercase mb-4">Próximos Eventos</h2>
          <div className="bg-gradient-to-r from-[#0A3D52] to-[#0A3D52]/80 rounded-2xl p-6 text-white">
            <div className="space-y-4">
              {eventosProximos.map((evento) => {
                const config = TIPO_CONFIG[evento.tipo];
                const Icon = config.icon;
                const diasRestantes = Math.ceil(
                  (new Date(evento.data).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
                );
                return (
                  <div key={evento.id} className="flex items-center gap-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${config.cor}30` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: config.cor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm">{evento.titulo}</p>
                      <p className="text-xs opacity-60">
                        {new Date(evento.data).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-black" style={{ color: config.cor }}>
                        {diasRestantes}
                      </p>
                      <p className="text-[10px] opacity-60">dias</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {showSugerir && (
        <SugerirEventoModal onEnviar={handleSugerir} onFechar={() => setShowSugerir(false)} />
      )}

      <AppBottomNav />
    </div>
  );
}

function SugerirEventoModal({
  onEnviar,
  onFechar,
}: {
  onEnviar: (input: {
    titulo: string;
    descricao: string;
    data: string;
    hora?: string | undefined;
    tipo: TipoEventoColetivo;
  }) => void;
  onFechar: () => void;
}) {
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const [tipo, setTipo] = useState<TipoEventoColetivo>("evento");

  const valido = titulo.trim() && data;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-md p-6">
        <h2 className="text-lg font-black mb-4">Sugerir Evento</h2>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase text-[#0A3D52]/40 mb-1 block">
              Título
            </label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Grupo de estudo AP1 EBC"
              className="w-full bg-[#F5F7FA] rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#D4941E]/40"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase text-[#0A3D52]/40 mb-1 block">
                Data
              </label>
              <input
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="w-full bg-[#F5F7FA] rounded-xl px-4 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-[#0A3D52]/40 mb-1 block">
                Hora (opcional)
              </label>
              <input
                type="time"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                className="w-full bg-[#F5F7FA] rounded-xl px-4 py-2.5 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-[#0A3D52]/40 mb-1 block">
              Tipo
            </label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as TipoEventoColetivo)}
              className="w-full bg-[#F5F7FA] rounded-xl px-4 py-2.5 text-sm"
            >
              <option value="evento">Evento</option>
              <option value="prova">Prova</option>
              <option value="prazo">Prazo</option>
              <option value="aula">Aula</option>
              <option value="formatura">Formatura</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-[#0A3D52]/40 mb-1 block">
              Descrição
            </label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Detalhes do evento..."
              className="w-full bg-[#F5F7FA] rounded-xl px-4 py-3 text-sm h-20 resize-none outline-none focus:ring-2 focus:ring-[#D4941E]/40"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onFechar}
            className="flex-1 py-2.5 rounded-xl border border-[#0A3D52]/20 text-sm font-bold"
          >
            Cancelar
          </button>
          <button
            onClick={() =>
              valido &&
              onEnviar({
                titulo: titulo.trim(),
                descricao: descricao.trim(),
                data,
                hora: hora || undefined,
                tipo,
              })
            }
            disabled={!valido}
            className="flex-1 py-2.5 rounded-xl bg-[#D4941E] text-[#0A3D52] text-sm font-black disabled:opacity-40"
          >
            Publicar
          </button>
        </div>
      </div>
    </div>
  );
}
