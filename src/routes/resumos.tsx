// src/routes/resumos.tsx
// Resumos Colaborativos — alunos criam e compartilham resumos, com votação.
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  BookOpen,
  ThumbsUp,
  Search,
  Plus,
  Clock,
  Users,
  Star,
  Menu,
  Eye,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AppBottomNav, AppDesktopNav, AppMobileMenu } from "@/components/AppNav";
import { useState, useMemo, useEffect, useCallback } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import {
  listResumos,
  enviarResumo as enviarResumoNuvem,
  votarResumo,
  registrarLeitura,
  subscribeResumos,
  isSupabaseConfigured,
  type ResumoCompartilhado,
} from "@/lib/resumosService";
import { registrarAtividade } from "@/lib/feedService";
import { jaVotou, marcarVoto } from "@/lib/votos";
import { disciplinas } from "@/data/disciplines";
import { cn } from "@/lib/utils";
import { getIdentidade } from "@/lib/auth";

export const Route = createFileRoute("/resumos")({
  component: ResumosPage,
  head: () => ({
    title: "Resumos Colaborativos | Rota da Formatura",
    meta: [
      {
        name: "description",
        content: "Resumos criados e avaliados pelos alunos do CEDERJ.",
      },
    ],
  }),
});

interface Resumo extends ResumoCompartilhado {
  destaque: boolean;
}

/** Vira destaque automático a partir de 50 votos úteis. */
const ehDestaque = (votosUteis: number) => votosUteis >= 50;

const toUI = (r: ResumoCompartilhado): Resumo => ({ ...r, destaque: ehDestaque(r.votosUteis) });

const RESUMOS_MOCK: Resumo[] = [
  {
    id: "r1",
    titulo: "Plano Real — resumo completo",
    conteudo:
      "Antecedentes: hiperinflação, 4 planos fracassados (Cruzado, Bresser, Verão, Collor). URV como unidade de conta transitória. Conversão 1 URV = 1 Real em 01/07/1994. Âncora cambial + juros altos. Consequências: estabilidade, mas desindustrialização parcial e crise cambial de 1999.",
    disciplinaId: "EBC",
    disciplinaNome: "Economia Brasileira Contemporânea",
    autor: "Carlos O.",
    polo: "São Fidélis",
    dataCriacao: "2026-08-20",
    votosUteis: 89,
    visualizacoes: 412,
    destaque: true,
  },
  {
    id: "r2",
    titulo: "Weber e a burocracia em 10 tópicos",
    conteudo:
      "1. Ação social e seus 4 tipos. 2. Dominação: tradicional, carismática, racional-legal. 3. Burocracia como tipo ideal. 4. Características: hierarquia, impessoalidade, meritocracia. 5. Disfunções segundo Merton. 6. Aplicação em empresas modernas...",
    disciplinaId: "SO",
    disciplinaNome: "Sociologia das Organizações",
    autor: "Ana S.",
    polo: "Petrópolis",
    dataCriacao: "2026-08-18",
    votosUteis: 64,
    visualizacoes: 328,
    destaque: true,
  },
  {
    id: "r3",
    titulo: "Partidas dobradas — macete definitivo",
    conteudo:
      "Débito = destino (onde o dinheiro foi parar). Crédito = origem (de onde saiu). Ativo aumenta no débito. Passivo e PL aumentam no crédito. Receitas = crédito, Despesas = débito. Exemplo: comprou mercadoria à vista — D: Estoque, C: Caixa.",
    disciplinaId: "CG1",
    disciplinaNome: "Contabilidade Geral I",
    autor: "Pedro C.",
    polo: "Resende",
    dataCriacao: "2026-08-15",
    votosUteis: 112,
    visualizacoes: 587,
    destaque: true,
  },
  {
    id: "r4",
    titulo: "Tabelas-verdade sem decorar",
    conteudo:
      "Conjunção (E): só V se tudo V. Disjunção (OU): só F se tudo F. Condicional (SE...ENTÃO): só F no caso V→F (regra do Vera Fischer é Falsa). Bicondicional: V quando iguais. Negação inverte tudo + De Morgan.",
    disciplinaId: "MDI",
    disciplinaNome: "Métodos Determinísticos I",
    autor: "Lucia F.",
    polo: "Angra dos Reis",
    dataCriacao: "2026-08-12",
    votosUteis: 47,
    visualizacoes: 203,
    destaque: false,
  },
];

