// src/routes/faq.tsx
// Perguntas Frequentes — banco de dúvidas da turma com respostas criadas por alunos e profes.
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  HelpCircle,
  MessageSquare,
  ThumbsUp,
  Search,
  Plus,
  Clock,
  CheckCircle2,
  Menu,
  GraduationCap,
  LayoutDashboard,
  BookOpen,
  FileText,
  Calendar as CalendarIcon,
  Settings,
  Trophy,
  Headphones,
  Sparkles,
  BarChart3,
  Activity,
  Users,
  Filter,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AppBottomNav, AppDesktopNav, AppMobileMenu } from "@/components/AppNav";
import { useState, useMemo, useEffect, useCallback } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import {
  listFaq,
  enviarPergunta as enviarPerguntaNuvem,
  enviarResposta as enviarRespostaNuvem,
  marcarMelhorResposta,
  votarPergunta,
  votarResposta,
  subscribeFaq,
  isSupabaseConfigured,
  type FaqPergunta as Pergunta,
  type FaqResposta as Resposta,
} from "@/lib/faqService";
import { registrarAtividade } from "@/lib/feedService";
import { jaVotou, marcarVoto } from "@/lib/votos";
import { disciplinas } from "@/data/disciplines";
import { cn } from "@/lib/utils";
import { getIdentidade } from "@/lib/auth";

export const Route = createFileRoute("/faq")({
  component: FAQPage,
  head: () => ({
    title: "Perguntas Frequentes | Rota da Formatura",
    meta: [
      {
        name: "description",
        content: "Dúvidas e respostas da turma do CEDERJ.",
      },
    ],
  }),
});

// Dados mock (fallback offline — com banco, a lista vem da nuvem em tempo real)
const PERGUNTAS_MOCK: Pergunta[] = [
  {
    id: "q1",
    titulo: "Como calcular a média final de EBC?",
    conteudo:
      "Alguém pode explicar o peso de cada prova na média final de Economia Brasileira Contemporânea?",
    autor: "Ana S.",
    polo: "Petrópolis",
    disciplina: "EBC",
    dataCriacao: "2026-08-15",
    votos: 24,
    respostas: [
      {
        id: "r1",
        conteudo:
          "AD1 (20%) + AD2 (20%) + AP1 (30%) + AP2 (30%). Precisa tirar mínimo 5.0 na média e não zerar nenhuma prova.",
        autor: "Carlos O.",
        polo: "São Fidélis",
        dataCriacao: "2026-08-15",
        votos: 18,
        melhorResposta: true,
      },
    ],
    resolvida: true,
  },
  {
    id: "q2",
    titulo: "Pré-requisito de Métodos Determinísticos I",
    conteudo: "Preciso ter feito Cálculo I para fazer MDI? Ou posso fazer junto?",
    autor: "Pedro C.",
    polo: "Resende",
    disciplina: "MDI",
    dataCriacao: "2026-08-14",
    votos: 15,
    respostas: [
      {
        id: "r2",
        conteudo:
          "Não tem pré-requisito formal, mas ter base de álgebra ajuda muito. Recomendo estudar conjuntos e lógica antes.",
        autor: "Prof. Silva",
        polo: "Petrópolis",
        dataCriacao: "2026-08-14",
        votos: 22,
        melhorResposta: true,
      },
    ],
    resolvida: true,
  },
  {
    id: "q3",
    titulo: "Qual a melhor forma de estudar Contabilidade?",
    conteudo: "Tô com dificuldade em partidas dobradas. Alguém tem dicas?",
    autor: "Maria S.",
    polo: "Macaé",
    disciplina: "CG1",
    dataCriacao: "2026-08-13",
    votos: 31,
    respostas: [],
    resolvida: false,
  },
  {
    id: "q4",
    titulo: "Como funciona a substituição final em SO?",
    conteudo: "As notas de Sociologia das Organizações são cumulativas ou tem substituição?",
    autor: "Lucia F.",
    polo: "Angra dos Reis",
    disciplina: "SO",
    dataCriacao: "2026-08-12",
    votos: 19,
    respostas: [
      {
        id: "r3",
        conteudo:
          "É cumulativo. AD1 + AD2 + AP1 + AP2. Se tirar boa nota nas ADs, já garant parte da média.",
        autor: "João P.",
        polo: "Itaperuna",
        dataCriacao: "2026-08-12",
        votos: 12,
        melhorResposta: false,
      },
    ],
    resolvida: false,
  },
];

