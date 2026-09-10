// src/components/DisciplinaMateriais.tsx
// CENTRAL DE MATERIAIS da disciplina: tudo num só lugar, organizado por
// objetivo (AP1/AP2/AP3/AD1/AD2/Geral) — oficiais curados + uploads da turma.
// Aceita qualquer tipo de arquivo (vídeo com player, áudio, PDF, imagem...),
// com check local "já estudei" (só neste navegador, sem conta).
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Check,
  ChevronDown,
  Download,
  ExternalLink,
  FileText,
  FileUp,
  Loader2,
  Play,
  Plus,
  Share2,
  X,
} from "lucide-react";
import { AudioPlayer } from "./AudioPlayer";
import {
  denunciarPublicacao,
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
import { MATERIALS, type Material } from "@/data/materials";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  disciplinaId: string;
  disciplinaNome?: string;
}

type FiltroTipo = "todos" | "oficiais" | KindMaterial;
type FiltroObjetivo = EtapaPublicacao | "todas";

// ---------- "já estudei" (só local, por navegador) ----------
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
  } catch {
    // ignora (navegador sem espaço)
  }
}

/** Objetivo inferido pelo título (materiais oficiais não têm etapa marcada). */
function objetivoDoTitulo(titulo: string): EtapaPublicacao {
  const m = titulo.toUpperCase().match(/\b(AP3|AP2|AP1|AD2|AD1)\b/);
  if (m?.[1] === "AP1") return "AP1";
  if (m?.[1] === "AP2") return "AP2";
  if (m?.[1] === "AP3") return "AP3";
  if (m?.[1] === "AD1") return "AD1";
  if (m?.[1] === "AD2") return "AD2";
  return "Geral";
}

/** Objetivo da etapa de um episódio de podcast (AP1/AP2/...; resto vira Geral). */
function objetivoDoEpisodio(objetivo?: string): EtapaPublicacao {
  const m = (objetivo || "").toUpperCase().match(/\b(AP3|AP2|AP1|AD2|AD1)\b/);
  if (m?.[1] === "AP1") return "AP1";
  if (m?.[1] === "AP2") return "AP2";
  if (m?.[1] === "AP3") return "AP3";
  if (m?.[1] === "AD1") return "AD1";
  if (m?.[1] === "AD2") return "AD2";
  return "Geral";
}

const ROTULO_KIND: Record<KindMaterial, string> = {
  audio: "Áudio",
  video: "Vídeo",
  pdf: "Documento",
  imagem: "Imagem",
  arquivo: "Arquivo",
  nota: "Nota",
};

const EMOJI_KIND: Record<KindMaterial, string> = {
  audio: "🎧",
  video: "🎬",
  pdf: "📄",
  imagem: "🖼️",
  arquivo: "📎",
  nota: "📝",
};

function iconeCurado(type: Material["type"]): string {
  switch (type) {
    case "pdf":
      return "📄";
    case "doc":
      return "📝";
    case "image":
      return "🖼️";
    default:
      return "🔗";
  }
}

