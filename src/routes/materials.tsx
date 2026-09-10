// src/routes/materials.tsx
// CENTRAL DE MATERIAIS GLOBAL — todos os materiais organizados por disciplina.
// Cada disciplina tem sua seção com header colorido, cards ordenados
// (áudio/vídeo primeiro, depois docs, depois links externos).
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  BookOpen,
  Download,
  ExternalLink,
  FileText,
  Headphones,
  Loader2,
  Menu,
  Search,
  Share2,
  Video,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AppBottomNav, AppDesktopNav, AppMobileMenu } from "@/components/AppNav";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AudioPlayer } from "@/components/AudioPlayer";
import { MATERIALS, type Material } from "@/data/materials";
import { disciplinas } from "@/data/disciplines";
import {
  ETAPAS,
  kindDaPublicacao,
  listPublicacoes,
  subscribePublicacoes,
  type Publicacao,
} from "@/lib/publicacoesService";
import {
  formatarDuracao,
  listPodcasts,
  subscribePodcasts,
  type Podcast,
} from "@/lib/podcastService";
import { cn } from "@/lib/utils";

// ============================================================
// Tipos auxiliares
// ============================================================
type FiltroTipo = "todos" | "audio" | "video" | "docs" | "links";

interface ItemMaterial {
  id: string;
  titulo: string;
  tipo: "curado" | "podcast" | "publicacao";
  kind: "link" | "pdf" | "audio" | "video" | "arquivo" | "nota" | "imagem";
  url?: string;
  conteudo?: string;
  etapa?: string;
  autor?: string;
  podcast?: Podcast;
  publicacao?: Publicacao;
  curado?: Material;
}

interface SecaoDisciplina {
  id: string;
  nome: string;
  codigo: string;
  cor: string;
  icone: string;
  itens: ItemMaterial[];
}

// ============================================================
// Helpers
// ============================================================
function objetivoDoTitulo(titulo: string): string {
  const m = titulo.toUpperCase().match(/\b(AP3|AP2|AP1|AD2|AD1)\b/);
  return m?.[1] || "Geral";
}

function objetivoDoEpisodio(objetivo?: string): string {
  const m = (objetivo || "").toUpperCase().match(/\b(AP3|AP2|AP1|AD2|AD1)\b/);
  return m?.[1] || "Geral";
}

function iconeCurado(type: Material["type"]): string {
  switch (type) {
    case "pdf": return "📄";
    case "doc": return "📝";
    case "image": return "🖼️";
    default: return "🔗";
  }
}

function rotuloKind(kind: ItemMaterial["kind"]): string {
  switch (kind) {
    case "audio": return "🎧 Áudio";
    case "video": return "🎬 Vídeo";
    case "pdf": return "📄 Documento";
    case "imagem": return "🖼️ Imagem";
    case "arquivo": return "📎 Arquivo";
    case "nota": return "📝 Nota";
    default: return "🔗 Link";
  }
}

function prioridade(kind: ItemMaterial["kind"]): number {
  if (kind === "audio") return 0;
  if (kind === "video") return 1;
  if (kind === "pdf" || kind === "arquivo") return 2;
  if (kind === "imagem") return 3;
  if (kind === "nota") return 4;
  return 5; // links
}

// ============================================================
// Componente principal
// ============================================================
export const Route = createFileRoute("/materials")({
  component: MaterialsGlobal,
  head: () => ({
    meta: [{ title: "Materiais de Estudo | Rota da Formatura" }],
  }),
});

