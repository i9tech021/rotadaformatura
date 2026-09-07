// src/routes/simulados.tsx
// Simulados de prova — geração por IA (1/semana), cronômetro, correção automática.
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Calculator,
  Calendar as CalendarIcon,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Menu,
  MessageCircle,
  RefreshCcw,
  Settings,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { disciplinas } from "@/data/disciplines";
import {
  gerarSimuladoIA,
  listarSimulados,
  podeGerar,
  type Questao,
  type SimuladoRealizado,
} from "@/lib/simuladoService";
import { SimuladoPlayer, RevisePorQuestao } from "@/components/SimuladoPlayer";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/simulados")({
  component: SimuladosPage,
  head: () => ({
    meta: [{ title: "Simulados | Rota da Formatura" }],
  }),
});

type TipoSimulado = "AP" | "AD";

function SimuladosPage() {
  const [disciplinaId, setDisciplinaId] = useState(disciplinas[0]?.id ?? "");
  const [tipo, setTipo] = useState<TipoSimulado>("AP");
  const [gerando, setGerando] = useState(false);
  const [pode, setPode] = useState<{ pode: boolean; motivo?: string }>({ pode: true });
  const [simuladoAtivo, setSimuladoAtivo] = useState<SimuladoRealizado | null>(null);
  const [historico, setHistorico] = useState<SimuladoRealizado[]>([]);
  const [revisao, setRevisao] = useState<SimuladoRealizado | null>(null);

  const disciplina = useMemo(() => disciplinas.find((d) => d.id === disciplinaId), [disciplinaId]);

  const recarregar = useCallback(async () => {
    const [perm, hist] = await Promise.all([podeGerar(), listarSimulados()]);
    setPode(perm);
    setHistorico(hist);
  }, []);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  const gerar = async () => {
    if (!pode.pode) {
      toast.error(pode.motivo ?? "Limite semanal atingido");
      return;
    }
    setGerando(true);
    const r = await gerarSimuladoIA({
      disciplinaId,
      disciplinaNome: disciplina?.nome ?? disciplinaId,
      conteudoCobrado: disciplina?.guia?.objetivoGeral,
      tipo,
      quantidade: 8,
    });
    setGerando(false);
    if (!r.ok) {
      toast.error(r.error);
      if (r.bloqueado) recarregar();
      return;
    }
    toast.success("Simulado gerado! Boa sorte.");
    setSimuladoAtivo(r.simulado);
    setRevisao(null);
    recarregar();
  };

  const concluido = (atualizado: SimuladoRealizado) => {
    setSimuladoAtivo(null);
    setRevisao(atualizado);
    toast.success(`Simulado corrigido: ${atualizado.percentual}% de acerto`);
    recarregar();
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#0A3D52] pb-24">
      {/* Header */}
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
                  <MobileNavLink to="/podcasts" icon={Target} label="Podcasts" />
                  <MobileNavLink to="/simulados" icon={Sparkles} label="Simulados" />
                  <MobileNavLink to="/calculadora" icon={Calculator} label="Calculadora" />
                  <MobileNavLink to="/disciplines" icon={FileText} label="Disciplinas" />
                  <MobileNavLink to="/settings" icon={Settings} label="Configurações" />
                </div>
              </div>
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-[#D4941E]" />
            <span className="font-bold text-lg tracking-tight uppercase hidden xs:inline">
              Simulados
            </span>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-6 mr-6">
          <Link
            to="/"
            className="text-xs font-black uppercase tracking-widest hover:text-[#D4941E] transition-colors"
          >
            Dashboard
          </Link>
          <Link
            to="/podcasts"
            className="text-xs font-black uppercase tracking-widest hover:text-[#D4941E] transition-colors"
          >
            Podcasts
          </Link>
          <Link
            to="/calculadora"
            className="text-xs font-black uppercase tracking-widest hover:text-[#D4941E] transition-colors"
          >
            Calculadora
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold">Simulador de Prova</h2>
          <p className="text-[#0A3D52]/60 mt-1">
            Prove responder uma AP inédita gerada por IA, corrigida na hora. 1 geração por semana.
          </p>
        </div>

        {/* Estado de revisão de um simulado concluído */}
        {revisao && !simuladoAtivo && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-black text-[#0A3D52]/40 uppercase tracking-[0.2em] flex items-center gap-2">
                <Trophy className="w-4 h-4 text-[#D4941E]" /> Revisão do Simulado
              </h3>
              <button
                onClick={() => setRevisao(null)}
                className="text-[10px] font-black uppercase text-[#0A3D52]/40 hover:text-[#0A3D52] cursor-pointer"
              >
                Fechar
              </button>
            </div>
            <div className="bg-white rounded-2xl border border-[#0A3D52]/10 p-5 shadow-sm mb-4 text-center">
              <p className="text-3xl font-black text-[#D4941E]">{revisao.percentual}%</p>
              <p className="text-xs font-bold text-[#0A3D52]/50 uppercase mt-1">
                {revisao.acertos} de {revisao.total} acertos
              </p>
            </div>
            <RevisePorQuestao resultado={revisao} />
          </section>
        )}

        {simuladoAtivo ? (
          /* == Prova em andamento == */
          <SimuladoPlayer simulado={simuladoAtivo} onConcluido={concluido} minutos={45} />
        ) : (
          <>
            {/* Configuração */}
            <section className="mb-6">
              <div className="bg-white rounded-2xl border border-[#0A3D52]/10 p-6 shadow-sm space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-[#0A3D52]/50 tracking-widest block mb-2">
                    Disciplina
                  </label>
                  <select
                    value={disciplinaId}
                    onChange={(e) => setDisciplinaId(e.target.value)}
                    className="w-full bg-[#F5F7FA] rounded-xl px-3 py-3 text-sm font-bold text-[#0A3D52] focus:ring-2 focus:ring-[#D4941E] outline-none cursor-pointer"
                  >
                    {disciplinas.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.nome} ({d.codigo})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-[#0A3D52]/50 tracking-widest block mb-2">
                    Tipo de simulado
                  </label>
                  <div className="flex gap-2">
                    {(["AP", "AD"] as TipoSimulado[]).map((t) => (
                      <button
                        key={t}
                        onClick={() => setTipo(t)}
                        className={cn(
                          "flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all cursor-pointer",
                          tipo === t
                            ? t === "AP"
                              ? "bg-[#E74C3C] text-white border-[#E74C3C]"
                              : "bg-[#2563EB] text-white border-[#2563EB]"
                            : "bg-[#F5F7FA] text-[#0A3D52]/50 border-[#0A3D52]/10",
                        )}
                      >
                        {t === "AP" ? "AP (presencial)" : "AD (a distância)"}
                      </button>
                    ))}
                  </div>
                </div>

                <div
                  className={cn(
                    "rounded-xl p-4 border text-center",
                    pode.pode
                      ? "bg-[#F5F7FA] border-[#0A3D52]/10"
                      : "bg-[#D4941E]/10 border-[#D4941E]/30",
                  )}
                >
                  {pode.pode ? (
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#0A3D52]/50">
                      Disponível: 1 geração nesta semana
                    </p>
                  ) : (
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#D4941E]">
                      Limite da semana atingido — volte na segunda-feira
                    </p>
                  )}
                </div>

                <button
                  onClick={gerar}
                  disabled={gerando || !pode.pode}
                  className="w-full bg-[#D4941E] text-[#0A3D52] py-3.5 rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-[#D4941E]/20 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
                >
                  {gerando ? "Gerando seu simulado..." : "Gerar Simulado Inédito"}
                </button>
              </div>
            </section>

            {/* Histórico */}
            <section>
              <h3 className="text-xs font-black text-[#0A3D52]/40 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <RefreshCcw className="w-3.5 h-3.5 text-[#D4941E]" /> Histórico
              </h3>
              {historico.length === 0 ? (
                <div className="bg-white rounded-3xl border border-dashed border-[#0A3D52]/10 p-10 text-center">
                  <Target className="w-10 h-10 mx-auto mb-3 text-[#0A3D52]/20" />
                  <p className="font-black text-xs uppercase tracking-widest text-[#0A3D52]/40">
                    Nenhum simulado feito ainda
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {historico.map((s) => {
                    const d = disciplinas.find((x) => x.id === s.disciplina_id);
                    return (
                      <div
                        key={s.id}
                        className="bg-white rounded-2xl border border-[#0A3D52]/10 p-4 shadow-sm flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="text-[10px] font-black uppercase text-[#0A3D52]/40">
                            {d?.codigo ?? s.disciplina_id} •{" "}
                            {new Date(s.criado_em).toLocaleDateString("pt-BR")}
                          </p>
                          <p className="font-bold text-sm truncate">{d?.nome ?? "Simulado"}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span
                            className={cn(
                              "text-sm font-black font-mono",
                              s.percentual >= 60 ? "text-[#27AE60]" : "text-[#D4941E]",
                            )}
                          >
                            {s.percentual}%
                          </span>
                          <button
                            onClick={() => setRevisao(s)}
                            className="text-[10px] font-black uppercase tracking-widest text-[#0A3D52]/50 hover:text-[#D4941E] cursor-pointer"
                          >
                            Revisar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {/* Bottom Mobile Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#0A3D52]/10 flex justify-around p-3 md:hidden z-40">
        <MobileNavLink to="/" icon={LayoutDashboard} label="Início" bottom />
        <MobileNavLink to="/simulados" icon={Sparkles} label="Simulado" bottom />
        <MobileNavLink to="/calculadora" icon={Calculator} label="Calc" bottom />
        <MobileNavLink to="/podcasts" icon={Target} label="Podcasts" bottom />
        <MobileNavLink to="/calendar" icon={CalendarIcon} label="Calendário" bottom />
      </div>
    </div>
  );
}

function MobileNavLink({
  to,
  icon: Icon,
  label,
  bottom,
}: {
  to: string;
  icon: typeof LayoutDashboard;
  label: string;
  bottom?: boolean;
}) {
  if (bottom) {
    return (
      <Link
        to={to}
        activeProps={{ className: "text-[#D4941E]" }}
        inactiveProps={{ className: "text-[#0A3D52]/40" }}
        className="flex flex-col items-center"
      >
        <Icon className="w-5 h-5" />
        <span className="text-[8px] font-black uppercase mt-0.5 tracking-tighter">{label}</span>
      </Link>
    );
  }
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
