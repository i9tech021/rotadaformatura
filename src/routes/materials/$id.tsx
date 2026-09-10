// src/routes/materials/$id.tsx
// PÁGINA DEDICADA DE MATERIAIS DE UMA DISCIPLINA.
// Lista todos os materiais (oficiais + podcasts + publicações da turma),
// com exclusão de materiais próprios (ou via senha admin).
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Download,
  ExternalLink,
  FileText,
  FileUp,
  Loader2,
  Menu,
  Play,
  Plus,
  Search,
  Share2,
  Trash2,
  X,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AppBottomNav, AppDesktopNav, AppMobileMenu } from "@/components/AppNav";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { AudioPlayer } from "@/components/AudioPlayer";
import { MATERIALS, type Material } from "@/data/materials";
import { disciplinas } from "@/data/disciplines";
import {
  ETAPAS,
  excluirPublicacao,
  getIdentidade,
  kindDaPublicacao,
  kindDoArquivo,
  LIMITE_ARQUIVO_MB,
  listPublicacoes,
  publicarArquivo,
  subscribePublicacoes,
  type EtapaPublicacao,
  type KindMaterial,
  type Publicacao,
} from "@/lib/publicacoesService";
import {
  formatarDuracao,
  listPodcasts,
  subscribePodcasts,
  type Podcast,
} from "@/lib/podcastService";
import { otimizarAudio, suportaOtimizacao } from "@/lib/audioLeve";
import { playAudio } from "@/lib/audioContext";
import { SENHA_DEV } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ============================================================
// Tipos
// ============================================================
type FiltroTipo = "todos" | "oficiais" | KindMaterial;
type FiltroObjetivo = EtapaPublicacao | "todas";

interface ItemMaterial {
  id: string;
  titulo: string;
  tipo: "curado" | "podcast" | "publicacao";
  kind: KindMaterial | "link";
  url?: string;
  conteudo?: string;
  etapa?: string;
  autor?: string;
  podcast?: Podcast;
  publicacao?: Publicacao;
  curado?: Material;
}

// ============================================================
// Helpers
// ============================================================
function objetivoDoTitulo(titulo: string): EtapaPublicacao {
  const m = titulo.toUpperCase().match(/\b(AP3|AP2|AP1|AD2|AD1)\b/);
  if (m?.[1] === "AP1") return "AP1";
  if (m?.[1] === "AP2") return "AP2";
  if (m?.[1] === "AP3") return "AP3";
  if (m?.[1] === "AD1") return "AD1";
  if (m?.[1] === "AD2") return "AD2";
  return "Geral";
}

function objetivoDoEpisodio(objetivo?: string): EtapaPublicacao {
  const m = (objetivo || "").toUpperCase().match(/\b(AP3|AP2|AP1|AD2|AD1)\b/);
  if (m?.[1] === "AP1") return "AP1";
  if (m?.[1] === "AP2") return "AP2";
  if (m?.[1] === "AP3") return "AP3";
  if (m?.[1] === "AD1") return "AD1";
  if (m?.[1] === "AD2") return "AD2";
  return "Geral";
}

function iconeCurado(type: Material["type"]): string {
  switch (type) {
    case "pdf": return "📄";
    case "doc": return "📝";
    case "image": return "🖼️";
    default: return "🔗";
  }
}

const EMOJI_KIND: Record<string, string> = {
  audio: "🎧",
  video: "🎬",
  pdf: "📄",
  imagem: "🖼️",
  arquivo: "📎",
  nota: "📝",
  link: "🔗",
};

const ROTULO_KIND: Record<string, string> = {
  audio: "Áudio",
  video: "Vídeo",
  pdf: "Documento",
  imagem: "Imagem",
  arquivo: "Arquivo",
  nota: "Nota",
  link: "Link",
};