function MaterialsGlobal() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>("todos");
  const [publicacoes, setPublicacoes] = useState<Publicacao[]>([]);
  const [episodios, setEpisodios] = useState<Podcast[]>([]);
  const [carregando, setCarregando] = useState(true);

  const recarregar = useCallback(async () => {
    const [pubs, pods] = await Promise.all([
      listPublicacoes().catch(() => [] as Publicacao[]),
      listPodcasts().catch(() => [] as Podcast[]),
    ]);
    setPublicacoes(pubs);
    setEpisodios(pods);
    setCarregando(false);
  }, []);

  useEffect(() => {
    recarregar();
    const unsubPub = subscribePublicacoes(recarregar);
    const unsubPod = subscribePodcasts(recarregar);
    return () => { unsubPub(); unsubPod(); };
  }, [recarregar]);

  // ---- Agregar tudo por disciplina ----
  const secoes = useMemo<SecaoDisciplina[]>(() => {
    const map = new Map<string, SecaoDisciplina>();

    // Inicializa seções com todas as disciplinas
    for (const d of disciplinas) {
      map.set(d.id, {
        id: d.id,
        nome: d.nome,
        codigo: d.codigo,
        cor: d.cor,
        icone: d.icone,
        itens: [],
      });
    }

    // 1. Materiais curados (links oficiais, PDFs do CECIERJ etc)
    for (const m of MATERIALS) {
      const sec = map.get(m.disciplineId);
      if (!sec) continue;
      const kind: ItemMaterial["kind"] =
        m.type === "pdf" ? "pdf" :
        m.type === "doc" ? "pdf" :
        m.type === "image" ? "imagem" :
        "link";
      sec.itens.push({
        id: m.id,
        titulo: m.title,
        tipo: "curado",
        kind,
        url: m.url,
        etapa: objetivoDoTitulo(m.title),
        curado: m,
      });
    }

    // 2. Episódios de podcast (tabela podcasts)
    for (const ep of episodios) {
      const sec = map.get(ep.disciplina_id);
      if (!sec) continue;
      sec.itens.push({
        id: `pod:${ep.id}`,
        titulo: ep.titulo,
        tipo: "podcast",
        kind: "audio",
        url: ep.url,
        etapa: objetivoDoEpisodio(ep.objetivo),
        podcast: ep,
      });
    }

    // 3. Publicações da comunidade (uploads, notas)
    for (const p of publicacoes) {
      const sec = map.get(p.disciplina_id);
      if (!sec) continue;
      const kind = kindDaPublicacao(p);
      sec.itens.push({
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

    // Ordena itens dentro de cada disciplina: áudio/vídeo primeiro, depois docs, depois links
    for (const sec of map.values()) {
      sec.itens.sort((a, b) => prioridade(a.kind) - prioridade(b.kind));
    }

    return Array.from(map.values());
  }, [publicacoes, episodios]);

  // ---- Filtro global por tipo ----
  const secoesFiltradas = useMemo(() => {
    return secoes
      .map((sec) => {
        const itens = sec.itens.filter((item) => {
          // Filtro por tipo
          if (filtroTipo !== "todos") {
            if (filtroTipo === "audio" && item.kind !== "audio") return false;
            if (filtroTipo === "video" && item.kind !== "video") return false;
            if (filtroTipo === "docs" && item.kind !== "pdf" && item.kind !== "arquivo") return false;
            if (filtroTipo === "links" && item.kind !== "link") return false;
          }
          // Filtro por busca
          if (searchTerm) {
            const s = searchTerm.toLowerCase();
            return (
              item.titulo.toLowerCase().includes(s) ||
              sec.nome.toLowerCase().includes(s) ||
              sec.codigo.toLowerCase().includes(s)
            );
          }
          return true;
        });
        return { ...sec, itens };
      })
      .filter((sec) => sec.itens.length > 0);
  }, [secoes, filtroTipo, searchTerm]);

  const totalMateriais = useMemo(
    () => secoes.reduce((acc, s) => acc + s.itens.length, 0),
    [secoes],
  );

  const contadores = useMemo(() => {
    let audio = 0, video = 0, docs = 0, links = 0;
    for (const sec of secoes) {
      for (const item of sec.itens) {
        if (item.kind === "audio") audio++;
        else if (item.kind === "video") video++;
        else if (item.kind === "pdf" || item.kind === "arquivo") docs++;
        else links++;
      }
    }
    return { audio, video, docs, links };
  }, [secoes]);

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#0A3D52] pb-24 md:pb-8">
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
              <div>
                <h1 className="font-bold text-lg uppercase tracking-tight">
                  Materiais de Estudo
                </h1>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                  {totalMateriais} itens organizados por disciplina
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <AppDesktopNav />
            <button
              onClick={() => window.open("/publicacoes?tipo=podcast", "_blank")}
              className="flex items-center gap-1.5 bg-[#D4941E] text-[#0A3D52] px-3 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-transform cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" /> Compartilhar
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Resumo */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "🎧 Áudios", value: contadores.audio, color: "#7C3AED" },
            { label: "🎬 Vídeos", value: contadores.video, color: "#2563EB" },
            { label: "📄 Docs", value: contadores.docs, color: "#059669" },
            { label: "🔗 Links", value: contadores.links, color: "#D4941E" },
          ].map((c) => (
            <div
              key={c.label}
              className="bg-white rounded-2xl border border-[#0A3D52]/10 p-4 text-center"
            >
              <p className="text-2xl font-black" style={{ color: c.color }}>
                {c.value}
              </p>
              <p className="text-[9px] font-black uppercase tracking-widest text-[#0A3D52]/40 mt-1">
                {c.label}
              </p>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="bg-white p-4 rounded-2xl border border-[#0A3D52]/10 shadow-sm mb-6 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0A3D52]/30" />
            <input
              type="text"
              placeholder="Buscar por disciplina ou material..."
              className="w-full bg-[#F5F7FA] border-none rounded-xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-[#D4941E] outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {([
              { v: "todos", l: "Todos", q: totalMateriais },
              { v: "audio", l: "🎧 Áudio", q: contadores.audio },
              { v: "video", l: "🎬 Vídeo", q: contadores.video },
              { v: "docs", l: "📄 Docs", q: contadores.docs },
              { v: "links", l: "🔗 Links", q: contadores.links },
            ] as const).map((f) => (
              <button
                key={f.v}
                onClick={() => setFiltroTipo(f.v)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border shrink-0 cursor-pointer",
                  filtroTipo === f.v
                    ? "bg-[#D4941E] text-[#0A3D52] border-[#D4941E]"
                    : "bg-white text-[#0A3D52]/50 border-[#0A3D52]/10 hover:border-[#D4941E]/30",
                )}
              >
                {f.l} ({f.q})
              </button>
            ))}
          </div>
        </div>

        {/* Lista de disciplinas */}
        {carregando ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-3xl border border-[#0A3D52]/10 p-6 animate-pulse">
                <div className="h-4 bg-[#0A3D52]/10 rounded w-1/3 mb-4" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="h-20 bg-[#0A3D52]/5 rounded-2xl" />
                  <div className="h-20 bg-[#0A3D52]/5 rounded-2xl" />
                </div>
              </div>
            ))}
          </div>
        ) : secoesFiltradas.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-[#0A3D52]/20">
            <BookOpen className="w-12 h-12 text-[#0A3D52]/10 mx-auto mb-4" />
            <p className="font-bold text-[#0A3D52]/40 uppercase tracking-widest text-sm">
              Nenhum material encontrado
            </p>
            <p className="text-sm text-[#0A3D52]/50 mt-1 font-medium">
              Tente outro filtro ou busca.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {secoesFiltradas.map((sec) => (
              <Secao key={sec.id} secao={sec} />
            ))}
          </div>
        )}
      </main>
      <AppBottomNav />
    </div>
  );
}

