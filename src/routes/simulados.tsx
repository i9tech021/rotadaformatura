// src/routes/simulados.tsx
// Simulados de prova — banco de questões + IA, 1 a cada 7 dias por autor.
// Identidade = a mesma da Comunidade (nome + polo, sem login).
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Calculator,
  Calendar as CalendarIcon,
  ClipboardCheck,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Menu,
  RefreshCcw,
  Settings,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AppBottomNav, AppDesktopNav, AppMobileMenu } from "@/components/AppNav";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { disciplinas } from "@/data/disciplines";
import {
  carregarRevisao,
  listarHistorico,
  montarSimulado,
  podeGerarSimulado,
  type SessaoSimulado,
  type SimuladoRow,
} from "@/lib/simuladoService";
import {
  deleteProva,
  listProvas,
  MIN_PROVAS,
  subscribeProvas,
  uploadProva,
  type ProvaAntiga,
} from "@/lib/provasService";
import { ETAPAS_QUESTAO, type EtapaQuestao } from "@/lib/questoesService";
import { CODIGO_TURMA_PADRAO, getIdentidade, salvarIdentidade, type Identidade } from "@/lib/publicacoesService";
import { IdentidadeModal } from "@/components/IdentidadeModal";
import {
  RevisePorQuestao,
  SimuladoPlayer,
  type ResultadoCorrigido,
} from "@/components/SimuladoPlayer";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/simulados")({
  component: SimuladosPage,
  head: () => ({
    meta: [{ title: "Simulados | Rota da Formatura" }],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    disciplina: typeof search["disciplina"] === "string" ? (search["disciplina"] as string) : undefined,
  }),
});

const QTD_OPCOES = [10, 12, 15];