function prioridade(kind: ItemMaterial["kind"]): number {
  if (kind === "audio") return 0;
  if (kind === "video") return 1;
  if (kind === "pdf" || kind === "arquivo") return 2;
  if (kind === "imagem") return 3;
  if (kind === "nota") return 4;
  return 5;
}

// "já estudei" (local storage)
function lerEstudados(disciplinaId: string): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(`rdf:estudado:${disciplinaId}`) || "{}");
  } catch {
    return {};
  }
}
function salvarEstudados(disciplinaId: string, map: Record<string, boolean>) {
  try {
    localStorage.setItem(`rdf:estudado:${disciplinaId}`, JSON.stringify(map));
  } catch { /* ignore */ }
}

// ============================================================
// Route
// ============================================================
export const Route = createFileRoute("/materials/$id")({
  component: DisciplineMaterials,
  head: ({ params }) => {
    const d = disciplinas.find((x) => x.id === params.id);
    return {
      meta: [{ title: `${d?.nome || "Materiais"} | Rota da Formatura` }],
    };
  },
});

// ============================================================
// Componente principal
// ============================================================
function DisciplineMaterials() {
  const { id } = Route.useParams();
  const router = useRouter();
  const disciplina = disciplinas.find((d) => d.id === id);

  const [publicacoes, setPublicacoes] = useState<Publicacao[]>([]);
  const [episodios, setEpisodios] = useState<Podcast[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtroObjetivo, setFiltroObjetivo] = useState<FiltroObjetivo>("todas");
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>("todos");
  const [busca, setBusca] = useState("");
  const [estudados, setEstudados] = useState<Record<string, boolean>>({});
  const identidade = useMemo(() => getIdentidade(), []);

  // Formulário
  const [formAberto, setFormAberto] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [objetivo, setObjetivo] = useState<EtapaPublicacao>("Geral");
  const [descricao, setDescricao] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [statusEnvio, setStatusEnvio] = useState("");
  const [otimSuportado, setOtimSuportado] = useState<boolean | null>(null);

  useEffect(() => {
    suportaOtimizacao().then(setOtimSuportado).catch(() => setOtimSuportado(false));
  }, []);

  useEffect(() => {
    setEstudados(lerEstudados(id));
  }, [id]);

  const recarregar = useCallback(async () => {
    const [lista, eps] = await Promise.all([
      listPublicacoes(id),
      listPodcasts(id).catch(() => [] as Podcast[]),
    ]);
    setPublicacoes(lista);
    setEpisodios(eps);
    setCarregando(false);
  }, [id]);

  useEffect(() => {
    setCarregando(true);
    recarregar();
    const unsubPub = subscribePublicacoes(recarregar);
    const unsubPod = subscribePodcasts(recarregar);
    return () => { unsubPub(); unsubPod(); };
  }, [recarregar]);

  // ---- Agregar todos os materiais ----
  const todosItens = useMemo<ItemMaterial[]>(() => {
    const itens: ItemMaterial[] = [];

    // 1. Oficiais curados
    for (const m of MATERIALS.filter((m) => m.disciplineId === id)) {
      const kind: ItemMaterial["kind"] =
        m.type === "pdf" ? "pdf" :
        m.type === "doc" ? "pdf" :
        m.type === "image" ? "imagem" :
        "link";
      itens.push({
        id: m.id,
        titulo: m.title,
        tipo: "curado",
        kind,
        url: m.url,
        etapa: objetivoDoTitulo(m.title),
        curado: m,
      });
    }

    // 2. Episódios de podcast
    for (const ep of episodios) {
      itens.push({
        id: `pod:${ep.id}`,
        titulo: ep.titulo,
        tipo: "podcast",
        kind: "audio",
        url: ep.url,
        etapa: objetivoDoEpisodio(ep.objetivo),
        podcast: ep,
      });
    }

    // 3. Publicações da turma
    for (const p of publicacoes) {
      const kind = kindDaPublicacao(p);
      itens.push({
        id: p.id,
        titulo: p.titulo || p.descricao || "Sem título",
        tipo: "publicacao",
        kind,
        ...(p.url ? { url: p.url } : {}),
        ...(p.conteudo ? { conteudo: p.conteudo } : {}),
        etapa: p.etapa,
        autor: `${p.autor_nome}${p.autor_polo ? ` · ${p.autor_polo}` : ""}`,
        publicacao: p,
      });
    }

    return itens;
  }, [id, publicacoes, episodios]);

  // ---- Filtros ----
  const itensFiltrados = useMemo(() => {
    return todosItens
      .filter((item) => {
        if (filtroObjetivo !== "todas" && item.etapa !== filtroObjetivo) return false;
        if (filtroTipo === "oficiais" && item.tipo !== "curado") return false;
        if (filtroTipo !== "todos" && filtroTipo !== "oficiais" && item.kind !== filtroTipo) return false;
        if (busca) {
          const s = busca.toLowerCase();
          if (!item.titulo.toLowerCase().includes(s) && !(item.autor || "").toLowerCase().includes(s)) return false;
        }
        return true;
      })
      .sort((a, b) => prioridade(a.kind) - prioridade(b.kind));
  }, [todosItens, filtroObjetivo, filtroTipo, busca]);

  // ---- Estudados ----
  const alternarEstudado = useCallback(
    (itemId: string) => {
      setEstudados((prev) => {
        const next = { ...prev, [itemId]: !prev[itemId] };
        if (!next[itemId]) delete next[itemId];
        salvarEstudados(id, next);
        return next;
      });
    },
    [id],
  );

  const totalEstudados = useMemo(() => {
    let n = 0;
    for (const item of todosItens) if (estudados[item.id]) n++;
    return n;
  }, [todosItens, estudados]);

  // ---- Excluir ----
  const handleExcluir = async (item: ItemMaterial) => {
    if (!item.publicacao) return;

    // Se é o autor, exclui direto
    if (identidade && item.publicacao.autor_local_id === identidade.autorLocalId) {
      const r = await excluirPublicacao(item.publicacao);
      if (!r.ok) {
        toast.error(r.error || "Não foi possível excluir.");
        return;
      }
      toast.success("Material excluído.");
      recarregar();
      return;
    }

    // Senão, pede senha admin
    const senha = prompt("Digite a senha de administrador para excluir:");
    if (senha === SENHA_DEV) {
      const r = await excluirPublicacao(item.publicacao);
      if (!r.ok) {
        toast.error(r.error || "Não foi possível excluir.");
        return;
      }
      toast.success("Material excluído (via admin).");
      recarregar();
    } else if (senha !== null) {
      toast.error("Senha incorreta.");
    }
  };

  // ---- Enviar ----
  const enviarArquivo = async () => {
    if (!identidade) {
      toast.error("Entre com nome e polo para publicar.");
      return;
    }
    if (titulo.trim().length < 3) {
      toast.error("Dê um título ao material.");
      return;
    }
    if (!arquivo) {
      toast.error("Selecione o arquivo.");
      return;
    }
    if (arquivo.size > LIMITE_ARQUIVO_MB * 1024 * 1024) {
      toast.error(`Arquivo de ${(arquivo.size / 1048576).toFixed(0)}MB: o servidor aceita até ${LIMITE_ARQUIVO_MB}MB.`);
      return;
    }
    setEnviando(true);
    try {
      let final: File = arquivo;
      const kind = kindDoArquivo(arquivo);
      if (kind === "audio" && otimSuportado !== false && arquivo.size >= 3 * 1024 * 1024) {
        setStatusEnvio("Deixando o áudio mais leve...");
        const leve = await otimizarAudio(arquivo, (_f, pct) => setStatusEnvio(`Comprimindo... ${pct}%`));
        if (leve) {
          final = new File([leve.blob], leve.nome, { type: leve.mime });
          setStatusEnvio(`Enviando versão leve (${leve.economiaPct}% menor)...`);
        } else {
          setStatusEnvio("Enviando...");
        }
      } else {
        setStatusEnvio("Enviando...");
      }
      const r = await publicarArquivo(
        { disciplinaId: id, titulo: titulo.trim(), descricao: descricao.trim(), ident: identidade, etapa: objetivo },
        final,
      );
      if (!r.ok) {
        toast.error(r.error || "Falha ao publicar.");
        return;
      }
      toast.success(r.kind === "audio" ? "Áudio publicado como episódio! 🎧" : "Material publicado! ✅");
      setTitulo("");
      setDescricao("");
      setArquivo(null);
      setObjetivo("Geral");
      setFormAberto(false);
      if (objetivo !== "Geral") setFiltroObjetivo(objetivo);
      recarregar();
    } finally {
      setEnviando(false);
      setStatusEnvio("");
    }
  };

  if (!disciplina) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center">
        <div className="text-center">
          <p className="font-bold text-[#0A3D52]/40 uppercase tracking-widest">Disciplina não encontrada</p>
          <Link to="/materials" className="text-[#D4941E] text-sm font-bold mt-2 inline-block">
            ← Voltar
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#0A3D52] pb-24 md:pb-8">
      {/* Header */}
      <nav className="text-white px-4 py-4 shadow-md sticky top-0 z-40" style={{ background: disciplina.cor }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Sheet>
              <SheetTrigger asChild>
                <button className="p-2 hover:bg-white/10 rounded-xl transition-colors md:hidden cursor-pointer">
                  <Menu className="w-6 h-6 text-white/80" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="bg-[#0A3D52] text-white border-[#D4941E]/20 p-0">
                <AppMobileMenu />
              </SheetContent>
            </Sheet>
            <div className="flex items-center gap-3">
              <Link to="/materials" className="hover:bg-white/10 p-2 rounded-full transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{disciplina.icone}</span>
                  <h1 className="font-bold text-lg uppercase tracking-tight">
                    {disciplina.codigo}
                  </h1>
                </div>
                <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">
                  {disciplina.nome} · {todosItens.length} materiais
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AppDesktopNav />
            <button
              onClick={() => window.open(`/publicacoes?tipo=podcast`, "_blank")}
              className="flex items-center gap-1.5 bg-white/20 text-white px-3 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white/30 transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" /> Compartilhar
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Progresso */}
        {todosItens.length > 0 && (
          <div className="bg-white rounded-2xl border border-[#0A3D52]/10 px-4 py-3 mb-4">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-[#0A3D52]/50 mb-1.5">
              <span>Meu progresso</span>
              <span>{totalEstudados} de {todosItens.length} estudados</span>
            </div>
            <div className="h-2 rounded-full bg-[#0A3D52]/10 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.round((totalEstudados / todosItens.length) * 100)}%`,
                  background: disciplina.cor,
                }}
              />
            </div>
          </div>
        )}

        {/* Botão enviar */}
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setFormAberto((v) => !v)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest cursor-pointer transition-all"
            style={{ background: disciplina.cor, color: "white" }}
          >
            {formAberto ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            {formAberto ? "Fechar" : "Enviar material"}
          </button>
        </div>

        {/* Formulário */}
        {formAberto && (
          <div className="bg-white rounded-2xl border-2 border-dashed p-4 space-y-3 mb-4" style={{ borderColor: `${disciplina.cor}40` }}>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#0A3D52]/50">
              Compartilhar com a turma · {disciplina.nome}
            </p>
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Título do material"
              maxLength={120}
              disabled={enviando}
              className="w-full bg-[#F5F7FA] rounded-xl px-3 py-2.5 text-sm font-bold text-[#0A3D52] placeholder:text-[#0A3D52]/30 focus:ring-2 outline-none"
              style={{ "--tw-ring-color": disciplina.cor } as React.CSSProperties}
            />
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center gap-1.5 bg-[#F5F7FA] rounded-xl px-3 py-2.5 text-xs font-bold text-[#0A3D52]/60">
                Objetivo
                <select
                  value={objetivo}
                  onChange={(e) => setObjetivo(e.target.value as EtapaPublicacao)}
                  disabled={enviando}
                  className="bg-transparent font-black text-[#0A3D52] outline-none flex-1 cursor-pointer"
                >
                  {ETAPAS.map((et) => (
                    <option key={et} value={et}>{et === "Geral" ? "Geral" : et}</option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 shrink-0" />
              </label>
              <label
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-black uppercase cursor-pointer transition-all",
                  arquivo
                    ? "bg-[#27AE60]/10 text-[#27AE60] border border-[#27AE60]/30"
                    : "bg-[#0A3D52] text-white",
                )}
              >
                <FileUp className="w-4 h-4" />
                {arquivo ? `${arquivo.name.slice(0, 18)}${arquivo.name.length > 18 ? "…" : ""}` : "Escolher arquivo"}
                <input type="file" className="hidden" disabled={enviando} onChange={(e) => setArquivo(e.target.files?.[0] ?? null)} />
              </label>
            </div>
            {arquivo && (
              <p className="text-[10px] font-bold text-[#0A3D52]/50 uppercase">
                {(arquivo.size / 1048576).toFixed(1)} MB · {ROTULO_KIND[kindDoArquivo(arquivo)]} · limite {LIMITE_ARQUIVO_MB}MB
              </p>
            )}
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descrição (opcional)"
              rows={2}
              maxLength={500}
              disabled={enviando}
              className="w-full bg-[#F5F7FA] rounded-xl px-3 py-2.5 text-sm font-medium text-[#0A3D52] placeholder:text-[#0A3D52]/30 focus:ring-2 outline-none resize-none"
            />
            <button
              onClick={enviarArquivo}
              disabled={enviando}
              className="w-full text-white py-3 rounded-xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
              style={{ background: disciplina.cor }}
            >
              {enviando && <Loader2 className="w-4 h-4 animate-spin" />}
              {enviando ? statusEnvio || "Enviando..." : "Publicar material"}
            </button>
          </div>
        )}

        {/* Busca */}
        <div className="bg-white p-3 rounded-2xl border border-[#0A3D52]/10 shadow-sm mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0A3D52]/30" />
            <input
              type="text"
              placeholder="Buscar material..."
              className="w-full bg-[#F5F7FA] border-none rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 outline-none"
              style={{ "--tw-ring-color": disciplina.cor } as React.CSSProperties}
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
        </div>

        {/* Filtros por objetivo */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 mb-3">
          {(["todas", ...ETAPAS] as const).map((et) => {
            const qtd = et === "todas"
              ? todosItens.length
              : todosItens.filter((i) => i.etapa === et).length;
            if (et !== "todas" && qtd === 0) return null;
            return (
              <button
                key={et}
                onClick={() => setFiltroObjetivo(et)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all shrink-0 border cursor-pointer",
                  filtroObjetivo === et
                    ? "text-white border-transparent"
                    : "bg-white text-[#0A3D52]/50 border-[#0A3D52]/10",
                )}
                style={filtroObjetivo === et ? { background: disciplina.cor } : {}}
              >
                {et === "todas" ? `Todos (${qtd})` : `${et} (${qtd})`}
              </button>
            );
          })}
        </div>

        {/* Filtros por tipo */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 mb-4">
          {([
            { v: "todos", l: "Todos" },
            { v: "oficiais", l: "📚 Oficiais" },
            { v: "audio", l: "🎧 Áudio" },
            { v: "video", l: "🎬 Vídeo" },
            { v: "pdf", l: "📄 Docs" },
            { v: "imagem", l: "🖼️ Imagens" },
            { v: "nota", l: "📝 Notas" },
          ] as const).map((t) => (
            <button
              key={t.v}
              onClick={() => setFiltroTipo(t.v)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all shrink-0 border cursor-pointer",
                filtroTipo === t.v
                  ? "bg-[#0A3D52] text-white border-[#0A3D52]"
                  : "bg-white text-[#0A3D52]/50 border-[#0A3D52]/10",
              )}
            >
              {t.l}
            </button>
          ))}
        </div>

        {/* Lista */}
        {carregando ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-[#0A3D52]/10 p-4 animate-pulse">
                <div className="h-3 bg-[#0A3D52]/10 rounded w-1/3 mb-2" />
                <div className="h-3 bg-[#0A3D52]/10 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : itensFiltrados.length === 0 ? (
          <div className="bg-[#F5F7FA] p-8 rounded-3xl border border-dashed border-[#0A3D52]/10 text-center">
            <FileText className="w-10 h-10 mx-auto mb-3 text-[#0A3D52]/20" />
            <p className="font-bold text-xs uppercase tracking-widest text-[#0A3D52]/40">
              Nenhum material aqui ainda
            </p>
            <button
              onClick={() => setFormAberto(true)}
              className="inline-block mt-4 text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] cursor-pointer"
              style={{ background: disciplina.cor }}
            >
              Enviar material
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {itensFiltrados.map((item) => (
              <CardMaterial key={item.id} item={item} cor={disciplina.cor} estudados={estudados} alternarEstudado={alternarEstudado} onExcluir={handleExcluir} identidade={identidade} />
            ))}
          </div>
        )}
      </main>
      <AppBottomNav />
    </div>
  );
}

// ============================================================
// Card de material
// ============================================================
function CardMaterial({
  item,
  cor,
  estudados,
  alternarEstudado,
  onExcluir,
  identidade,
}: {
  item: ItemMaterial;
  cor: string;
  estudados: Record<string, boolean>;
  alternarEstudado: (id: string) => void;
  onExcluir: (item: ItemMaterial) => void;
  identidade: { autorLocalId: string } | null;
}) {
  const isLink = item.kind === "link";
  const isAudio = item.kind === "audio";
  const isVideo = item.kind === "video";
  const isPdf = item.kind === "pdf" || item.kind === "arquivo";
  const isImagem = item.kind === "imagem";
  const marcado = !!estudados[item.id];

  // Pode excluir se é autor OU se é publicação (qualquer um pode pedir exclusão admin)
  const podeExcluir = item.tipo === "publicacao";

  return (
    <div
      className={cn(
        "rounded-2xl border p-4 transition-all flex flex-col",
        marcado ? "border-[#27AE60]/40 bg-[#27AE60]/[0.03]" : "border-[#0A3D52]/10 bg-white",
        isAudio && !marcado && "bg-gradient-to-br from-[#7C3AED]/[0.04] to-white",
        isVideo && !marcado && "bg-gradient-to-br from-[#2563EB]/[0.04] to-white",
      )}
    >
      {/* Cabeçalho */}
      <div className="flex items-start gap-3 mb-2">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0" style={{ background: `${cor}10` }}>
          {isAudio ? "🎧" : isVideo ? "🎬" : isPdf ? "📄" : isImagem ? "🖼️" : "🔗"}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <span className={cn(
              "text-[9px] font-black uppercase px-1.5 py-0.5 rounded",
              isAudio ? "bg-[#7C3AED]/15 text-[#7C3AED]" :
              isVideo ? "bg-[#2563EB]/10 text-[#2563EB]" :
              isPdf ? "bg-[#059669]/10 text-[#059669]" :
              isImagem ? "bg-[#EC4899]/10 text-[#EC4899]" :
              "bg-[#D4941E]/10 text-[#D4941E]",
            )}>
              {EMOJI_KIND[item.kind]} {ROTULO_KIND[item.kind]}
            </span>
            {item.tipo === "curado" && (
              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-[#0A3D52]/5 text-[#0A3D52]/50">
                Oficial
              </span>
            )}
            {item.etapa && item.etapa !== "Geral" && (
              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-[#D4941E]/15 text-[#D4941E]">
                {item.etapa}
              </span>
            )}
          </div>
          {isLink && item.url ? (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-sm text-[#0A3D52] hover:text-[#D4941E] transition-colors leading-tight block line-clamp-2"
            >
              {item.titulo}
            </a>
          ) : (
            <h4 className="font-bold text-sm text-[#0A3D52] leading-tight line-clamp-2">
              {item.titulo}
            </h4>
          )}
          {item.autor && (
            <p className="text-[10px] text-[#0A3D52]/40 font-medium mt-1">{item.autor}</p>
          )}
        </div>

        {/* Check + excluir */}
        <div className="flex flex-col items-center gap-1.5 shrink-0">
          <button
            onClick={() => alternarEstudado(item.id)}
            title={marcado ? "Desmarcar" : "Marcar como estudado"}
            className={cn(
              "w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer",
              marcado
                ? "bg-[#27AE60] border-[#27AE60] text-white"
                : "border-[#0A3D52]/20 text-transparent hover:border-[#27AE60]",
            )}
          >
            <Check className="w-4 h-4" strokeWidth={3} />
          </button>
          {podeExcluir && (
            <button
              onClick={() => {
                if (window.confirm(`Excluir "${item.titulo}"?`)) onExcluir(item);
              }}
              title="Excluir este material"
              className="w-7 h-7 rounded-full flex items-center justify-center text-[#0A3D52]/20 hover:text-[#E74C3C] hover:bg-[#E74C3C]/10 transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Player de áudio */}
      {isAudio && item.url && (
        <div className="mt-1">
          <AudioPlayer url={item.url} cor="#7C3AED" />
          <button
            onClick={() => playAudio(item.url!, { titulo: item.titulo })}
            className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-[#7C3AED] cursor-pointer"
          >
            <Play className="w-3 h-3" /> Ouvir no player global
          </button>
        </div>
      )}

      {/* Vídeo */}
      {isVideo && item.url && (
        <video src={item.url} controls playsInline preload="metadata" className="w-full rounded-xl bg-black aspect-video mt-1" />
      )}

      {/* Imagem */}
      {isImagem && item.url && (
        <a href={item.url} target="_blank" rel="noopener noreferrer" className="block mt-1">
          <img src={item.url} alt={item.titulo} loading="lazy" className="w-full rounded-xl max-h-64 object-cover bg-[#F5F7FA]" />
        </a>
      )}

      {/* PDF/Arquivo */}
      {isPdf && item.url && (
        <div className="flex gap-2 mt-2">
          <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex-1 inline-flex items-center justify-center gap-1.5 bg-[#0A3D52] text-white py-2 rounded-xl font-black text-[10px] uppercase tracking-widest">
            <ExternalLink className="w-3.5 h-3.5" /> Abrir
          </a>
          <a href={item.url} download className="flex-1 inline-flex items-center justify-center gap-1.5 bg-[#F5F7FA] text-[#0A3D52] py-2 rounded-xl font-black text-[10px] uppercase tracking-widest border border-[#0A3D52]/10">
            <Download className="w-3.5 h-3.5" /> Baixar
          </a>
        </div>
      )}

      {/* Nota */}
      {item.kind === "nota" && item.conteudo && (
        <p className="text-xs text-[#0A3D52]/60 font-medium mt-1 whitespace-pre-wrap line-clamp-4">{item.conteudo}</p>
      )}
      {item.kind === "nota" && !item.conteudo && item.url && (
        <a href={item.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#D4941E] mt-1">
          <ExternalLink className="w-3 h-3" /> Abrir anexo
        </a>
      )}
    </div>
  );
}