function FAQPage() {
  const [local, setLocal] = useLocalStorage<Pergunta[]>("rdf:faq", PERGUNTAS_MOCK);
  const [nuvem, setNuvem] = useState<Pergunta[] | null>(null);
  const perguntas = nuvem ?? local;
  const [busca, setBusca] = useState("");
  const [filtroDisciplina, setFiltroDisciplina] = useState("todas");
  const [filtroStatus, setFiltroStatus] = useState("todas");
  const [showNovaPergunta, setShowNovaPergunta] = useState(false);
  const [expandida, setExpandida] = useState<string | null>(null);
  const [textoResposta, setTextoResposta] = useState("");
  const [enviandoResposta, setEnviandoResposta] = useState(false);
  const identidade = getIdentidade();

  const recarregar = useCallback(async () => {
    const rows = await listFaq();
    if (rows) setNuvem(rows);
  }, []);

  useEffect(() => {
    recarregar();
    return subscribeFaq(recarregar);
  }, [recarregar]);

  const perguntasFiltradas = useMemo(() => {
    return perguntas
      .filter((p) => {
        if (filtroDisciplina !== "todas" && p.disciplina !== filtroDisciplina) return false;
        if (filtroStatus === "resolvidas" && !p.resolvida) return false;
        if (filtroStatus === "nao-resolvidas" && p.resolvida) return false;
        if (
          busca &&
          !p.titulo.toLowerCase().includes(busca.toLowerCase()) &&
          !p.conteudo.toLowerCase().includes(busca.toLowerCase())
        )
          return false;
        return true;
      })
      .sort((a, b) => b.votos - a.votos);
  }, [perguntas, filtroDisciplina, filtroStatus, busca]);

  const stats = useMemo(
    () => ({
      total: perguntas.length,
      resolvidas: perguntas.filter((p) => p.resolvida).length,
      totalRespostas: perguntas.reduce((acc, p) => acc + p.respostas.length, 0),
    }),
    [perguntas],
  );

  const handleVotar = async (perguntaId: string, atual: number) => {
    if (jaVotou("faq-p", perguntaId)) return;
    marcarVoto("faq-p", perguntaId);
    if (nuvem) {
      const novo = await votarPergunta(perguntaId, atual);
      setNuvem(nuvem.map((p) => (p.id === perguntaId ? { ...p, votos: novo } : p)));
    } else {
      setLocal(local.map((p) => (p.id === perguntaId ? { ...p, votos: p.votos + 1 } : p)));
    }
  };

  const handleNovaPergunta = async (titulo: string, conteudo: string, disciplina: string) => {
    const res = await enviarPerguntaNuvem({ titulo, conteudo, disciplina });
    if (!isSupabaseConfigured || !res.ok) {
      const novaPergunta: Pergunta = {
        id: res.pergunta?.id ?? `q${Date.now()}`,
        titulo,
        conteudo,
        autor: identidade?.nome ?? "Anônimo",
        polo: identidade?.polo ?? "",
        disciplina,
        dataCriacao: new Date().toISOString().slice(0, 10),
        votos: 0,
        respostas: [],
        resolvida: false,
      };
      setLocal([novaPergunta, ...local]);
    }
    setShowNovaPergunta(false);
    void registrarAtividade({
      acao: `perguntou sobre ${disciplina}`,
      disciplinaId: disciplina,
      tipo: "contribuicao",
    });
  };

  const handleEnviarResposta = async (perguntaId: string) => {
    if (!textoResposta.trim() || enviandoResposta) return;
    setEnviandoResposta(true);
    const res = await enviarRespostaNuvem(perguntaId, textoResposta.trim());
    if (!isSupabaseConfigured || !res.ok) {
      const nova: Resposta = {
        id: `r${Date.now()}`,
        conteudo: textoResposta.trim(),
        autor: identidade?.nome ?? "Anônimo",
        polo: identidade?.polo ?? "",
        dataCriacao: new Date().toISOString().slice(0, 10),
        votos: 0,
        melhorResposta: false,
      };
      const atualiza = (lista: Pergunta[]) =>
        lista.map((p) => (p.id === perguntaId ? { ...p, respostas: [...p.respostas, nova] } : p));
      if (nuvem) setNuvem(atualiza(nuvem));
      else setLocal(atualiza(local));
    }
    setTextoResposta("");
    setEnviandoResposta(false);
    void registrarAtividade({ acao: "respondeu uma dúvida da turma", tipo: "contribuicao" });
  };

  const handleVotarResposta = async (perguntaId: string, respostaId: string, atual: number) => {
    const chave = `faq-r-${respostaId}`;
    if (jaVotou("faq-r", chave)) return;
    marcarVoto("faq-r", chave);
    const atualiza = (lista: Pergunta[]) =>
      lista.map((p) =>
        p.id === perguntaId
          ? {
              ...p,
              respostas: p.respostas.map((r) =>
                r.id === respostaId ? { ...r, votos: r.votos + 1 } : r,
              ),
            }
          : p,
      );
    if (nuvem) {
      const novo = await votarResposta(respostaId, atual);
      setNuvem(
        nuvem.map((p) =>
          p.id === perguntaId
            ? {
                ...p,
                respostas: p.respostas.map((r) =>
                  r.id === respostaId ? { ...r, votos: novo } : r,
                ),
              }
            : p,
        ),
      );
    } else {
      setLocal(atualiza(local));
    }
  };

  const handleMelhorResposta = async (perguntaId: string, respostaId: string) => {
    const ok = await marcarMelhorResposta(perguntaId, respostaId);
    if (ok) recarregar();
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
              <HelpCircle className="w-5 h-5 text-[#D4941E]" />
              <h1 className="font-bold text-lg uppercase tracking-tight hidden sm:inline">
                Perguntas Frequentes
              </h1>
              {nuvem && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-[#27AE60]/20 rounded-full text-[9px] font-black uppercase text-[#7CFC9A]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#27AE60] animate-pulse" />
                  Ao vivo
                </span>
              )}
            </div>
          </div>
          <AppDesktopNav />
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-4 rounded-2xl border border-[#0A3D52]/10 text-center">
            <p className="text-2xl font-black text-[#0A3D52]">{stats.total}</p>
            <p className="text-[10px] font-bold text-[#0A3D52]/40 uppercase">Perguntas</p>
          </div>
          <div className="bg-[#27AE60]/10 p-4 rounded-2xl border border-[#27AE60]/20 text-center">
            <p className="text-2xl font-black text-[#27AE60]">{stats.resolvidas}</p>
            <p className="text-[10px] font-bold text-[#0A3D52]/40 uppercase">Resolvidas</p>
          </div>
          <div className="bg-[#2563EB]/10 p-4 rounded-2xl border border-[#2563EB]/20 text-center">
            <p className="text-2xl font-black text-[#2563EB]">{stats.totalRespostas}</p>
            <p className="text-[10px] font-bold text-[#0A3D52]/40 uppercase">Respostas</p>
          </div>
        </div>

        {/* Botão Nova Pergunta */}
        <button
          onClick={() => setShowNovaPergunta(true)}
          className="w-full bg-[#D4941E] text-[#0A3D52] py-3 rounded-2xl font-black text-sm uppercase tracking-wider hover:scale-[1.02] transition-all flex items-center justify-center gap-2 mb-6"
        >
          <Plus className="w-4 h-4" />
          Nova Pergunta
        </button>

        {/* Busca e Filtros */}
        <div className="bg-white rounded-2xl border border-[#0A3D52]/10 p-4 mb-6">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0A3D52]/30" />
                <input
                  type="text"
                  placeholder="Buscar perguntas..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full bg-[#F5F7FA] rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-[#D4941E]/40 outline-none"
                />
              </div>
            </div>
            <select
              value={filtroDisciplina}
              onChange={(e) => setFiltroDisciplina(e.target.value)}
              className="bg-[#F5F7FA] rounded-xl px-4 py-2.5 text-sm font-bold"
            >
              <option value="todas">Todas as disciplinas</option>
              {disciplinas.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nome}
                </option>
              ))}
            </select>
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="bg-[#F5F7FA] rounded-xl px-4 py-2.5 text-sm font-bold"
            >
              <option value="todas">Todas</option>
              <option value="resolvidas">Resolvidas</option>
              <option value="nao-resolvidas">Não Resolvidas</option>
            </select>
          </div>
        </div>

        {/* Lista de Perguntas */}
        <div className="space-y-4">
          {perguntasFiltradas.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#0A3D52]/10 p-12 text-center">
              <HelpCircle className="w-12 h-12 text-[#0A3D52]/20 mx-auto mb-4" />
              <p className="font-bold text-[#0A3D52]/40">Nenhuma pergunta encontrada</p>
              <p className="text-xs text-[#0A3D52]/30 mt-1">Seja o primeiro a perguntar!</p>
            </div>
          ) : (
            perguntasFiltradas.map((pergunta) => (
              <div
                key={pergunta.id}
                className={cn(
                  "bg-white rounded-2xl border p-5 hover:shadow-md transition-shadow",
                  pergunta.resolvida ? "border-[#27AE60]/20" : "border-[#0A3D52]/10",
                )}
              >
                <div className="flex items-start gap-4">
                  {/* Votos */}
                  <div className="flex flex-col items-center gap-1">
                    <button
                      onClick={() => handleVotar(pergunta.id, pergunta.votos)}
                      className="w-10 h-10 rounded-xl bg-[#F5F7FA] hover:bg-[#D4941E]/10 flex items-center justify-center transition-colors"
                    >
                      <ThumbsUp className="w-4 h-4 text-[#D4941E]" />
                    </button>
                    <span className="text-sm font-black text-[#D4941E]">{pergunta.votos}</span>
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {pergunta.resolvida && (
                        <span className="px-2 py-0.5 bg-[#27AE60]/10 text-[#27AE60] text-[10px] font-black rounded-lg flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Resolvida
                        </span>
                      )}
                      <span className="px-2 py-0.5 bg-[#0A3D52]/10 text-[#0A3D52] text-[10px] font-black rounded-lg">
                        {pergunta.disciplina}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm mb-1">{pergunta.titulo}</h3>
                    <p className="text-xs text-[#0A3D52]/60 mb-3">{pergunta.conteudo}</p>
                    <div className="flex items-center gap-4 text-[10px] text-[#0A3D52]/40">
                      <span>
                        {pergunta.autor} • {pergunta.polo}
                      </span>
                      <span>{new Date(pergunta.dataCriacao).toLocaleDateString("pt-BR")}</span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {pergunta.respostas.length} resposta
                        {pergunta.respostas.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {/* Melhor Resposta */}
                    {pergunta.respostas.some((r) => r.melhorResposta) && (
                      <div className="mt-4 p-3 bg-[#27AE60]/5 rounded-xl border border-[#27AE60]/20">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle2 className="w-4 h-4 text-[#27AE60]" />
                          <span className="text-[10px] font-black text-[#27AE60] uppercase">
                            Melhor Resposta
                          </span>
                        </div>
                        {pergunta.respostas
                          .filter((r) => r.melhorResposta)
                          .map((r) => (
                            <div key={r.id}>
                              <p className="text-xs text-[#0A3D52]/80">{r.conteudo}</p>
                              <p className="text-[10px] text-[#0A3D52]/40 mt-2">
                                {r.autor} • {r.polo}
                              </p>
                            </div>
                          ))}
                      </div>
                    )}

                    {/* Respostas + formulário */}
                    <button
                      onClick={() => setExpandida(expandida === pergunta.id ? null : pergunta.id)}
                      className="text-[11px] font-black text-[#2563EB] mt-3"
                    >
                      {expandida === pergunta.id
                        ? "Ocultar respostas"
                        : `Ver respostas (${pergunta.respostas.length}) / Responder`}
                    </button>

                    {expandida === pergunta.id && (
                      <div className="mt-3 space-y-3">
                        {pergunta.respostas
                          .filter((r) => !r.melhorResposta)
                          .map((r) => (
                            <div key={r.id} className="p-3 bg-[#F5F7FA] rounded-xl">
                              <p className="text-xs text-[#0A3D52]/80">{r.conteudo}</p>
                              <div className="flex items-center gap-3 mt-2">
                                <span className="text-[10px] text-[#0A3D52]/40">
                                  {r.autor} • {r.polo}
                                </span>
                                <button
                                  onClick={() => handleVotarResposta(pergunta.id, r.id, r.votos)}
                                  className="flex items-center gap-1 text-[10px] font-black text-[#27AE60]"
                                >
                                  <ThumbsUp className="w-3 h-3" />
                                  {r.votos}
                                </button>
                                {!pergunta.resolvida && (
                                  <button
                                    onClick={() => handleMelhorResposta(pergunta.id, r.id)}
                                    className="text-[10px] font-black text-[#D4941E]"
                                  >
                                    ✓ Melhor resposta
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={expandida === pergunta.id ? textoResposta : ""}
                            onChange={(e) => setTextoResposta(e.target.value)}
                            onFocus={() => setExpandida(pergunta.id)}
                            placeholder="Escreva sua resposta..."
                            className="flex-1 bg-[#F5F7FA] rounded-xl px-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4941E]/40"
                          />
                          <button
                            onClick={() => handleEnviarResposta(pergunta.id)}
                            disabled={!textoResposta.trim() || enviandoResposta}
                            className="px-4 py-2.5 rounded-xl bg-[#0A3D52] text-white text-xs font-black disabled:opacity-40"
                          >
                            Enviar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Modal Nova Pergunta */}
      {showNovaPergunta && (
        <NovaPerguntaModal
          onEnviar={handleNovaPergunta}
          onFechar={() => setShowNovaPergunta(false)}
        />
      )}

      <AppBottomNav />
    </div>
  );
}

function NovaPerguntaModal({
  onEnviar,
  onFechar,
}: {
  onEnviar: (titulo: string, conteudo: string, disciplina: string) => void;
  onFechar: () => void;
}) {
  const [titulo, setTitulo] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [disciplina, setDisciplina] = useState(disciplinas[0]?.id ?? "");

  const handleSubmit = () => {
    if (!titulo.trim() || !conteudo.trim()) return;
    onEnviar(titulo.trim(), conteudo.trim(), disciplina);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-md p-6">
        <h2 className="text-lg font-black mb-4">Nova Pergunta</h2>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase text-[#0A3D52]/40 mb-1 block">
              Título
            </label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Como calcular média final?"
              className="w-full bg-[#F5F7FA] rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#D4941E]/40"
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-[#0A3D52]/40 mb-1 block">
              Disciplina
            </label>
            <select
              value={disciplina}
              onChange={(e) => setDisciplina(e.target.value)}
              className="w-full bg-[#F5F7FA] rounded-xl px-4 py-2.5 text-sm"
            >
              {disciplinas.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-[#0A3D52]/40 mb-1 block">
              Descrição
            </label>
            <textarea
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
              placeholder="Descreva sua dúvida em detalhes..."
              className="w-full bg-[#F5F7FA] rounded-xl px-4 py-3 text-sm h-24 resize-none outline-none focus:ring-2 focus:ring-[#D4941E]/40"
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
            onClick={handleSubmit}
            disabled={!titulo.trim() || !conteudo.trim()}
            className="flex-1 py-2.5 rounded-xl bg-[#D4941E] text-[#0A3D52] text-sm font-black disabled:opacity-40"
          >
            Publicar
          </button>
        </div>
      </div>
    </div>
  );
}
