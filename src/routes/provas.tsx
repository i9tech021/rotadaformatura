// src/routes/provas.tsx
// Banco de Provas Anteriores — acervo colaborativo de provas da turma.
// Alunos enviam provas antigas (texto/imagem) e todos podem acessar.
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  FileText,
  Upload,
  Search,
  Filter,
  Download,
  Star,
  Clock,
  Users,
  Menu,
  GraduationCap,
  LayoutDashboard,
  Calendar as CalendarIcon,
  BookOpen,
  Settings,
  MessageSquare,
  Trophy,
  CheckCircle2,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AppBottomNav, AppDesktopNav, AppMobileMenu } from "@/components/AppNav";
import { useState, useMemo, useEffect, useCallback } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import {
  listBancoProvas,
  enviarBancoProva,
  votarBancoProva,
  subscribeBancoProvas,
  isSupabaseConfigured,
  type ProvaCompartilhada,
} from "@/lib/bancoProvasService";
import { registrarAtividade } from "@/lib/feedService";
import { jaVotou, marcarVoto } from "@/lib/votos";
import { disciplinas } from "@/data/disciplines";
import { cn } from "@/lib/utils";
import { getIdentidade } from "@/lib/auth";

export const Route = createFileRoute("/provas")({
  component: ProvasPage,
  head: () => ({
    title: "Provas Anteriores | Rota da Formatura",
    meta: [
      {
        name: "description",
        content: "Banco de provas anteriores compartilhado pelos alunos do CEDERJ.",
      },
    ],
  }),
});

interface Prova {
  id: string;
  disciplinaId: string;
  disciplinaNome: string;
  tipo: string; // "AD1", "AD2", "AP1", "AP2", "AP3"
  semestre: string;
  autor: string;
  polo: string;
  conteudo: string; // Texto da prova ou descrição
  dataEnvio: string;
  avaliacoes: number;
  comentarios: number;
}

// Dados mock de provas (em produção viria do Supabase)
const PROVAS_MOCK: Prova[] = [
  {
    id: "p1",
    disciplinaId: "EBC",
    disciplinaNome: "Economia Brasileira Contemporânea",
    tipo: "AD1",
    semestre: "2025-2",
    autor: "Ana Silva",
    polo: "Petrópolis",
    conteudo:
      "Questões sobre o Milagre Econômico, Plano Cruzado, Collor e Real. Prova com 10 questões discursivas e 20 objetivas.",
    dataEnvio: "2025-12-15",
    avaliacoes: 47,
    comentarios: 12,
  },
  {
    id: "p2",
    disciplinaId: "EBC",
    disciplinaNome: "Economia Brasileira Contemporânea",
    tipo: "AP1",
    semestre: "2025-2",
    autor: "Carlos Oliveira",
    polo: "São Fidélis",
    conteudo:
      "Prova focada em PND, crise da dívida e Plano Real. Inclui análise de gráficos e interpretação de dados.",
    dataEnvio: "2025-11-20",
    avaliacoes: 63,
    comentarios: 8,
  },
  {
    id: "p3",
    disciplinaId: "SO",
    disciplinaNome: "Sociologia das Organizações",
    tipo: "AD1",
    semestre: "2025-2",
    autor: "Maria Santos",
    polo: "Macaé",
    conteudo:
      "Questões sobre Max Weber, burocracia, cultura organizacional e motivação. Estudo de caso empresa X.",
    dataEnvio: "2025-12-10",
    avaliacoes: 35,
    comentarios: 5,
  },
  {
    id: "p4",
    disciplinaId: "CG1",
    disciplinaNome: "Contabilidade Geral I",
    tipo: "AD2",
    semestre: "2025-2",
    autor: "Pedro Costa",
    polo: "Resende",
    conteudo:
      "Exercícios de escrituração, balanço patrimonial, DRE e partidas dobradas. 30 questões práticas.",
    dataEnvio: "2025-12-05",
    avaliacoes: 52,
    comentarios: 15,
  },
  {
    id: "p5",
    disciplinaId: "MDI",
    disciplinaNome: "Métodos Determinísticos I",
    tipo: "AP1",
    semestre: "2025-2",
    autor: "Lucia Ferreira",
    polo: "Angra dos Reis",
    conteudo:
      "Conjuntos, proposições lógicas, tabelas-verdade e operadores. Prova com 25 questões.",
    dataEnvio: "2025-11-25",
    avaliacoes: 41,
    comentarios: 9,
  },
];