export function DisciplinaMateriais({ disciplinaId, disciplinaNome }: Props) {
  const [publicacoes, setPublicacoes] = useState<Publicacao[]>([]);
  const [episodios, setEpisodios] = useState<Podcast[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtroObjetivo, setFiltroObjetivo] = useState<FiltroObjetivo>("todas");
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>("todos");
  const [estudados, setEstudados] = useState<Record<string, boolean>>(() =>
    typeof window === "undefined" ? {} : lerEstudados(disciplinaId),
  );
  const identidade = useMemo(() => getIdentidade(), []);

  // ---- formulário de envio ----
  const [formAberto, setFormAberto] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [objetivo, setObjetivo] = useState<EtapaPublicacao>("Geral");
  const [descricao, setDescricao] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [statusEnvio, setStatusEnvio] = useState("");
  const [otimSuportado, setOtimSuportado] = useState<boolean | null>(null);

  useEffect(() => {
    suportaOtimizacao()
      .then(setOtimSuportado)
      .catch(() => setOtimSuportado(false));
  }, []);

  useEffect(() => {
    setEstudados(lerEstudados(disciplinaId));
  }, [disciplinaId]);

  const materiaisCurados = useMemo(
    () => MATERIALS.filter((m) => m.disciplineId === disciplinaId),
    [disciplinaId],
  );

  const recarregar = useCallback(async () => {
    const [lista, eps] = await Promise.all([
      listPublicacoes(disciplinaId),
      listPodcasts(disciplinaId).catch(() => [] as Podcast[]),
    ]);
    setPublicacoes(lista);
    setEpisodios(eps);
    setCarregando(false);
  }, [disciplinaId]);

  useEffect(() => {
    setCarregando(true);
    recarregar();
    const unsubPub = subscribePublicacoes(recarregar);
    const unsubPod = subscribePodcasts(recarregar);
    return () => {
      unsubPub();
      unsubPod();
    };
  }, [recarregar]);

  const alternarEstudado = useCallback(
    (id: string) => {
      setEstudados((prev) => {
        const next = { ...prev, [id]: !prev[id] };
        if (!next[id]) delete next[id];
        salvarEstudados(disciplinaId, next);
        return next;
      });
    },
    [disciplinaId],
  );

  // ---- filtros ----
  const pubsFiltradas = useMemo(() => {
    return publicacoes.filter((p) => {
      if (filtroObjetivo !== "todas" && (p.etapa ?? "Geral") !== filtroObjetivo) return false;
      if (filtroTipo === "oficiais") return false;
      if (filtroTipo !== "todos" && kindDaPublicacao(p) !== filtroTipo) return false;
      return true;
    });
  }, [publicacoes, filtroObjetivo, filtroTipo]);

  // Episódios de podcast da disciplina (tabela podcasts) — entram na central como áudio
  const episodiosFiltrados = useMemo(() => {
    return episodios.filter((ep) => {
      if (filtroObjetivo !== "todas" && objetivoDoEpisodio(ep.objetivo) !== filtroObjetivo)
        return false;
      if (filtroTipo !== "todos" && filtroTipo !== "audio") return false;
      return true;
    });
  }, [episodios, filtroObjetivo, filtroTipo]);

  const curadosFiltrados = useMemo(() => {
    return materiaisCurados.filter((m) => {
      if (filtroObjetivo !== "todas" && objetivoDoTitulo(m.title) !== filtroObjetivo) return false;
      if (filtroTipo === "todos" || filtroTipo === "oficiais") return true;
      // oficiais entram nos tipos correlatos
      if (filtroTipo === "pdf") return m.type === "pdf" || m.type === "doc";
      if (filtroTipo === "imagem") return m.type === "image";
      return false;
    });
  }, [materiaisCurados, filtroObjetivo, filtroTipo]);

  const objetivosComConteudo = useMemo(
    () =>
      ETAPAS.filter(
        (et) =>
          publicacoes.some((p) => (p.etapa ?? "Geral") === et) ||
          episodios.some((ep) => objetivoDoEpisodio(ep.objetivo) === et) ||
          materiaisCurados.some((m) => objetivoDoTitulo(m.title) === et),
      ),
    [publicacoes, episodios, materiaisCurados],
  );

  const totalItens = materiaisCurados.length + publicacoes.length + episodios.length;
  const totalEstudados = useMemo(() => {
    const ids = new Set([
      ...materiaisCurados.map((m) => m.id),
      ...publicacoes.map((p) => p.id),
      ...episodios.map((ep) => `pod:${ep.id}`),
    ]);
    let n = 0;
    for (const id of ids) if (estudados[id]) n++;
    return n;
  }, [materiaisCurados, publicacoes, episodios, estudados]);

  const handleExcluir = async (p: Publicacao) => {
    const r = await excluirPublicacao(p);
    if (!r.ok) {
      toast.error(r.error || "Não foi possível excluir.");
      return;
    }
    toast.success("Publicação excluída.");
    recarregar();
  };

  const handleDenunciar = async (p: Publicacao) => {
    const r = await denunciarPublicacao(p.id);
    if (r.ok) toast.success("Denúncia registrada. Obrigado!");
  };

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
      toast.error(
        `Arquivo de ${(arquivo.size / 1048576).toFixed(0)}MB: o servidor aceita até ${LIMITE_ARQUIVO_MB}MB.`,
      );
      return;
    }
    setEnviando(true);
    try {
      let final: File = arquivo;
      const kind = kindDoArquivo(arquivo);
      if (kind === "audio" && otimSuportado !== false && arquivo.size >= 3 * 1024 * 1024) {
        setStatusEnvio("Deixando o áudio mais leve...");
        const leve = await otimizarAudio(arquivo, (_f, pct) =>
          setStatusEnvio(`Comprimindo... ${pct}%`),
        );
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
        {
          disciplinaId,
          titulo: titulo.trim(),
          descricao: descricao.trim(),
          ident: identidade,
          etapa: objetivo,
        },
        final,
      );
      if (!r.ok) {
        toast.error(r.error || "Falha ao publicar.");
        return;
      }
      toast.success(
        r.kind === "audio" ? "Áudio publicado como episódio! 🎧" : "Material publicado! ✅",
      );
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

  const botaoCheck = (id: string, rotulo: string) => {
    const marcado = !!estudados[id];
    return (
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          alternarEstudado(id);
        }}
        title={marcado ? "Marcado como estudado — toque para desmarcar" : `Marcar "${rotulo}" como estudado`}
        aria-label={marcado ? "Desmarcar como estudado" : "Marcar como estudado"}
        className={cn(
          "shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer",
          marcado
            ? "bg-[#27AE60] border-[#27AE60] text-white"
            : "border-[#0A3D52]/20 text-transparent hover:border-[#27AE60]",
        )}
      >
        <Check className="w-4 h-4" strokeWidth={3} />
      </button>
    );
  };

  return (
    <div className="space-y-4">
{/* Cabeçalho + progresso pessoal */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#D4941E]" /> Materiais
          {totalItens > 0 && (
            <span className="text-[10px] font-black text-[#D4941E] bg-[#D4941E]/10 px-2 py-0.5 rounded-full">
              {totalItens}
            </span>
          )}
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFormAberto((v) => !v)}
            className="inline-flex items-center gap-1.5 bg-[#D4941E] text-[#0A3D52] px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest cursor-hover:scale-[1.03] transition-transform"
          >
            {formAberto ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            {formAberto ? "Fechar" : "Enviar material"}
          </button>
          {totalItens > 0 && (
            <button
              onClick={() => window.open(`/publicacoes?tipo=podcast`, "_blank")}
              className="inline-flex items-center gap-1.5 bg-[#7C3AED] text-white px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-colors"
              aria-label="Compartilhar na comunidade"
            >
              <Share2 className="w-3.5 h-3.5" /> Compartilhar
            </button>
          )}
        </div>
      </div>

      {totalItens > 0 && (
        <div className="bg-white rounded-2xl border border-[#0A3D52]/10 px-4 py-3">
          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-[#0A3D52]/50 mb-1.5">
            <span>Meu progresso</span>
            <span>
              {totalEstudados} de {totalItens} estudados
            </span>
          </div>
          <div className="h-2 rounded-full bg-[#0A3D52]/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#27AE60] transition-all"
              style={{ width: `${Math.round((totalEstudados / totalItens) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Formulário de envio (qualquer tipo de arquivo) */}
      {formAberto && (
        <div className="bg-white rounded-2xl border-2 border-dashed border-[#D4941E]/40 p-4 space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#0A3D52]/50">
            Compartilhar com a turma{disciplinaNome ? ` · ${disciplinaNome}` : ""}
          </p>
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Título do material (ex: Resumo AP1 em vídeo)"
            maxLength={120}
            disabled={enviando}
            className="w-full bg-[#F5F7FA] rounded-xl px-3 py-2.5 text-sm font-bold text-[#0A3D52] placeholder:text-[#0A3D52]/30 focus:ring-2 focus:ring-[#D4941E] outline-none"
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
                  <option key={et} value={et}>
                    {et === "Geral" ? "Geral" : et}
                  </option>
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
              {arquivo
                ? `${arquivo.name.slice(0, 18)}${arquivo.name.length > 18 ? "…" : ""}`
                : "Escolher arquivo"}
              <input
                type="file"
                className="hidden"
                disabled={enviando}
                onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>
          {arquivo && (
            <p className="text-[10px] font-bold text-[#0A3D52]/50 uppercase">
              {(arquivo.size / 1048576).toFixed(1)} MB ·{" "}
              {ROTULO_KIND[kindDoArquivo(arquivo)]} · limite {LIMITE_ARQUIVO_MB}MB
              {kindDoArquivo(arquivo) === "audio" &&
                arquivo.size >= 3 * 1024 * 1024 &&
                otimSuportado !== false &&
                " · será comprimido no teu aparelho"}
            </p>
          )}
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Descrição (opcional)"
            rows={2}
            maxLength={500}
            disabled={enviando}
            className="w-full bg-[#F5F7FA] rounded-xl px-3 py-2.5 text-sm font-medium text-[#0A3D52] placeholder:text-[#0A3D52]/30 focus:ring-2 focus:ring-[#D4941E] outline-none resize-none"
          />
          <button
            onClick={enviarArquivo}
            disabled={enviando}
            className="w-full bg-[#0A3D52] text-white py-3 rounded-xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
          >
            {enviando && <Loader2 className="w-4 h-4 animate-spin" />}
            {enviando ? statusEnvio || "Enviando..." : "Publicar material"}
          </button>
          <p className="text-[10px] text-[#0A3D52]/40 font-medium text-center">
            Vídeo, áudio, PDF, slides, imagem — tudo fica salvo para a turma estudar.
          </p>
        </div>
      )}

      {/* Filtro por objetivo */}
      {objetivosComConteudo.length > 0 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {(["todas", ...ETAPAS] as const).map((et) => {
            const qtd =
              et === "todas"
                ? totalItens
                : publicacoes.filter((p) => (p.etapa ?? "Geral") === et).length +
                  episodios.filter((ep) => objetivoDoEpisodio(ep.objetivo) === et).length +
                  materiaisCurados.filter((m) => objetivoDoTitulo(m.title) === et).length;
            if (et !== "todas" && qtd === 0) return null;
            return (
              <button
                key={et}
                onClick={() => setFiltroObjetivo(et)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all shrink-0 border cursor-pointer",
                  filtroObjetivo === et
                    ? "bg-[#D4941E] text-[#0A3D52] border-[#D4941E]"
                    : "bg-white text-[#0A3D52]/50 border-[#0A3D52]/10 hover:border-[#D4941E]/30",
                )}
              >
                {et === "todas" ? `Todos (${qtd})` : `${et} (${qtd})`}
              </button>
            );
          })}
        </div>
      )}

      {/* Filtro por tipo */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {(
          [
            { v: "todos", l: "Todos" },
            { v: "oficiais", l: "📚 Oficiais" },
            { v: "video", l: "🎬 Vídeo" },
            { v: "audio", l: "🎧 Áudio" },
            { v: "pdf", l: "📄 Docs" },
            { v: "imagem", l: "🖼️ Imagens" },
            { v: "nota", l: "📝 Notas" },
          ] as const
        ).map((t) => (
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
            <div
              key={i}
              className="bg-white rounded-2xl border border-[#0A3D52]/10 p-4 animate-pulse"
            >
              <div className="h-3 bg-[#0A3D52]/10 rounded w-1/3 mb-2" />
              <div className="h-3 bg-[#0A3D52]/10 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : curadosFiltrados.length === 0 &&
        pubsFiltradas.length === 0 &&
        episodiosFiltrados.length === 0 ? (
        <div className="bg-[#F5F7FA] p-8 rounded-3xl border border-dashed border-[#0A3D52]/10 text-center">
          <FileText className="w-10 h-10 mx-auto mb-3 text-[#0A3D52]/20" />
          <p className="font-bold text-xs uppercase tracking-widest text-[#0A3D52]/40">
            Nenhum material aqui ainda
          </p>
          <p className="text-sm text-[#0A3D52]/50 mt-1 font-medium">
            Seja a primeira pessoa a compartilhar.
          </p>
          <button
            onClick={() => setFormAberto(true)}
            className="inline-block mt-4 bg-[#D4941E] text-[#0A3D52] px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] cursor-pointer"
          >
            Enviar material
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* 1. Áudios e Vídeos (em primeiro) */}
          {/* Áudios dos episódios filtrados */}
          {episodiosFiltrados.map((ep) => (
            <CardEpisodio
              key={ep.id}
              ep={ep}
              estudado={!!estudados[`pod:${ep.id}`]}
              botaoCheck={botaoCheck(`pod:${ep.id}`, ep.titulo)}
            />
          ))}

          {/* Áudios e Vídeos das publicações (kind = audio ou video) */}
          {pubsFiltradas
            .filter((p) => kindDaPublicacao(p) === "audio" || kindDaPublicacao(p) === "video")
            .map((p) => (
              <CardUpload
                key={p.id}
                pub={p}
                estudado={!!estudados[p.id]}
                botaoCheck={botaoCheck(p.id, p.titulo)}
                ehAutor={!!identidade && p.autor_local_id === identidade.autorLocalId}
                aoExcluir={() => handleExcluir(p)}
                aoDenunciar={() => handleDenunciar(p)}
              />
            ))}

          {/* 2. Oficiais (curados) */}
          {curadosFiltrados.map((material) => (
            <div
              key={material.id}
              className={cn(
                "bg-white rounded-2xl border p-4 transition-all flex flex-col",
                estudados[material.id]
                  ? "border-[#27AE60]/40 bg-[#27AE60]/[0.03]"
                  : "border-[#0A3D52]/10",
              )}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#D4941E]/10 flex items-center justify-center text-lg shrink-0">
                  {iconeCurado(material.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                    <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-[#0A3D52]/5 text-[#0A3D52]/50">
                      Oficial
                    </span>
                    <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-[#D4941E]/15 text-[#D4941E]">
                      {objetivoDoTitulo(material.title)}
                    </span>
                  </div>
                  <a
                    href={material.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-sm text-[#0A3D52] hover:text-[#D4941E] transition-colors leading-tight block"
                  >
                    {material.title}
                  </a>
                </div>
                {botaoCheck(material.id, material.title)}
                <a
                  href={material.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Abrir material"
                  className="shrink-0 mt-1 text-[#0A3D52]/20 hover:text-[#D4941E] transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))}

          {/* 3. Uploads da turma (pdfs, imagens, notas, arquivos diversos) */}
          {pubsFiltradas
            .filter((p) => kindDaPublicacao(p) !== "audio" && kindDaPublicacao(p) !== "video")
            .map((p) => (
              <CardUpload
                key={p.id}
                pub={p}
                estudado={!!estudados[p.id]}
                botaoCheck={botaoCheck(p.id, p.titulo)}
                ehAutor={!!identidade && p.autor_local_id === identidade.autorLocalId}
                aoExcluir={() => handleExcluir(p)}
                aoDenunciar={() => handleDenunciar(p)}
              />
            ))}

          {/* 4. Episódios de podcast da disciplina */}
          {episodiosFiltrados.map((ep) => (
            <CardEpisodio
              key={ep.id}
              ep={ep}
              estudado={!!estudados[`pod:${ep.id}`]}
              botaoCheck={botaoCheck(`pod:${ep.id}`, ep.titulo)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- card de episódio (podcast da disciplina, com check local) ----------
function CardEpisodio({
  ep,
  estudado,
  botaoCheck,
}: {
  ep: Podcast;
  estudado: boolean;
  botaoCheck: ReactNode;
}) {
  const dataFmt = (() => {
    try {
      return new Date(ep.criado_em).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      });
    } catch {
      return "";
    }
  })();
  return (
    <div
      className={cn(
        "rounded-2xl border p-4 transition-all flex flex-col bg-gradient-to-br from-[#7C3AED]/[0.07] to-white",
        estudado ? "border-[#27AE60]/40" : "border-[#7C3AED]/20",
      )}
    >
      <div className="flex items-start gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/15 flex items-center justify-center text-lg shrink-0">
          🎧
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-[#7C3AED]/15 text-[#7C3AED]">
              Episódio
            </span>
            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-[#D4941E]/15 text-[#D4941E]">
              {objetivoDoEpisodio(ep.objetivo)}
            </span>
            {dataFmt && (
              <span className="text-[9px] font-bold text-[#0A3D52]/30">{dataFmt}</span>
            )}
            {ep.duracao_seg ? (
              <span className="text-[9px] font-bold text-[#0A3D52]/30">
                {formatarDuracao(ep.duracao_seg)}
              </span>
            ) : null}
          </div>
          <h4 className="font-bold text-sm text-[#0A3D52] leading-tight">{ep.titulo}</h4>
          {ep.descricao ? (
            <p className="text-xs text-[#0A3D52]/50 font-medium mt-0.5 line-clamp-2">
              {ep.descricao}
            </p>
          ) : null}
        </div>
        {botaoCheck}
      </div>
      <div className="mt-auto pt-1">
        <AudioPlayer url={ep.url} cor="#7C3AED" />
      </div>
    </div>
  );
}

// ---------- card de upload (prévia pelo tipo) ----------
function CardUpload({
  pub,
  estudado,
  botaoCheck,
  ehAutor,
  aoExcluir,
  aoDenunciar,
}: {
  pub: Publicacao;
  estudado: boolean;
  botaoCheck: ReactNode;
  ehAutor: boolean;
  aoExcluir: () => void;
  aoDenunciar: () => void;
}) {
  const kind = kindDaPublicacao(pub);
  const assunto = pub.titulo || pub.descricao || "Sem título";
  const dataFmt = (() => {
    try {
      return new Date(pub.criado_em).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      });
    } catch {
      return "";
    }
  })();

  return (
    <div
      className={cn(
        "bg-white rounded-2xl border p-4 transition-all flex flex-col",
        estudado ? "border-[#27AE60]/40 bg-[#27AE60]/[0.03]" : "border-[#0A3D52]/10",
      )}
    >
      <div className="flex items-start gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-[#0A3D52]/5 flex items-center justify-center text-lg shrink-0">
          {EMOJI_KIND[kind]}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-[#2563EB]/10 text-[#2563EB]">
              {ROTULO_KIND[kind]}
            </span>
            {pub.etapa && pub.etapa !== "Geral" && (
              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-[#D4941E]/15 text-[#D4941E]">
                {pub.etapa}
              </span>
            )}
            {dataFmt && (
              <span className="text-[9px] font-bold text-[#0A3D52]/30">{dataFmt}</span>
            )}
          </div>
          <h4 className="font-bold text-sm text-[#0A3D52] leading-tight">{assunto}</h4>
          {pub.descricao && kind !== "nota" && (
            <p className="text-xs text-[#0A3D52]/50 font-medium mt-0.5 line-clamp-2">
              {pub.descricao}
            </p>
          )}
          <p className="text-[10px] text-[#0A3D52]/40 font-medium mt-1">
            {pub.autor_nome}
            {pub.autor_polo ? ` · ${pub.autor_polo}` : ""}
          </p>
        </div>
        {botaoCheck}
      </div>

      {/* Prévia conforme o tipo */}
      {kind === "video" && pub.url && (
        <video
          src={pub.url}
          controls
          playsInline
          preload="metadata"
          className="w-full rounded-xl bg-black aspect-video mt-1"
        />
      )}
      {kind === "imagem" && pub.url && (
        <a href={pub.url} target="_blank" rel="noopener noreferrer" className="block mt-1">
          <img
            src={pub.url}
            alt={assunto}
            loading="lazy"
            className="w-full rounded-xl max-h-72 object-cover bg-[#F5F7FA]"
          />
        </a>
      )}
      {kind === "audio" && pub.url && (
        <div className="mt-1">
          <AudioPlayer url={pub.url} cor="#7C3AED" />
          <button
            onClick={() => playAudio(pub.url, { titulo: assunto })}
            className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-[#7C3AED] cursor-pointer"
          >
            <Play className="w-3 h-3" /> Ouvir no player global
          </button>
        </div>
      )}
      {(kind === "pdf" || kind === "arquivo") && pub.url && (
        <div className="flex gap-2 mt-1">
          <a
            href={pub.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-1.5 bg-[#0A3D52] text-white py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Abrir
          </a>
          <a
            href={pub.url}
            download
            className="flex-1 inline-flex items-center justify-center gap-1.5 bg-[#F5F7FA] text-[#0A3D52] py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest border border-[#0A3D52]/10"
          >
            <Download className="w-3.5 h-3.5" /> Baixar
          </a>
        </div>
      )}
      {kind === "nota" && pub.conteudo && (
        <p className="text-xs text-[#0A3D52]/70 font-medium mt-1 whitespace-pre-wrap line-clamp-6">
          {pub.conteudo}
        </p>
      )}

      {/* Ações discretas */}
      <div className="flex items-center justify-end gap-3 mt-auto pt-2">
        {!ehAutor ? (
          <button
            onClick={aoDenunciar}
            className="text-[9px] font-black uppercase tracking-widest text-[#0A3D52]/25 hover:text-[#E74C3C] cursor-pointer"
          >
            Denunciar
          </button>
        ) : (
          <button
            onClick={() => {
              if (window.confirm("Excluir este material?")) aoExcluir();
            }}
            className="text-[9px] font-black uppercase tracking-widest text-[#0A3D52]/25 hover:text-[#E74C3C] cursor-pointer"
          >
            Excluir
          </button>
        )}
      </div>
    </div>
  );
}