function SimuladosPage() {
  const { disciplina: disciplinaParam } = Route.useSearch();
  const [identidade, setIdentidade] = useState<Identidade | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [disciplinaId, setDisciplinaId] = useState(disciplinaParam || disciplinas[0]?.id || "");
  const [etapa, setEtapa] = useState<EtapaQuestao>("AP1");
  const [qtd, setQtd] = useState(12);
  const [gerando, setGerando] = useState(false);
  const [perm, setPerm] = useState<{ pode: boolean; motivo?: string }>({ pode: true });
  const [sessaoAtiva, setSessaoAtiva] = useState<SessaoSimulado | null>(null);
  const [historico, setHistorico] = useState<SimuladoRow[]>([]);
  const [revisao, setRevisao] = useState<ResultadoCorrigido | null>(null);
  const [provas, setProvas] = useState<ProvaAntiga[]>([]);
  const [subindoProva, setSubindoProva] = useState(false);
  const provaInputRef = useRef<HTMLInputElement>(null);

  // Sync search param with state
  useEffect(() => {
    if (disciplinaParam) setDisciplinaId(disciplinaParam);
  }, [disciplinaParam]);

  const disciplina = useMemo(() => disciplinas.find((d) => d.id === disciplinaId), [disciplinaId]);
  const minutos = etapa.startsWith("AD") ? 30 : 60;

  const recarregar = useCallback(async () => {
    const ident = getIdentidade();
    setIdentidade(ident);
    const listaProvas = await listProvas(disciplinaId, etapa);
    setProvas(listaProvas);
    if (!ident) {
      setPerm({ pode: true });
      setHistorico([]);
      return;
    }
    const [p, hist] = await Promise.all([
      podeGerarSimulado(ident.autorLocalId),
      listarHistorico(ident.autorLocalId),
    ]);
    setPerm(p);
    setHistorico(hist);
  }, [disciplinaId, etapa]);

  useEffect(() => {
    recarregar();
    return subscribeProvas(() => {
      listProvas(disciplinaId, etapa).then(setProvas);
    });
  }, [recarregar, disciplinaId, etapa]);

  const salvarIdent = (nome: string, polo: string) => {
    const ident = salvarIdentidade(nome, polo, CODIGO_TURMA_PADRAO);
    setIdentidade(ident);
    setModalAberto(false);
    toast.success("Identificação salva!");
    recarregar();
  };

  const gerar = async () => {
    const ident = identidade;
    if (!ident) {
      setModalAberto(true);
      return;
    }
    if (!perm.pode) {
      toast.error(perm.motivo ?? "Limite semanal atingido");
      return;
    }
    setGerando(true);
    const r = await montarSimulado({
      autorLocalId: ident.autorLocalId,
      autorNome: ident.nome,
      autorPolo: ident.polo,
      disciplinaId,
      disciplinaNome: disciplina?.nome ?? disciplinaId,
      tipo: etapa,
      conteudo: disciplina?.guia?.objetivoGeral,
      quantidade: qtd,
    });
    setGerando(false);
    if (!r.ok) {
      toast.error(r.error);
      if (r.bloqueado) recarregar();
      return;
    }
    if (r.modo === "offline") toast.info("Simulado criado com questões de revisão das aulas. Boa sorte!");
    else if (r.modo === "banco") toast.success("Simulado montado do banco de questões! Boa sorte.");
    else if (r.provasUsadas > 0) toast.success(`Simulado gerado a partir de ${r.provasUsadas} prova(s) antiga(s)! Boa sorte.`);
    else toast.success("Simulado inédito gerado pela IA! Boa sorte.");
    setSessaoAtiva(r.sessao);
    setRevisao(null);
    recarregar();
  };

  const enviarProva = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ident = identidade;
    if (!ident) {
      setModalAberto(true);
      return;
    }
    setSubindoProva(true);
    const r = await uploadProva({
      disciplinaId,
      tipo: etapa,
      titulo: file.name.replace(/\.pdf$/i, ""),
      arquivo: file,
      autorLocalId: ident.autorLocalId,
    });
    setSubindoProva(false);
    if (provaInputRef.current) provaInputRef.current.value = "";
    if (!r.ok) {
      toast.error(r.error);
      return;
    }
    toast.success("Prova antiga enviada! Texto extraído para a IA usar.");
    listProvas(disciplinaId, etapa).then(setProvas);
  };

  const removerProva = async (p: ProvaAntiga) => {
    if (!identidade) return;
    const r = await deleteProva(p, identidade.autorLocalId);
    if (!r.ok) {
      toast.error(r.error);
      return;
    }
    toast.success("Prova removida.");
    listProvas(disciplinaId, etapa).then(setProvas);
  };

  const concluido = (r: ResultadoCorrigido) => {
    setSessaoAtiva(null);
    setRevisao(r);
    toast.success(`Corrigido: nota ${r.nota.toFixed(1)} (${r.percentual}%)`);
    recarregar();
  };

  const abrirRevisao = async (row: SimuladoRow) => {
    const rev = await carregarRevisao(row);
    if (!rev) {
      toast.error("Questões deste simulado não estão mais disponíveis.");
      return;
    }
    const total = rev.questoes.length;
    const acertos = rev.questoes.filter(
      (q, i) => rev.respostas[i] != null && rev.respostas[i] === q.resposta_correta,
    ).length;
    setRevisao({
      nota: row.nota ?? 0,
      percentual: row.percentual ?? 0,
      acertos,
      total,
      questoes: rev.questoes,
      respostas: rev.respostas,
    });
    setSessaoAtiva(null);
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
              <AppMobileMenu />
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-[#D4941E]" />
            <span className="font-bold text-lg tracking-tight uppercase hidden min-[420px]:inline">
              Simulados
            </span>
          </div>
        </div>
        <AppDesktopNav />
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold">Simulador de Prova</h2>
          <p className="text-[#0A3D52]/60 mt-1">
            Questões reais extraídas de provas antigas do CEDERJ, selecionadas por IA para maximizar sua preparação.
          </p>
          <p className="text-[#0A3D52]/40 mt-2 text-sm">
            Cada simulado tem 10 questões — 70% peso alto (teoria), 30% peso baixo (cálculo). Correção instantânea + revisão detalhada. Limite: 1 a cada 7 dias.
          </p>
          {identidade ? (
            <p className="text-[10px] font-bold text-[#27AE60] mt-2 uppercase tracking-widest">
              ✓ {identidade.nome} • {identidade.polo}
            </p>
          ) : (
            <p className="text-[10px] font-bold text-[#D4941E] mt-2 uppercase tracking-widest">
              Identifique-se (nome + polo) para gerar seu simulado
            </p>
          )}
        </div>

        {/* Revisão */}
        {revisao && !sessaoAtiva && (
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
              <p className="text-3xl font-black font-mono text-[#D4941E]">
                {revisao.nota.toFixed(1)}
              </p>
              <p className="text-xs font-bold text-[#0A3D52]/50 uppercase mt-1">
                {revisao.percentual}% de acerto
              </p>
            </div>
            <RevisePorQuestao resultado={revisao} />
          </section>
        )}

        {sessaoAtiva ? (
          <SimuladoPlayer
            sessao={sessaoAtiva}
            disciplinaNome={disciplina?.codigo}
            onConcluido={concluido}
            minutos={minutos}
          />
        ) : (
          <>
            {/* Provas antigas — base real do simulado (mínimo 3) */}
            <section className="mb-6">
              <div className="bg-white rounded-2xl border border-[#0A3D52]/10 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-xs font-black text-[#0A3D52]/40 uppercase tracking-[0.2em] flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#D4941E]" /> Provas antigas
                  </h3>
                  <span
                    className={cn(
                      "text-[10px] font-black uppercase px-2 py-1 rounded-full",
                      provas.length >= MIN_PROVAS
                        ? "bg-[#27AE60]/10 text-[#27AE60]"
                        : "bg-[#D4941E]/15 text-[#D4941E]",
                    )}
                  >
                    {provas.length}/{MIN_PROVAS}
                  </span>
                </div>
                <p className="text-[11px] text-[#0A3D52]/50 mb-4 font-medium">
                  A IA gera o simulado a partir destas provas de {etapa}. Envie pelo menos{" "}
                  {MIN_PROVAS} PDFs.
                </p>

                {provas.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {provas.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center gap-3 bg-[#F5F7FA] rounded-xl p-3 border border-[#0A3D52]/5"
                      >
                        <div className="w-9 h-9 rounded-lg bg-[#E74C3C]/10 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4 text-[#E74C3C]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate">{p.titulo}</p>
                          <p className="text-[10px] font-bold text-[#0A3D52]/40 uppercase">
                            {p.num_paginas > 0 ? `${p.num_paginas} págs • ` : ""}texto extraído ✓
                          </p>
                        </div>
                        {identidade && p.autor_local_id === identidade.autorLocalId && (
                          <button
                            onClick={() => removerProva(p)}
                            className="text-[10px] font-black uppercase text-[#0A3D52]/30 hover:text-[#E74C3C] cursor-pointer shrink-0"
                          >
                            Excluir
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => provaInputRef.current?.click()}
                  disabled={subindoProva}
                  className="w-full border-2 border-dashed border-[#0A3D52]/20 rounded-xl py-4 text-center hover:border-[#D4941E]/50 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#0A3D52]/50">
                    {subindoProva ? "Lendo PDF..." : "＋ Enviar prova antiga em PDF"}
                  </span>
                </button>
                <input
                  ref={provaInputRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={enviarProva}
                />
              </div>
            </section>

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
                    Etapa • {minutos} min
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {ETAPAS_QUESTAO.map((t) => (
                      <button
                        key={t}
                        onClick={() => setEtapa(t)}
                        className={cn(
                          "py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all cursor-pointer",
                          etapa === t
                            ? "bg-[#0A3D52] text-white border-[#0A3D52]"
                            : "bg-[#F5F7FA] text-[#0A3D52]/50 border-[#0A3D52]/10",
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-[#0A3D52]/50 tracking-widest block mb-2">
                    Questões
                  </label>
                  <div className="flex gap-2">
                    {QTD_OPCOES.map((n) => (
                      <button
                        key={n}
                        onClick={() => setQtd(n)}
                        className={cn(
                          "flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all cursor-pointer",
                          qtd === n
                            ? "bg-[#D4941E] text-[#0A3D52] border-[#D4941E]"
                            : "bg-[#F5F7FA] text-[#0A3D52]/50 border-[#0A3D52]/10",
                        )}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                <div
                  className={cn(
                    "rounded-xl p-4 border text-center space-y-1",
                    perm.pode && provas.length >= MIN_PROVAS
                      ? "bg-[#F5F7FA] border-[#0A3D52]/10"
                      : "bg-[#D4941E]/10 border-[#D4941E]/30",
                  )}
                >
                  {perm.pode ? (
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#0A3D52]/50">
                      {identidade
                        ? "Disponível: 1 simulado a cada 7 dias"
                        : "Identifique-se para liberar sua geração semanal"}
                    </p>
                  ) : (
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#D4941E]">
                      {perm.motivo}
                    </p>
                  )}
                  {provas.length < MIN_PROVAS && (
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#E74C3C]">
                      Faltam {MIN_PROVAS - provas.length} prova(s) de {etapa} acima
                    </p>
                  )}
                </div>

                <button
                  onClick={gerar}
                  disabled={gerando || !perm.pode || provas.length < MIN_PROVAS}
                  className="w-full bg-[#D4941E] text-[#0A3D52] py-3.5 rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-[#D4941E]/20 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
                >
                  {gerando ? "Montando seu simulado..." : "Iniciar simulado"}
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
                  <ClipboardCheck className="w-10 h-10 mx-auto mb-3 text-[#0A3D52]/20" />
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
                            {d?.codigo ?? s.disciplina_id} • {s.tipo} •{" "}
                            {new Date(s.criado_em).toLocaleDateString("pt-BR")}
                          </p>
                          <p className="font-bold text-sm truncate">{d?.nome ?? "Simulado"}</p>
                          {s.autor_nome && (
                            <p className="text-[10px] text-[#0A3D52]/50 font-medium mt-0.5">
                              {s.autor_nome} • {s.autor_polo}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <p className="text-sm font-black font-mono text-[#0A3D52]">
                              {(s.nota ?? 0).toFixed(1)}
                            </p>
                            <p
                              className={cn(
                                "text-[10px] font-black",
                                (s.percentual ?? 0) >= 60 ? "text-[#27AE60]" : "text-[#D4941E]",
                              )}
                            >
                              {s.percentual ?? 0}%
                            </p>
                          </div>
                          <button
                            onClick={() => abrirRevisao(s)}
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

      <IdentidadeModal
        aberto={modalAberto}
        aoSalvar={salvarIdent}
        aoFechar={() => setModalAberto(false)}
      />

      {/* Bottom Mobile Nav (global) */}
      <AppBottomNav />
    </div>
  );
}