function ResumosPage() {
  const [local, setLocal] = useLocalStorage<Resumo[]>("rdf:resumos", RESUMOS_MOCK);
  const [nuvem, setNuvem] = useState<Resumo[] | null>(null);
  const resumos = nuvem ?? local;
  const [busca, setBusca] = useState("");
  const [filtroDisciplina, setFiltroDisciplina] = useState("todas");
  const [ordenar, setOrdenar] = useState<"votos" | "recentes" | "vistos">("votos");
  const [expandido, setExpandido] = useState<string | null>(null);
  const [showNovo, setShowNovo] = useState(false);
  const identidade = getIdentidade();

  const recarregar = useCallback(async () => {
    const rows = await listResumos();
    if (rows) setNuvem(rows.map(toUI));
  }, []);

  useEffect(() => {
    recarregar();
    return subscribeResumos(recarregar);
  }, [recarregar]);

  const resumosFiltrados = useMemo(() => {
    const lista = resumos.filter((r) => {
      if (filtroDisciplina !== "todas" && r.disciplinaId !== filtroDisciplina) return false;
      if (
        busca &&
        !r.titulo.toLowerCase().includes(busca.toLowerCase()) &&
        !r.conteudo.toLowerCase().includes(busca.toLowerCase())
      )
        return false;
      return true;
    });
    if (ordenar === "votos") lista.sort((a, b) => b.votosUteis - a.votosUteis);
    if (ordenar === "recentes") lista.sort((a, b) => b.dataCriacao.localeCompare(a.dataCriacao));
    if (ordenar === "vistos") lista.sort((a, b) => b.visualizacoes - a.visualizacoes);
    return lista;
  }, [resumos, filtroDisciplina, busca, ordenar]);

  const votar = async (id: string, atual: number) => {
    if (jaVotou("resumos", id)) return;
    marcarVoto("resumos", id);
    if (nuvem) {
      const novo = await votarResumo(id, atual);
      setNuvem(nuvem.map((r) => (r.id === id ? { ...r, votosUteis: novo } : r)));
    } else {
      setLocal(local.map((r) => (r.id === id ? { ...r, votosUteis: r.votosUteis + 1 } : r)));
    }
  };

  const abrirResumo = (id: string, atual: number) => {
    setExpandido(expandido === id ? null : id);
    if (nuvem) {
      setNuvem(nuvem.map((r) => (r.id === id ? { ...r, visualizacoes: r.visualizacoes + 1 } : r)));
      void registrarLeitura(id, atual);
    } else {
      setLocal(local.map((r) => (r.id === id ? { ...r, visualizacoes: r.visualizacoes + 1 } : r)));
    }
  };

  const adicionarResumo = async (titulo: string, conteudo: string, disciplinaId: string) => {
    const disc = disciplinas.find((d) => d.id === disciplinaId);
    const res = await enviarResumoNuvem({
      titulo,
      conteudo,
      disciplinaId,
      disciplinaNome: disc?.nome ?? disciplinaId,
    });
    if (!isSupabaseConfigured || !res.ok) {
      const novo: Resumo = {
        id: res.resumo?.id ?? `r${Date.now()}`,
        titulo: titulo.trim(),
        conteudo: conteudo.trim(),
        disciplinaId,
        disciplinaNome: disc?.nome ?? disciplinaId,
        autor: identidade?.nome ?? "Anônimo",
        polo: identidade?.polo ?? "",
        dataCriacao: new Date().toISOString().slice(0, 10),
        votosUteis: 0,
        visualizacoes: 0,
        destaque: false,
      };
      setLocal([novo, ...local]);
    }
    setShowNovo(false);
    void registrarAtividade({
      acao: `compartilhou resumo de ${disc?.nome ?? disciplinaId}`,
      disciplinaId,
      tipo: "contribuicao",
    });
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#0A3D52] pb-20">
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
              <BookOpen className="w-5 h-5 text-[#D4941E]" />
              <h1 className="font-bold text-lg uppercase tracking-tight hidden sm:inline">
                Resumos Colaborativos
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
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-4 rounded-2xl border border-[#0A3D52]/10 text-center">
            <p className="text-2xl font-black text-[#0A3D52]">{resumos.length}</p>
            <p className="text-[10px] font-bold text-[#0A3D52]/40 uppercase">Resumos</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-[#0A3D52]/10 text-center">
            <p className="text-2xl font-black text-[#27AE60]">
              {resumos.reduce((a, r) => a + r.votosUteis, 0)}
            </p>
            <p className="text-[10px] font-bold text-[#0A3D52]/40 uppercase">Votos úteis</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-[#0A3D52]/10 text-center">
            <p className="text-2xl font-black text-[#D4941E]">
              {resumos.reduce((a, r) => a + r.visualizacoes, 0)}
            </p>
            <p className="text-[10px] font-bold text-[#0A3D52]/40 uppercase">Leituras</p>
          </div>
        </div>

        <button
          onClick={() => setShowNovo(true)}
          className="w-full bg-[#D4941E] text-[#0A3D52] py-3 rounded-2xl font-black text-sm uppercase tracking-wider hover:scale-[1.02] transition-all flex items-center justify-center gap-2 mb-6"
        >
          <Plus className="w-4 h-4" />
          Compartilhar resumo
        </button>

        <div className="bg-white rounded-2xl border border-[#0A3D52]/10 p-4 mb-6">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0A3D52]/30" />
                <input
                  type="text"
                  placeholder="Buscar resumos..."
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
              value={ordenar}
              onChange={(e) => setOrdenar(e.target.value as "votos" | "recentes" | "vistos")}
              className="bg-[#F5F7FA] rounded-xl px-4 py-2.5 text-sm font-bold"
            >
              <option value="votos">Mais úteis</option>
              <option value="recentes">Mais recentes</option>
              <option value="vistos">Mais lidos</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          {resumosFiltrados.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#0A3D52]/10 p-12 text-center">
              <BookOpen className="w-12 h-12 text-[#0A3D52]/20 mx-auto mb-4" />
              <p className="font-bold text-[#0A3D52]/40">Nenhum resumo encontrado</p>
              <p className="text-xs text-[#0A3D52]/30 mt-1">Seja o primeiro a compartilhar!</p>
            </div>
          ) : (
            resumosFiltrados.map((resumo) => (
              <div
                key={resumo.id}
                className={cn(
                  "bg-white rounded-2xl border p-5 hover:shadow-md transition-shadow",
                  resumo.destaque ? "border-[#D4941E]/30" : "border-[#0A3D52]/10",
                )}
              >
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center gap-1">
                    <button
                      onClick={() => votar(resumo.id, resumo.votosUteis)}
                      className="w-10 h-10 rounded-xl bg-[#F5F7FA] hover:bg-[#27AE60]/10 flex items-center justify-center transition-colors"
                    >
                      <ThumbsUp className="w-4 h-4 text-[#27AE60]" />
                    </button>
                    <span className="text-sm font-black text-[#27AE60]">{resumo.votosUteis}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {resumo.destaque && (
                        <span className="px-2 py-0.5 bg-[#D4941E]/10 text-[#D4941E] text-[10px] font-black rounded-lg flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          Destaque
                        </span>
                      )}
                      <span className="px-2 py-0.5 bg-[#0A3D52]/10 text-[#0A3D52] text-[10px] font-black rounded-lg">
                        {resumo.disciplinaId}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm mb-1">{resumo.titulo}</h3>
                    <p
                      className={cn(
                        "text-xs text-[#0A3D52]/60",
                        expandido !== resumo.id && "line-clamp-2",
                      )}
                    >
                      {resumo.conteudo}
                    </p>
                    <div className="flex items-center gap-4 text-[10px] text-[#0A3D52]/40 mt-2">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {resumo.autor} • {resumo.polo}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(resumo.dataCriacao).toLocaleDateString("pt-BR")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {resumo.visualizacoes}
                      </span>
                    </div>
                    <button
                      onClick={() => abrirResumo(resumo.id, resumo.visualizacoes)}
                      className="text-[11px] font-black text-[#D4941E] mt-2"
                    >
                      {expandido === resumo.id ? "Recolher" : "Ler resumo completo"}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {showNovo && (
        <NovoResumoModal onEnviar={adicionarResumo} onFechar={() => setShowNovo(false)} />
      )}

      <AppBottomNav />
    </div>
  );
}

function NovoResumoModal({
  onEnviar,
  onFechar,
}: {
  onEnviar: (titulo: string, conteudo: string, disciplinaId: string) => void;
  onFechar: () => void;
}) {
  const [titulo, setTitulo] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [disciplinaId, setDisciplinaId] = useState(disciplinas[0]?.id ?? "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-md p-6">
        <h2 className="text-lg font-black mb-4">Compartilhar Resumo</h2>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase text-[#0A3D52]/40 mb-1 block">
              Título
            </label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Plano Real — resumo completo"
              className="w-full bg-[#F5F7FA] rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#D4941E]/40"
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-[#0A3D52]/40 mb-1 block">
              Disciplina
            </label>
            <select
              value={disciplinaId}
              onChange={(e) => setDisciplinaId(e.target.value)}
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
              Resumo
            </label>
            <textarea
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
              placeholder="Escreva seu resumo de forma clara e direta..."
              className="w-full bg-[#F5F7FA] rounded-xl px-4 py-3 text-sm h-28 resize-none outline-none focus:ring-2 focus:ring-[#D4941E]/40"
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
              titulo.trim() && conteudo.trim() && onEnviar(titulo, conteudo, disciplinaId)
            }
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
