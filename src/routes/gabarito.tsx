// src/routes/gabarito.tsx
// Gabarito Extraoficial pós-AP: cola a prova transcrita, IA revisa,
// publica gabarito, corrige em tempo real, compartilha no WhatsApp.
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Menu,
  MessageCircle,
  Send,
  Share2,
  Trophy,
  Users,
  AlertTriangle,
  Calculator,
  BookOpen,
  Settings,
  LayoutDashboard,
  Calendar as CalendarIcon,
  Target,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AppBottomNav, AppDesktopNav, AppMobileMenu } from "@/components/AppNav";
import { useState, useEffect, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { disciplinas } from "@/data/disciplines";
import { getIdentidade } from "@/lib/auth";
import { toast } from "sonner";
import {
  criarGabarito,
  salvarRespostasGabarito,
  publicarGabarito,
  listarGabitos,
  buscarRespostasGabarito,
  enviarRespostasAluno,
  listarRespostasAluno,
  subscribeGabaritos,
  type Gabarito,
  type GabaritoResposta,
  type GabaritoRespostaAluno,
} from "@/lib/gabaritoService";
import { gerarGabaritoIA, type QuestaoGabarito } from "@/lib/aiGabarito.functions";

export const Route = createFileRoute("/gabarito")({
  component: GabaritoPage,
  head: () => ({
    title: "Gabarito Extraoficial | Rota da Formatura",
    meta: [
      {
        name: "description",
        content:
          "Gabarito extraoficial pós-AP: cola a prova transcrita, nossa IA revisa e corrige em tempo real.",
      },
    ],
  }),
});

// ============================================================
// PAGE
// ============================================================
function GabaritoPage() {
  const navigate = useNavigate();
  const identidade = getIdentidade();
  const [view, setView] = useState<"list" | "create" | "view" | "answer" | "result">("list");
  const [disciplinaId, setDisciplinaId] = useState(disciplinas[0]?.id ?? "");
  const [etapa, setEtapa] = useState("AP1");
  const [gabaritos, setGabaritos] = useState<Gabarito[]>([]);
  const [selectedGabarito, setSelectedGabarito] = useState<Gabarito | null>(null);
  const [respostas, setRespostas] = useState<GabaritoResposta[]>([]);
  const [respostasAluno, setRespostasAluno] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);

  // Carrega gabaritos
  const carregarGabaritos = useCallback(() => {
    if (!disciplinaId) return;
    listarGabitos(disciplinaId, etapa).then(setGabaritos);
  }, [disciplinaId, etapa]);

  useEffect(() => {
    carregarGabaritos();
  }, [carregarGabaritos]);

  useEffect(() => {
    if (!disciplinaId) return;
    return subscribeGabaritos(disciplinaId, carregarGabaritos);
  }, [disciplinaId, carregarGabaritos]);

  const disciplina = disciplinas.find((d) => d.id === disciplinaId);

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
              <AppMobileMenu />
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2">
            <GraduationCap className="w-8 h-8 text-[#D4941E]" />
            <span className="font-bold text-lg tracking-tight uppercase hidden min-[420px]:inline">
              Rota da Formatura
            </span>
          </div>
        </div>
        <AppDesktopNav />
        <div className="flex items-center gap-4">
          <Link
            to="/settings"
            className="w-10 h-10 rounded-full bg-[#D4941E] flex items-center justify-center font-bold text-[#0A3D52] hover:scale-105 transition-transform"
          >
            {(identidade?.nome ?? "A")
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)}
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-[#0A3D52] flex items-center gap-3">
              <ClipboardCheck className="w-8 h-8 text-[#D4941E]" />
              Gabarito Extraoficial
            </h1>
            <p className="text-[#0A3D52]/60 mt-1 text-sm">
              Cole a prova transcrita, nossa IA revisa e corrige em tempo real
            </p>
          </div>
          {view === "list" && (
            <button
              onClick={() => setView("create")}
              className="bg-[#D4941E] text-[#0A3D52] px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider hover:scale-[1.02] transition-all cursor-pointer flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Enviar Prova
            </button>
          )}
        </div>

        {/* Aviso */}
        <div className="bg-[#D4941E]/10 border border-[#D4941E]/30 rounded-2xl p-4 mb-6 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-[#D4941E] shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-[#0A3D52]">
              Gabarito não oficial · ~90% de acurácia
            </p>
            <p className="text-[10px] text-[#0A3D52]/50 mt-1">
              As respostas são geradas por IA a partir da transcrição. Para a prova oficial, consulte
              o material do professor ou o portal do CEDERJ.
            </p>
          </div>
        </div>

        {/* Filtros (só na listagem) */}
        {view === "list" && (
          <div className="flex flex-wrap gap-3 mb-6">
            <select
              value={disciplinaId}
              onChange={(e) => setDisciplinaId(e.target.value)}
              className="bg-[#F5F7FA] border border-[#0A3D52]/10 rounded-xl px-3 py-2 text-xs font-bold text-[#0A3D52] outline-none cursor-pointer"
            >
              {disciplinas.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nome} ({d.codigo})
                </option>
              ))}
            </select>
            <select
              value={etapa}
              onChange={(e) => setEtapa(e.target.value)}
              className="bg-[#F5F7FA] border border-[#0A3D52]/10 rounded-xl px-3 py-2 text-xs font-bold text-[#0A3D52] outline-none cursor-pointer"
            >
              {["AP1", "AP2", "AP3", "AD1", "AD2"].map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* ── LIST VIEW ── */}
        {view === "list" && (
          <div className="space-y-3">
            {gabaritos.length === 0 ? (
              <div className="bg-[#F5F7FA] p-12 rounded-3xl border border-dashed border-[#0A3D52]/10 text-center">
                <ClipboardCheck className="w-10 h-10 text-[#0A3D52]/20 mx-auto mb-3" />
                <p className="font-black text-sm text-[#0A3D52]/40 uppercase tracking-widest">
                  Nenhum gabarito ainda
                </p>
                <p className="text-[10px] text-[#0A3D52]/30 mt-2 max-w-xs mx-auto">
                  Seja o primeiro a enviar a prova transcrita e montar o gabarito pra turma!
                </p>
                <button
                  onClick={() => setView("create")}
                  className="mt-4 bg-[#0A3D52] text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider hover:bg-[#0A3D52]/90 cursor-pointer"
                >
                  Enviar Prova
                </button>
              </div>
            ) : (
              gabaritos.map((g) => (
                <button
                  key={g.id}
                  onClick={() => {
                    setSelectedGabarito(g);
                    setView("view");
                  }}
                  className="w-full text-left bg-white rounded-2xl border border-[#0A3D52]/10 p-5 hover:shadow-md hover:border-[#D4941E]/40 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase text-[#D4941E] tracking-wider">
                        {g.etapa} · {disciplinas.find((d) => d.id === g.disciplina_id)?.codigo}
                      </p>
                      <h3 className="font-bold text-sm mt-1">{g.titulo}</h3>
                      <p className="text-[10px] text-[#0A3D52]/40 mt-1">
                        {g.total_questoes} questões · por {g.autor_nome} · {g.autor_polo}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-black bg-[#27AE60]/10 text-[#27AE60] px-2 py-1 rounded-full">
                        Publicado
                      </span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {/* ── CREATE VIEW ── */}
        {view === "create" && (
          <CriarGabaritoView
            disciplinaId={disciplinaId}
            etapa={etapa}
            onVoltar={() => setView("list")}
            onPublicado={() => {
              carregarGabaritos();
              setView("list");
            }}
          />
        )}

        {/* ── VIEW GABARITO ── */}
        {view === "view" && selectedGabarito && (
          <VerGabaritoView
            gabarito={selectedGabarito}
            onVoltar={() => setView("list")}
            onResponder={() => setView("answer")}
          />
        )}

        {/* ── ANSWER VIEW ── */}
        {view === "answer" && selectedGabarito && (
          <ResponderView
            gabarito={selectedGabarito}
            onVoltar={() => setView("view")}
            onCorrigido={(nota, acertos, total) => {
              setView("result");
            }}
          />
        )}

        {/* ── RESULT VIEW ── */}
        {view === "result" && selectedGabarito && (
          <ResultadoView
            gabarito={selectedGabarito}
            onVoltar={() => setView("view")}
          />
        )}
      </main>

      <AppBottomNav />
    </div>
  );
}

// ============================================================
// CRIAR GABARITO
// ============================================================
function CriarGabaritoView({
  disciplinaId,
  etapa,
  onVoltar,
  onPublicado,
}: {
  disciplinaId: string;
  etapa: string;
  onVoltar: () => void;
  onPublicado: () => void;
}) {
  const [texto, setTexto] = useState("");
  const [processando, setProcessando] = useState(false);
  const [questoes, setQuestoes] = useState<QuestaoGabarito[] | null>(null);
  const [gabaritoId, setGabaritoId] = useState<string | null>(null);
  const [editando, setEditando] = useState<number | null>(null);

  const disciplina = disciplinas.find((d) => d.id === disciplinaId);

  const handleGerar = async () => {
    if (!texto.trim()) return;
    setProcessando(true);

    // 1. Cria gabarito no banco
    const r = await criarGabarito({
      disciplinaId,
      etapa,
      titulo: `${disciplina?.nome ?? "Disciplina"} · ${etapa}`,
      textoTranscrito: texto,
      totalQuestoes: 0,
    });
    if (!r.ok || !r.gabarito) {
      toast.error(r.error || "Erro ao criar gabarito.");
      setProcessando(false);
      return;
    }
    setGabaritoId(r.gabarito.id);

    // 2. IA revisa e gera gabarito
    const resultado = await gerarGabaritoIA({
      disciplinaId,
      disciplinaNome: disciplina?.nome ?? "",
      etapa,
      textoTranscrito: texto,
    });

    if (!resultado.ok || !resultado.questoes) {
      toast.error(resultado.error || "Erro ao gerar gabarito.");
      setProcessando(false);
      return;
    }

    setQuestoes(resultado.questoes);
    setProcessando(false);
    toast.success(`${resultado.questoes.length} questões identificadas!`);
  };

  const handlePublicar = async () => {
    if (!gabaritoId || !questoes) return;
    setProcessando(true);

    // Salva respostas
    const r1 = await salvarRespostasGabarito(
      gabaritoId,
      questoes.map((q) => ({
        questao_numero: q.numero,
        enunciado: q.enunciado,
        alternativas: q.alternativas,
        resposta_correta: q.resposta_correta,
        explicacao: q.explicacao,
        tipo: q.tipo,
        resposta_modelo: q.resposta_modelo,
      })),
    );
    if (!r1.ok) {
      toast.error(r1.error || "Erro ao salvar respostas.");
      setProcessando(false);
      return;
    }

    // Publica
    const r2 = await publicarGabarito(gabaritoId);
    if (!r2.ok) {
      toast.error(r2.error || "Erro ao publicar.");
      setProcessando(false);
      return;
    }

    toast.success("Gabarito publicado!");
    setProcessando(false);
    onPublicado();
  };

  return (
    <div className="space-y-4">
      <button
        onClick={onVoltar}
        className="flex items-center gap-2 text-[#0A3D52]/40 hover:text-[#0A3D52] transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-xs font-bold uppercase">Voltar</span>
      </button>

      <div className="bg-white rounded-2xl border border-[#0A3D52]/10 p-6">
        <h2 className="font-black text-lg mb-1">Cole a prova transcrita</h2>
        <p className="text-[10px] text-[#0A3D52]/50 mb-4">
          Use o Meta AI no WhatsApp, ChatGPT ou qualquer outra IA pra transcrever a prova. Depois,
          cole o texto aqui.
        </p>

        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder={`Cole aqui a prova transcrita...\n\nExemplo:\n1) Sobre o Plano Cruzado, é CORRETO afirmar:\nA) Foi um plano ortodoxo...\nB) Estabeleceu controle de preços...\nC) Aboliu a URV...\nD) Implementou o IPCA...`}
          rows={12}
          className="w-full bg-[#F5F7FA] rounded-xl p-4 text-sm font-mono text-[#0A3D52] placeholder:text-[#0A3D52]/30 focus:ring-2 focus:ring-[#D4941E] outline-none resize-none border border-[#0A3D52]/10"
        />

        {!questoes ? (
          <button
            onClick={handleGerar}
            disabled={!texto.trim() || processando}
            className="mt-4 w-full bg-[#0A3D52] text-white py-3 rounded-xl font-black text-xs uppercase tracking-[0.2em] hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2"
          >
            {processando ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Revisando com IA...
              </>
            ) : (
              <>
                Revisar e Gerar Gabarito
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        ) : (
          <>
            {/* Preview das questões */}
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-sm">
                  {questoes.length} questões identificadas
                </h3>
                <button
                  onClick={() => {
                    setQuestoes(null);
                    setGabaritoId(null);
                  }}
                  className="text-[10px] font-bold text-[#0A3D52]/40 uppercase hover:text-[#D4941E] cursor-pointer"
                >
                  Editar texto
                </button>
              </div>

              {questoes.map((q, i) => (
                <div
                  key={i}
                  className="bg-[#F5F7FA] rounded-xl p-4 border border-[#0A3D52]/5"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[9px] font-black bg-[#0A3D52]/10 text-[#0A3D52]/60 px-2 py-0.5 rounded">
                      Q{q.numero} · {q.tipo === "discursiva" ? "Discursiva" : "Objetiva"}
                    </span>
                    {q.tipo === "objetiva" && (
                      <span className="text-[9px] font-black bg-[#27AE60]/10 text-[#27AE60] px-2 py-0.5 rounded">
                        Resposta: {["A", "B", "C", "D"][q.resposta_correta]}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-[#0A3D52] leading-relaxed">
                    {q.enunciado}
                  </p>
                  {q.tipo === "objetiva" && q.alternativas.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {q.alternativas.map((alt, ai) => (
                        <p
                          key={ai}
                          className={cn(
                            "text-[10px] font-medium pl-2",
                            ai === q.resposta_correta
                              ? "text-[#27AE60] font-bold"
                              : "text-[#0A3D52]/50",
                          )}
                        >
                          {alt}
                        </p>
                      ))}
                    </div>
                  )}
                  <p className="text-[10px] text-[#0A3D52]/50 mt-2 italic">
                    {q.explicacao}
                  </p>
                  {q.resposta_modelo && (
                    <div className="mt-2 bg-[#27AE60]/5 rounded-lg p-2">
                      <p className="text-[9px] font-black text-[#27AE60] uppercase mb-1">
                        Resposta modelo:
                      </p>
                      <p className="text-[10px] text-[#0A3D52]/70">{q.resposta_modelo}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={handlePublicar}
              disabled={processando}
              className="mt-6 w-full bg-[#27AE60] text-white py-3 rounded-xl font-black text-xs uppercase tracking-[0.2em] hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2"
            >
              {processando ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Publicar Gabarito
                </>
              )}
            </button>
            <p className="text-[9px] text-[#0A3D52]/30 text-center mt-2">
              Após publicar, qualquer aluno pode responder e ver a nota
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================
// VER GABARITO (parcial para anônimos, completo para identificados)
// ============================================================
function VerGabaritoView({
  gabarito,
  onVoltar,
  onResponder,
}: {
  gabarito: Gabarito;
  onVoltar: () => void;
  onResponder: () => void;
}) {
  const [respostas, setRespostas] = useState<GabaritoResposta[]>([]);
  const [respostasAlunos, setRespostasAlunos] = useState<GabaritoRespostaAluno[]>([]);
  const [loading, setLoading] = useState(true);
  const identidade = getIdentidade();

  useEffect(() => {
    Promise.all([
      buscarRespostasGabarito(gabarito.id),
      listarRespostasAluno(gabarito.id),
    ]).then(([r, a]) => {
      setRespostas(r);
      setRespostasAlunos(a);
      setLoading(false);
    });
  }, [gabarito.id]);

  const disc = disciplinas.find((d) => d.id === gabarito.disciplina_id);

  // Gating: sem identidade → só vê 2 questões
  const podeVerTudo = !!identidade;
  const questoesVisiveis = podeVerTudo ? respostas : respostas.slice(0, 2);

  const handleCompartilhar = () => {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://rotadaformatura.vercel.app";
    const texto = `📋 Gabarito ${gabarito.titulo}\n\n${gabarito.total_questoes} questões corrigidas\n\nConfira no Rota da Formatura:\n${baseUrl}/gabarito`;
    if (navigator.share) {
      navigator.share({ title: gabarito.titulo, text: texto });
    } else {
      navigator.clipboard.writeText(texto);
      toast.success("Link copiado!");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-[#0A3D52]/20 border-t-[#D4941E] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button
        onClick={onVoltar}
        className="flex items-center gap-2 text-[#0A3D52]/40 hover:text-[#0A3D52] transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-xs font-bold uppercase">Voltar</span>
      </button>

      {/* Cabeçalho */}
      <div className="bg-white rounded-2xl border border-[#0A3D52]/10 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase text-[#D4941E] tracking-wider">
              {gabarito.etapa} · {disc?.codigo}
            </p>
            <h2 className="font-black text-lg mt-1">{gabarito.titulo}</h2>
            <p className="text-[10px] text-[#0A3D52]/40 mt-1">
              {gabarito.total_questoes} questões · por {gabarito.autor_nome} ({gabarito.autor_polo})
            </p>
          </div>
          <button
            onClick={handleCompartilhar}
            className="bg-[#25D366] text-white p-2.5 rounded-xl hover:scale-105 transition-transform cursor-pointer"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Questões */}
      <div className="space-y-3">
        {questoesVisiveis.map((r) => (
          <div key={r.id} className="bg-white rounded-2xl border border-[#0A3D52]/10 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-black bg-[#0A3D52]/10 text-[#0A3D52]/60 px-2 py-0.5 rounded">
                Q{r.questao_numero} · {r.tipo === "discursiva" ? "Discursiva" : "Objetiva"}
              </span>
              {r.tipo === "objetiva" && (
                <span className="text-[9px] font-black bg-[#27AE60]/10 text-[#27AE60] px-2 py-0.5 rounded">
                  Resposta: {["A", "B", "C", "D"][r.resposta_correta]}
                </span>
              )}
            </div>
            <p className="text-xs font-bold text-[#0A3D52] leading-relaxed">{r.enunciado}</p>
            {r.tipo === "objetiva" && r.alternativas.length > 0 && (
              <div className="mt-2 space-y-1">
                {r.alternativas.map((alt, ai) => (
                  <p
                    key={ai}
                    className={cn(
                      "text-[10px] font-medium pl-2",
                      ai === r.resposta_correta
                        ? "text-[#27AE60] font-bold"
                        : "text-[#0A3D52]/50",
                    )}
                  >
                    {alt}
                  </p>
                ))}
              </div>
            )}
            <p className="text-[10px] text-[#0A3D52]/50 mt-2 italic">{r.explicacao}</p>
            {r.resposta_modelo && (
              <div className="mt-2 bg-[#27AE60]/5 rounded-lg p-2">
                <p className="text-[9px] font-black text-[#27AE60] uppercase mb-1">
                  Resposta modelo:
                </p>
                <p className="text-[10px] text-[#0A3D52]/70">{r.resposta_modelo}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Gate: precisa de nome+polo pra ver tudo */}
      {!podeVerTudo && respostas.length > 2 && (
        <div className="bg-[#D4941E]/10 border border-[#D4941E]/30 rounded-2xl p-5 text-center">
          <p className="font-black text-sm text-[#0A3D52]">
            Mais {respostas.length - 2} questões bloqueadas
          </p>
          <p className="text-[10px] text-[#0A3D52]/50 mt-1">
            Identifique-se (nome + polo) pra ver o gabarito completo e responder
          </p>
          <Link
            to="/login"
            className="mt-3 inline-flex items-center gap-2 bg-[#0A3D52] text-white px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider hover:bg-[#0A3D52]/90"
          >
            Identificar-se
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}

      {/* Botão responder */}
      {podeVerTudo && (
        <button
          onClick={onResponder}
          className="w-full bg-[#D4941E] text-[#0A3D52] py-3.5 rounded-xl font-black text-xs uppercase tracking-[0.2em] hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <ClipboardCheck className="w-4 h-4" />
          Responder e Corrigir
        </button>
      )}

      {/* Ranking desta prova */}
      {respostasAlunos.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#0A3D52]/10 p-5">
          <h3 className="font-black text-xs uppercase tracking-wider text-[#0A3D52]/40 mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[#D4941E]" /> Ranking desta prova
          </h3>
          <div className="space-y-2">
            {respostasAlunos.slice(0, 10).map((ra, i) => (
              <div key={ra.id} className="flex items-center gap-3">
                <span
                  className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0",
                    i === 0
                      ? "bg-[#D4941E]/15 text-[#D4941E]"
                      : i === 1
                        ? "bg-[#0A3D52]/10 text-[#0A3D52]"
                        : "bg-[#F5F7FA] text-[#0A3D52]/40",
                  )}
                >
                  {i + 1}º
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{ra.autor_nome}</p>
                  <p className="text-[10px] text-[#0A3D52]/40">{ra.autor_polo}</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-sm font-mono">{ra.nota?.toFixed(1)}</p>
                  <p className="text-[10px] text-[#0A3D52]/40">
                    {ra.acertos}/{ra.total}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// RESPONDER
// ============================================================
function ResponderView({
  gabarito,
  onVoltar,
  onCorrigido,
}: {
  gabarito: Gabarito;
  onVoltar: () => void;
  onCorrigido: (nota: number, acertos: number, total: number) => void;
}) {
  const [respostasOficiais, setRespostasOficiais] = useState<GabaritoResposta[]>([]);
  const [respostasAluno, setRespostasAluno] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    buscarRespostasGabarito(gabarito.id).then((r) => {
      setRespostasOficiais(r);
      setLoading(false);
    });
  }, [gabarito.id]);

  const handleCorrigir = async () => {
    setEnviando(true);
    const r = await enviarRespostasAluno({
      gabaritoId: gabarito.id,
      respostas: respostasAluno,
    });
    setEnviando(false);

    if (r.ok && r.nota != null && r.acertos != null && r.total != null) {
      onCorrigido(r.nota, r.acertos, r.total);
    } else {
      toast.error(r.error || "Erro ao corrigir.");
    }
  };

  const respondidas = Object.keys(respostasAluno).length;
  const total = respostasOficiais.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-[#0A3D52]/20 border-t-[#D4941E] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button
        onClick={onVoltar}
        className="flex items-center gap-2 text-[#0A3D52]/40 hover:text-[#0A3D52] transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-xs font-bold uppercase">Voltar</span>
      </button>

      <div className="bg-[#D4941E]/10 border border-[#D4941E]/30 rounded-2xl p-4 flex items-center justify-between">
        <p className="text-xs font-bold text-[#0A3D52]">
          {respondidas}/{total} respondidas
        </p>
        <div className="w-32 h-2 bg-white rounded-full overflow-hidden">
          <div
            className="h-full bg-[#D4941E] transition-all"
            style={{ width: total ? `${(respondidas / total) * 100}%` : "0%" }}
          />
        </div>
      </div>

      <div className="space-y-3">
        {respostasOficiais.map((r) => (
          <div key={r.id} className="bg-white rounded-2xl border border-[#0A3D52]/10 p-4">
            <p className="text-[9px] font-black bg-[#0A3D52]/10 text-[#0A3D52]/60 px-2 py-0.5 rounded inline-block mb-2">
              Q{r.questao_numero}
            </p>
            <p className="text-xs font-bold text-[#0A3D52] leading-relaxed mb-3">
              {r.enunciado}
            </p>
            {r.tipo === "objetiva" && (
              <div className="space-y-2">
                {r.alternativas.map((alt, ai) => (
                  <button
                    key={ai}
                    onClick={() =>
                      setRespostasAluno((prev) => ({ ...prev, [r.questao_numero]: ai }))
                    }
                    className={cn(
                      "w-full text-left p-3 rounded-xl border-2 transition-all text-xs font-medium cursor-pointer",
                      respostasAluno[r.questao_numero] === ai
                        ? "border-[#D4941E] bg-[#D4941E]/5"
                        : "border-[#0A3D52]/10 hover:border-[#D4941E]/30",
                    )}
                  >
                    {alt}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={handleCorrigir}
        disabled={respondidas === 0 || enviando}
        className="w-full bg-[#0A3D52] text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-[0.2em] hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2"
      >
        {enviando ? (
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            <CheckCircle2 className="w-4 h-4" />
            Corrigir e Ver Nota
          </>
        )}
      </button>
    </div>
  );
}

// ============================================================
// RESULTADO
// ============================================================
function ResultadoView({
  gabarito,
  onVoltar,
}: {
  gabarito: Gabarito;
  onVoltar: () => void;
}) {
  const [resultado, setResultado] = useState<{
    nota: number;
    acertos: number;
    total: number;
  } | null>(null);
  const [respostasAluno, setRespostasAluno] = useState<Record<number, number>>({});
  const [respostasOficiais, setRespostasOficiais] = useState<GabaritoResposta[]>([]);

  useEffect(() => {
    Promise.all([
      buscarRespostasGabarito(gabarito.id),
      // Busca a última resposta deste aluno
      import("@/lib/supabase").then(async ({ getSupabase }) => {
        const sb = getSupabase();
        if (!sb) return null;
        const ident = (await import("@/lib/auth")).getIdentidade();
        if (!ident) return null;
        const { data } = await sb
          .from("gabarito_respostas_aluno")
          .select("*")
          .eq("gabarito_id", gabarito.id)
          .eq("autor_local_id", ident.autorLocalId)
          .order("criado_em", { ascending: false })
          .limit(1)
          .single();
        return data;
      }),
    ]).then(([oficiais, ultimaResposta]) => {
      setRespostasOficiais(oficiais);
      if (ultimaResposta) {
        setRespostasAluno(
          typeof ultimaResposta.respostas === "object"
            ? (ultimaResposta.respostas as Record<number, number>)
            : {},
        );
        setResultado({
          nota: Number(ultimaResposta.nota ?? 0),
          acertos: Number(ultimaResposta.acertos ?? 0),
          total: Number(ultimaResposta.total ?? 0),
        });
      }
    });
  }, [gabarito.id]);

  const handleCompartilhar = () => {
    if (!resultado) return;
    const notaFormatada = resultado.nota.toFixed(1).replace(".", ",");
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://rotadaformatura.vercel.app";
    const texto = `📊 Gabarito ${gabarito.titulo}\n\n✅ ${resultado.acertos}/${resultado.total} acertos\n📝 Nota: ${notaFormatada}/10\n\n${resultado.nota >= 6 ? "🎉 Aprovado!" : "📚 Preciso melhorar..."}\n\nTeste você também no Rota da Formatura:\n${baseUrl}/gabarito`;
    if (navigator.share) {
      navigator.share({ title: `Nota: ${notaFormatada}`, text: texto });
    } else {
      navigator.clipboard.writeText(texto);
      toast.success("Resultado copiado!");
    }
  };

  const nivel =
    resultado && resultado.nota >= 8
      ? { label: "🏆 Excelente!", cor: "#27AE60" }
      : resultado && resultado.nota >= 6
        ? { label: "👍 Bom!", cor: "#D4941E" }
        : { label: "📚 Precisa estudar mais", cor: "#E74C3C" };

  const disc = disciplinas.find((d) => d.id === gabarito.disciplina_id);

  return (
    <div className="space-y-4">
      <button
        onClick={onVoltar}
        className="flex items-center gap-2 text-[#0A3D52]/40 hover:text-[#0A3D52] transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-xs font-bold uppercase">Voltar</span>
      </button>

      {/* Card de nota */}
      <div className="bg-gradient-to-br from-[#0A3D52] to-[#0D4A63] rounded-3xl p-8 text-center text-white">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50 mb-2">
          {gabarito.titulo}
        </p>
        <p
          className="text-7xl font-black mb-2"
          style={{ color: resultado?.nota != null ? nivel.cor : "white" }}
        >
          {resultado?.nota != null ? resultado.nota.toFixed(1).replace(".", ",") : "—"}
        </p>
        <p className="text-sm font-bold text-white/70">
          {resultado?.acertos}/{resultado?.total} acertos
        </p>
        <p className="text-lg font-black mt-2" style={{ color: nivel.cor }}>
          {nivel.label}
        </p>

        {/* CTA Calculadora */}
        <Link
          to="/calculadora"
          className="mt-6 inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors"
        >
          <Calculator className="w-4 h-4" />
          Calcular minha média
        </Link>
      </div>

      {/* Revisão questão a questão */}
      <div className="space-y-3">
        <h3 className="font-black text-xs uppercase tracking-wider text-[#0A3D52]/40">
          Revisão
        </h3>
        {respostasOficiais.map((r) => {
          const respostaAluno = respostasAluno[r.questao_numero];
          const acertou = respostaAluno === r.resposta_correta;
          return (
            <div
              key={r.id}
              className={cn(
                "bg-white rounded-2xl border p-4",
                acertou ? "border-[#27AE60]/30" : "border-[#E74C3C]/30",
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-black bg-[#0A3D52]/10 text-[#0A3D52]/60 px-2 py-0.5 rounded">
                  Q{r.questao_numero}
                </span>
                <span
                  className={cn(
                    "text-[9px] font-black px-2 py-0.5 rounded",
                    acertou
                      ? "bg-[#27AE60]/10 text-[#27AE60]"
                      : "bg-[#E74C3C]/10 text-[#E74C3C]",
                  )}
                >
                  {acertou ? "✓ Acertou" : "✗ Errou"}
                </span>
              </div>
              <p className="text-xs font-bold text-[#0A3D52] leading-relaxed mb-2">
                {r.enunciado}
              </p>
              {r.tipo === "objetiva" && (
                <div className="space-y-1 mb-2">
                  {r.alternativas.map((alt, ai) => (
                    <p
                      key={ai}
                      className={cn(
                        "text-[10px] font-medium pl-2",
                        ai === r.resposta_correta
                          ? "text-[#27AE60] font-bold"
                          : ai === respostaAluno && !acertou
                            ? "text-[#E74C3C] line-through"
                            : "text-[#0A3D52]/50",
                      )}
                    >
                      {alt}
                    </p>
                  ))}
                </div>
              )}
              <p className="text-[10px] text-[#0A3D52]/50 italic">{r.explicacao}</p>
            </div>
          );
        })}
      </div>

      {/* Compartilhar */}
      <button
        onClick={handleCompartilhar}
        className="w-full bg-[#25D366] text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-[0.2em] hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
      >
        <Share2 className="w-4 h-4" />
        Compartilhar no WhatsApp
      </button>
    </div>
  );
}