function ProvasPage() {
  // local = fallback offline (mocks + envios deste aparelho)
  const [local, setLocal] = useLocalStorage<Prova[]>("rdf:provas", PROVAS_MOCK);
  // nuvem = lista coletiva em tempo real (null = offline/não carregado)
  const [nuvem, setNuvem] = useState<Prova[] | null>(null);
  const provas = nuvem ?? local;
  const [filtroDisciplina, setFiltroDisciplina] = useState("todas");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [busca, setBusca] = useState("");
  const [showEnvio, setShowEnvio] = useState(false);
  const identidade = getIdentidade();

  const recarregar = useCallback(async () => {
    const rows: ProvaCompartilhada[] | null = await listBancoProvas();
    if (rows) setNuvem(rows.map((p) => ({ ...p, comentarios: 0 })));
  }, []);

  useEffect(() => {
    recarregar();
    return subscribeBancoProvas(recarregar);
  }, [recarregar]);

  const provasFiltradas = useMemo(() => {
    return provas.filter((p) => {
      if (filtroDisciplina !== "todas" && p.disciplinaId !== filtroDisciplina) return false;
      if (filtroTipo !== "todos" && p.tipo !== filtroTipo) return false;
      if (
        busca &&
        !p.conteudo.toLowerCase().includes(busca.toLowerCase()) &&
        !p.disciplinaNome.toLowerCase().includes(busca.toLowerCase())
      )
        return false;
      return true;
    });
  }, [provas, filtroDisciplina, filtroTipo, busca]);

  const tipos = [...new Set(provas.map((p) => p.tipo))].sort();

  const handleEnviarProva = async (
    novaProva: Omit<Prova, "id" | "dataEnvio" | "avaliacoes" | "comentarios">,
  ) => {
    const res = await enviarBancoProva({
      disciplinaId: novaProva.disciplinaId,
      disciplinaNome: novaProva.disciplinaNome,
      tipo: novaProva.tipo,
      semestre: novaProva.semestre,
      conteudo: novaProva.conteudo,
    });
    // Offline ou falha: guarda local para não perder o conteúdo
    if (!isSupabaseConfigured || !res.ok) {
      const prova: Prova = {
        ...novaProva,
        id: res.prova?.id ?? `p${Date.now()}`,
        dataEnvio: new Date().toISOString().slice(0, 10),
        avaliacoes: 0,
        comentarios: 0,
      };
      setLocal([prova, ...local]);
    }
    setShowEnvio(false);
    void registrarAtividade({
      acao: `subiu prova de ${novaProva.disciplinaNome}`,
      disciplinaId: novaProva.disciplinaId,
      tipo: "upload",
    });
  };

  const handleVotar = async (id: string, atual: number) => {
    if (jaVotou("provas", id)) return;
    marcarVoto("provas", id);
    if (nuvem) {
      const novo = await votarBancoProva(id, atual);
      setNuvem(nuvem.map((p) => (p.id === id ? { ...p, avaliacoes: novo } : p)));
    } else {
      setLocal(local.map((p) => (p.id === id ? { ...p, avaliacoes: p.avaliacoes + 1 } : p)));
    }
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
              <FileText className="w-5 h-5 text-[#D4941E]" />
              <h1 className="font-bold text-lg uppercase tracking-tight hidden sm:inline">
                Provas Anteriores
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

          <button
            onClick={() => setShowEnvio(true)}
            className="bg-[#D4941E] text-[#0A3D52] px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-wider hover:scale-105 transition-all flex items-center gap-2"
          >
            <Upload className="w-3.5 h-3.5" />
            Enviar Prova
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-4 rounded-2xl border border-[#0A3D52]/10 text-center">
            <p className="text-2xl font-black text-[#0A3D52]">{provas.length}</p>
            <p className="text-[10px] font-bold text-[#0A3D52]/40 uppercase">Provas Enviadas</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-[#0A3D52]/10 text-center">
            <p className="text-2xl font-black text-[#27AE60]">
              {[...new Set(provas.map((p) => p.autor))].length}
            </p>
            <p className="text-[10px] font-bold text-[#0A3D52]/40 uppercase">Colaboradores</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-[#0A3D52]/10 text-center">
            <p className="text-2xl font-black text-[#D4941E]">
              {[...new Set(provas.map((p) => p.disciplinaId))].length}
            </p>
            <p className="text-[10px] font-bold text-[#0A3D52]/40 uppercase">Disciplinas</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-2xl border border-[#0A3D52]/10 p-4 mb-6">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0A3D52]/30" />
                <input
                  type="text"
                  placeholder="Buscar provas..."
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
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="bg-[#F5F7FA] rounded-xl px-4 py-2.5 text-sm font-bold"
            >
              <option value="todos">Todos os tipos</option>
              {tipos.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Lista de Provas */}
        <div className="space-y-4">
          {provasFiltradas.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#0A3D52]/10 p-12 text-center">
              <FileText className="w-12 h-12 text-[#0A3D52]/20 mx-auto mb-4" />
              <p className="font-bold text-[#0A3D52]/40">Nenhuma prova encontrada</p>
              <p className="text-xs text-[#0A3D52]/30 mt-1">Seja o primeiro a enviar uma prova!</p>
            </div>
          ) : (
            provasFiltradas.map((prova) => (
              <div
                key={prova.id}
                className="bg-white rounded-2xl border border-[#0A3D52]/10 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 bg-[#0A3D52] text-white text-[10px] font-black rounded-lg">
                        {prova.tipo}
                      </span>
                      <span className="px-2 py-0.5 bg-[#D4941E]/10 text-[#D4941E] text-[10px] font-black rounded-lg">
                        {prova.semestre}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm mb-1">{prova.disciplinaNome}</h3>
                    <p className="text-xs text-[#0A3D52]/60 mb-3">{prova.conteudo}</p>
                    <div className="flex items-center gap-4 text-[10px] text-[#0A3D52]/40">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {prova.autor} • {prova.polo}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(prova.dataEnvio).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <button
                      onClick={() => handleVotar(prova.id, prova.avaliacoes)}
                      title="Marcar como útil"
                      className="flex items-center gap-1 text-[#D4941E] hover:scale-110 transition-transform"
                    >
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span className="text-xs font-bold">{prova.avaliacoes}</span>
                    </button>
                    <button className="flex items-center gap-1 px-3 py-1.5 bg-[#F5F7FA] rounded-lg text-[10px] font-bold hover:bg-[#0A3D52]/10 transition-colors">
                      <Download className="w-3 h-3" />
                      Baixar
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Modal de Envio */}
      {showEnvio && (
        <EnvioProvaModal
          onEnviar={handleEnviarProva}
          onFechar={() => setShowEnvio(false)}
          identidade={identidade}
        />
      )}

      <AppBottomNav />
    </div>
  );
}

function EnvioProvaModal({
  onEnviar,
  onFechar,
  identidade,
}: {
  onEnviar: (prova: Omit<Prova, "id" | "dataEnvio" | "avaliacoes" | "comentarios">) => void;
  onFechar: () => void;
  identidade: { nome: string; polo: string } | null;
}) {
  const [disciplinaId, setDisciplinaId] = useState(disciplinas[0]?.id ?? "");
  const [tipo, setTipo] = useState("AD1");
  const [semestre, setSemestre] = useState("2026-1");
  const [conteudo, setConteudo] = useState("");

  const handleSubmit = () => {
    if (!disciplinaId || !conteudo.trim()) return;
    const disc = disciplinas.find((d) => d.id === disciplinaId);
    onEnviar({
      disciplinaId,
      disciplinaNome: disc?.nome ?? disciplinaId,
      tipo,
      semestre,
      autor: identidade?.nome ?? "Anônimo",
      polo: identidade?.polo ?? "",
      conteudo: conteudo.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-md p-6">
        <h2 className="text-lg font-black mb-4">Enviar Prova Anterior</h2>

        <div className="space-y-4">
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase text-[#0A3D52]/40 mb-1 block">
                Tipo
              </label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="w-full bg-[#F5F7FA] rounded-xl px-4 py-2.5 text-sm"
              >
                <option>AD1</option>
                <option>AD2</option>
                <option>AP1</option>
                <option>AP2</option>
                <option>AP3</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-[#0A3D52]/40 mb-1 block">
                Semestre
              </label>
              <select
                value={semestre}
                onChange={(e) => setSemestre(e.target.value)}
                className="w-full bg-[#F5F7FA] rounded-xl px-4 py-2.5 text-sm"
              >
                <option>2026-1</option>
                <option>2025-2</option>
                <option>2025-1</option>
                <option>2024-2</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-[#0A3D52]/40 mb-1 block">
              Descrição / Conteúdo da Prova
            </label>
            <textarea
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
              placeholder="Descreva as questões, temas abordados, dicas..."
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
            disabled={!conteudo.trim()}
            className="flex-1 py-2.5 rounded-xl bg-[#D4941E] text-[#0A3D52] text-sm font-black disabled:opacity-40"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}