// ============================================================
// Seção de uma disciplina
// ============================================================
function Secao({ secao }: { secao: SecaoDisciplina }) {
  const [expandido, setExpandido] = useState(true);
  const { nome, codigo, cor, icone, itens } = secao;

  return (
    <div className="bg-white rounded-3xl border border-[#0A3D52]/10 shadow-sm overflow-hidden">
      {/* Header da disciplina */}
      <button
        onClick={() => setExpandido((v) => !v)}
        className="w-full flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-[#F5F7FA] transition-colors"
      >
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0"
          style={{ background: `${cor}15` }}
        >
          {icone}
        </div>
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <span
              className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full"
              style={{ background: `${cor}20`, color: cor }}
            >
              {codigo}
            </span>
            <span className="text-[10px] font-bold text-[#0A3D52]/30">
              {itens.length} material{itens.length !== 1 ? "is" : ""}
            </span>
          </div>
          <h2 className="font-black text-base text-[#0A3D52] leading-tight mt-0.5">
            {nome}
          </h2>
        </div>
        <div className="text-[#0A3D52]/20 text-xs font-bold uppercase">
          {expandido ? "▲" : "▼"}
        </div>
      </button>

      {/* Grid de cards */}
      {expandido && (
        <div className="px-5 pb-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {itens.map((item) => (
            <CardMaterial key={item.id} item={item} cor={cor} />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Card de material
// ============================================================
function CardMaterial({ item, cor }: { item: ItemMaterial; cor: string }) {
  const isLink = item.kind === "link";
  const isAudio = item.kind === "audio";
  const isVideo = item.kind === "video";
  const isPdf = item.kind === "pdf" || item.kind === "arquivo";

  const badgeColor = isAudio
    ? "bg-[#7C3AED]/15 text-[#7C3AED]"
    : isVideo
      ? "bg-[#2563EB]/10 text-[#2563EB]"
      : isPdf
        ? "bg-[#059669]/10 text-[#059669]"
        : item.kind === "imagem"
          ? "bg-[#EC4899]/10 text-[#EC4899]"
          : "bg-[#D4941E]/10 text-[#D4941E]";

  return (
    <div
      className={cn(
        "rounded-2xl border border-[#0A3D52]/10 p-4 transition-all flex flex-col",
        isAudio && "bg-gradient-to-br from-[#7C3AED]/[0.04] to-white",
        isVideo && "bg-gradient-to-br from-[#2563EB]/[0.04] to-white",
      )}
    >
      {/* Cabeçalho do card */}
      <div className="flex items-start gap-3 mb-2">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0" style={{ background: `${cor}10` }}>
          {isAudio ? "🎧" : isVideo ? "🎬" : isPdf ? "📄" : item.kind === "imagem" ? "🖼️" : "🔗"}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <span className={cn("text-[9px] font-black uppercase px-1.5 py-0.5 rounded", badgeColor)}>
              {rotuloKind(item.kind)}
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
          {/* Título como link (se tiver URL) ou texto puro */}
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
            <p className="text-[10px] text-[#0A3D52]/40 font-medium mt-1">
              {item.autor}
            </p>
          )}
        </div>
        {isLink && item.url && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Abrir link"
            className="shrink-0 mt-1 text-[#0A3D52]/15 hover:text-[#D4941E] transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>

      {/* Player de áudio */}
      {isAudio && item.url && (
        <div className="mt-1">
          {item.podcast ? (
            <AudioPlayer url={item.url} cor="#7C3AED" />
          ) : (
            <AudioPlayer url={item.url} cor="#7C3AED" />
          )}
        </div>
      )}

      {/* Player de vídeo */}
      {isVideo && item.url && (
        <video
          src={item.url}
          controls
          playsInline
          preload="metadata"
          className="w-full rounded-xl bg-black aspect-video mt-1"
        />
      )}

      {/* Imagem */}
      {item.kind === "imagem" && item.url && (
        <a href={item.url} target="_blank" rel="noopener noreferrer" className="block mt-1">
          <img
            src={item.url}
            alt={item.titulo}
            loading="lazy"
            className="w-full rounded-xl max-h-64 object-cover bg-[#F5F7FA]"
          />
        </a>
      )}

      {/* Botões de PDF/arquivo */}
      {isPdf && item.url && (
        <div className="flex gap-2 mt-2">
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-1.5 bg-[#0A3D52] text-white py-2 rounded-xl font-black text-[10px] uppercase tracking-widest"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Abrir
          </a>
          <a
            href={item.url}
            download
            className="flex-1 inline-flex items-center justify-center gap-1.5 bg-[#F5F7FA] text-[#0A3D52] py-2 rounded-xl font-black text-[10px] uppercase tracking-widest border border-[#0A3D52]/10"
          >
            <Download className="w-3.5 h-3.5" /> Baixar
          </a>
        </div>
      )}

      {/* Nota de texto */}
      {item.kind === "nota" && item.conteudo && (
        <p className="text-xs text-[#0A3D52]/60 font-medium mt-1 whitespace-pre-wrap line-clamp-4">
          {item.conteudo}
        </p>
      )}

      {/* Nota de texto sem conteúdo */}
      {item.kind === "nota" && !item.conteudo && item.url && (
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#D4941E] mt-1"
        >
          <ExternalLink className="w-3 h-3" /> Abrir anexo
        </a>
      )}
    </div>
  );
}
