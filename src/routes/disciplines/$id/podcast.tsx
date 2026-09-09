// src/routes/disciplines/$id/podcast.tsx
// Página dedicada de podcasts por disciplina — URL compartilhável:
// /disciplines/{id}/podcast
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  Headphones,
  Upload,
  Share2,
  Trash2,
  Clock,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  X,
  Loader2,
  Copy,
  Check,
  Music,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AppMobileMenu } from "@/components/AppNav";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { disciplinas } from "@/data/disciplines";
import {
  listPodcasts,
  uploadPodcast,
  deletePodcast,
  subscribePodcasts,
  formatarDuracao,
  type Podcast,
} from "@/lib/podcastService";
import {
  playAudio,
  pauseAudio,
  seekAudio,
  setPlaybackRate,
  skipForward,
  skipBackward,
  subscribeAudio,
  getAudioState,
} from "@/lib/audioContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { track } from "@/lib/metricas";
import { otimizarAudio, suportaOtimizacao } from "@/lib/audioLeve";

export const Route = createFileRoute("/disciplines/$id/podcast")({
  component: DisciplinePodcastPage,
  head: () => ({
    meta: [{ title: "Podcasts | Rota da Formatura" }],
  }),
});

interface ArquivoLote {
  key: string;
  file: File;
  titulo: string;
  objetivo: string;
  descricao: string;
  blob?: Blob;
  economia?: number;
  status?: string;
  erro?: string;
}

const OBJETIVOS = [
  { v: "", l: "Objetivo..." },
  { v: "AP1", l: "AP1" },
  { v: "AP2", l: "AP2" },
  { v: "AP3", l: "AP3" },
  { v: "AD1", l: "AD1" },
  { v: "AD2", l: "AD2" },
  { v: "revisao", l: "Revisão" },
  { v: "conteudo", l: "Aula" },
  { v: "dica", l: "Dica" },
];

function DisciplinePodcastPage() {
  const { id } = useParams({ from: "/disciplines/$id/podcast" });
  const discipline = useMemo(() => disciplinas.find((d) => d.id === id), [id]);

  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [lote, setLote] = useState<ArquivoLote[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ atual: number; total: number; pct: number } | null>(null);
  const [otimizar, setOtimizar] = useState(true);
  const [otimSuportado, setOtimSuportado] = useState<boolean | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [audioState, setAudioState] = useState(getAudioState());
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    return subscribeAudio(() => setAudioState(getAudioState()));
  }, []);

  const recarregar = useCallback(async () => {
    const lista = await listPodcasts(id);
    setPodcasts(lista);
    setCarregando(false);
  }, [id]);

  useEffect(() => {
    recarregar();
    suportaOtimizacao()
      .then(setOtimSuportado)
      .catch(() => setOtimSuportado(false));
    return subscribePodcasts(recarregar);
  }, [recarregar]);

  const onArquivosSelecionados = () => {
    const files = fileRef.current?.files;
    if (!files || files.length === 0) return;
    const novos: ArquivoLote[] = [];
    let rejeitados = 0;
    for (const f of Array.from(files)) {
      if (f.size > 500 * 1024 * 1024) {
        rejeitados++;
        continue;
      }
      const validExts = /\.(mp3|m4a|wav|ogg|oga|opus|aac|wma|mp4|3gp|amr)$/i;
      const mimeOk = f.type === "" || f.type.startsWith("audio/");
      if (!mimeOk && !validExts.test(f.name)) {
        rejeitados++;
        continue;
      }
      if ([...lote, ...novos].some((a) => a.file.name === f.name && a.file.size === f.size)) {
        continue;
      }
      novos.push({
        key: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        file: f,
        titulo: f.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
        objetivo: "",
        descricao: "",
      });
    }
    if (rejeitados > 0) toast.error(`${rejeitados} arquivo(s) rejeitado(s) (formato ou tamanho).`);
    if (novos.length > 0) {
      setLote((l) => [...l, ...novos]);
      toast.success(`${novos.length} audio(s) na fila.`);
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const atualizarItem = (key: string, patch: Partial<ArquivoLote>) =>
    setLote((l) => l.map((a) => (a.key === key ? { ...a, ...patch } : a)));

  const removerItem = (key: string) => setLote((l) => l.filter((a) => a.key !== key));

  const handleUpload = async () => {
    if (lote.length === 0) {
      toast.error("Selecione pelo menos um arquivo.");
      return;
    }
    if (lote.some((a) => !a.titulo.trim())) {
      toast.error("Dê um título para todos os áudios.");
      return;
    }
    setUploading(true);
    const fila = [...lote];
    const total = fila.length;
    let ok = 0;
    const chavesOk = new Set<string>();
    const marca = (key: string, patch: Partial<ArquivoLote>) =>
      setLote((l) => l.map((a) => (a.key === key ? { ...a, ...patch } : a)));
    try {
      for (let i = 0; i < fila.length; i++) {
        const item = fila[i]!;
        marca(item.key, { erro: undefined, status: "preparando..." });
        setUploadProgress({ atual: i + 1, total, pct: Math.round((i / total) * 100) });

        // 1) Versão leve
        let arquivo: File = item.file;
        let economia: number | undefined = item.economia;
        let blobPronto = item.blob;
        if (otimizar && otimSuportado && !blobPronto && item.file.size >= 3 * 1024 * 1024) {
          marca(item.key, { status: "otimizando (deixando mais leve)..." });
          try {
            const leve = await otimizarAudio(item.file, (_fase, pct) => {
              marca(item.key, { status: `otimizando... ${pct}%` });
              setUploadProgress({
                atual: i + 1,
                total,
                pct: Math.round(((i + pct / 200) / total) * 100),
              });
            });
            if (leve) {
              blobPronto = new File([leve.blob], leve.nome, { type: "audio/webm" });
              economia = leve.economiaPct;
              marca(item.key, { blob: blobPronto, economia, status: `leve (${leve.economiaPct}% menor)` });
            } else {
              marca(item.key, { status: "enviando original..." });
            }
          } catch {
            marca(item.key, { status: "enviando original..." });
          }
        }
        if (blobPronto) arquivo = blobPronto as File;

        // 2) Upload com até 3 tentativas
        let result: Awaited<ReturnType<typeof uploadPodcast>> | null = null;
        for (let tent = 1; tent <= 3; tent++) {
          marca(item.key, { status: tent === 1 ? "enviando..." : `tentativa ${tent} de 3...` });
          try {
            result = await uploadPodcast(
              arquivo,
              {
                disciplinaId: id,
                titulo: item.titulo.trim(),
                descricao: item.descricao.trim(),
                objetivo: item.objetivo,
              },
              (pct) =>
                setUploadProgress({
                  atual: i + 1,
                  total,
                  pct: Math.round(((i + pct / 100) / total) * 100),
                }),
            );
          } catch {
            result = { ok: false, error: "Erro de rede." };
          }
          if (result.ok) break;
          if (tent < 3) await new Promise((res) => setTimeout(res, 2000));
        }
        if (result?.ok) {
          ok++;
          chavesOk.add(item.key);
          track("podcast_publicado", {
            podcastId: result.podcast?.id ?? null,
            disciplinaId: id,
            objetivo: item.objetivo || null,
            lote: total > 1,
            leve: Boolean(blobPronto),
            economiaPct: economia ?? null,
            arquivo: item.file.name,
          });
        } else {
          marca(item.key, { erro: result?.error || "Falha no envio.", status: undefined });
        }
      }
      if (ok > 0) {
        toast.success(`${ok} áudio(s) publicado(s)!`);
        setLote((l) => l.filter((a) => !chavesOk.has(a.key)));
        if (chavesOk.size === fila.length) setShowUpload(false);
        recarregar();
      } else if (fila.length > 0) {
        toast.error("Nenhum áudio subiu. Veja o motivo em cada item.");
      }
    } catch {
      toast.error("Erro inesperado no upload.");
    }
    setUploadProgress(null);
    setUploading(false);
  };

  const handleDelete = async (podcast: Podcast) => {
    if (!confirm("Tem certeza que deseja excluir este podcast?")) return;
    const r = await deletePodcast(podcast);
    if (r.ok) {
      toast.success("Podcast excluido.");
      recarregar();
    } else {
      toast.error(r.error || "Falha ao excluir.");
    }
  };

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/disciplines/${id}/podcast`
    : "";

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copiado! Compartilhe com a turma.");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareNative = () => {
    if (navigator.share) {
      navigator.share({
        title: `Podcasts - ${discipline?.nome || ""}`,
        text: `Ouça os podcasts de ${discipline?.nome} no Rota da Formatura!`,
        url: shareUrl,
      }).catch(() => {});
    } else {
      copyLink();
    }
  };

  const isPlayingThis = (url: string) => audioState.playing && audioState.currentUrl === url;

  const tocar = (podcast: Podcast) => {
    const novo = audioState.currentUrl !== podcast.url;
    playAudio(podcast.url, { titulo: podcast.titulo, disciplina: discipline?.nome });
    if (novo) {
      track("audio_tocado", {
        podcastId: podcast.id,
        disciplinaId: id,
        objetivo: podcast.objetivo ?? null,
      });
    }
  };
  const playbackRates = [1, 1.25, 1.5, 2];
  const currentRateIdx = playbackRates.indexOf(audioState.playbackRate);

  if (!discipline) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4">Disciplina nao encontrada</h1>
        <Link to="/disciplines" className="text-[#D4941E] font-bold uppercase underline">
          Voltar
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#0A3D52] pb-28">
      {/* Header com cor da disciplina */}
      <header
        className="text-white pt-6 pb-8 px-4 relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${discipline.cor}, ${discipline.cor}cc)` }}
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="max-w-3xl mx-auto relative z-10">
          <div className="flex items-center gap-4 mb-5">
            <Link
              to="/disciplines/$id"
              params={{ id }}
              className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors text-[10px] font-black uppercase tracking-[0.2em]"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center text-2xl backdrop-blur-sm">
              {discipline.icone}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-3xl font-black leading-tight">Podcasts</h1>
              <p className="text-[11px] font-bold text-white/60 uppercase tracking-wider mt-1">
                {discipline.nome} • {podcasts.length} episodio{podcasts.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* Share bar */}
          <div className="mt-5 flex gap-2">
            <button
              onClick={shareNative}
              className="flex-1 bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white py-2.5 px-4 rounded-xl font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" /> Compartilhar com a turma
            </button>
            <button
              onClick={copyLink}
              className="bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white py-2.5 px-4 rounded-xl font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 -mt-5 relative z-20">
        {/* Botao enviar */}
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="w-full bg-white rounded-2xl border-2 border-dashed border-[#D4941E]/30 p-4 flex items-center justify-center gap-3 text-[#D4941E] hover:bg-[#D4941E]/5 transition-all shadow-sm mb-6 cursor-pointer"
        >
          <Upload className="w-5 h-5" />
          <span className="font-black text-xs uppercase tracking-wider">Enviar Podcast</span>
        </button>

        {/* Form upload em lote */}
        {showUpload && (
          <div className="bg-white rounded-2xl border border-[#0A3D52]/10 p-5 shadow-lg mb-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-sm uppercase">
                Novos Episódios{lote.length > 0 ? ` (${lote.length})` : ""}
              </h3>
              <button onClick={() => setShowUpload(false)} className="text-[#0A3D52]/40 hover:text-[#0A3D52] cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <input
              ref={fileRef}
              type="file"
              multiple
              accept="audio/*,.mp3,.m4a,.wav,.ogg,.aac,.wma,.opus,.amr,.3gp"
              className="hidden"
              onChange={onArquivosSelecionados}
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full bg-[#F5F7FA] border-2 border-dashed border-[#D4941E]/30 rounded-xl px-4 py-4 text-sm text-center text-[#0A3D52]/50 hover:border-[#D4941E]/60 transition-colors cursor-pointer"
            >
              {lote.length === 0
                ? "Selecionar áudios (pode escolher vários de uma vez)"
                : "Adicionar mais áudios"}
            </button>
            <p className="text-[9px] text-[#0A3D52]/40 font-medium">MP3, M4A, WAV, OGG — até 500MB cada.</p>
            <label className="flex items-center gap-3 bg-[#D4941E]/5 border border-[#D4941E]/15 rounded-xl px-4 py-3 cursor-pointer">
              <input
                type="checkbox"
                checked={otimizar}
                onChange={(e) => setOtimizar(e.target.checked)}
                disabled={uploading || otimSuportado === false}
                className="w-5 h-5 accent-[#D4941E] cursor-pointer shrink-0"
              />
              <span className="flex-1">
                <span className="block text-xs font-black uppercase">Versão leve (economiza espaço)</span>
                <span className="block text-[10px] font-medium text-[#0A3D52]/50">
                  {otimSuportado === false
                    ? "Neste aparelho, envia o arquivo original."
                    : "Comprimo o áudio no teu aparelho antes de enviar (voz fica ~4x menor)."}
                </span>
              </span>
            </label>
            {lote.map((item, idx) => (
              <div key={item.key} className="bg-[#F5F7FA] rounded-xl p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-[#D4941E]/15 text-[#D4941E] text-[10px] font-black flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <p className="flex-1 min-w-0 text-xs font-bold truncate">
                    {item.file.name}
                    {item.economia !== undefined && (
                      <span className="text-[#27AE60]"> ({item.economia}% menor)</span>
                    )}
                  </p>
                  {!uploading && (
                    <button
                      onClick={() => removerItem(item.key)}
                      className="text-[10px] font-black uppercase text-[#E74C3C] cursor-pointer shrink-0"
                    >
                      Tirar
                    </button>
                  )}
                </div>
                {item.status && (
                  <p className="text-[10px] font-bold text-[#D4941E]">{item.status}</p>
                )}
                {item.erro && (
                  <p className="text-[10px] font-bold text-[#E74C3C] bg-[#E74C3C]/5 rounded-lg px-2 py-1.5">
                    Não subiu: {item.erro}
                  </p>
                )}
                <input
                  type="text"
                  placeholder="Título do episódio"
                  value={item.titulo}
                  onChange={(e) => atualizarItem(item.key, { titulo: e.target.value })}
                  disabled={uploading}
                  className="w-full bg-white border-none rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#D4941E] outline-none"
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={item.objetivo}
                    onChange={(e) => atualizarItem(item.key, { objetivo: e.target.value })}
                    disabled={uploading}
                    className="w-full bg-white border-none rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-[#D4941E] outline-none cursor-pointer"
                  >
                    {OBJETIVOS.map((o) => (
                      <option key={o.v} value={o.v}>
                        {o.l}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Descrição (opcional)"
                    value={item.descricao}
                    onChange={(e) => atualizarItem(item.key, { descricao: e.target.value })}
                    disabled={uploading}
                    className="w-full bg-white border-none rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-[#D4941E] outline-none"
                  />
                </div>
              </div>
            ))}
            {uploading && uploadProgress && (
              <div className="space-y-1">
                <div className="w-full h-2 bg-[#F5F7FA] rounded-full overflow-hidden">
                  <div className="h-full bg-[#D4941E] rounded-full transition-all duration-300" style={{ width: `${uploadProgress.pct}%` }} />
                </div>
                <p className="text-[10px] font-bold text-[#0A3D52]/40 text-center">
                  Enviando {uploadProgress.atual} de {uploadProgress.total}... {uploadProgress.pct}%
                </p>
              </div>
            )}
            {lote.length > 0 && (
              <button
                onClick={handleUpload}
                disabled={uploading}
                className={cn(
                  "w-full py-3 rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all",
                  uploading
                    ? "bg-[#0A3D52]/10 text-[#0A3D52]/30 cursor-not-allowed"
                    : "bg-[#D4941E] text-[#0A3D52] shadow-lg shadow-[#D4941E]/20 hover:scale-[1.02] cursor-pointer",
                )}
              >
                {uploading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Enviando...
                  </span>
                ) : (
                  `Publicar ${lote.length} áudio${lote.length !== 1 ? "s" : ""}`
                )}
              </button>
            )}
          </div>
        )}

        {/* Lista de podcasts */}
        {carregando ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-[#0A3D52]/10 p-5 animate-pulse">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-xl bg-[#F5F7FA]" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-[#F5F7FA] rounded w-2/3" />
                    <div className="h-3 bg-[#F5F7FA] rounded w-1/3" />
                  </div>
                </div>
                <div className="h-10 bg-[#F5F7FA] rounded-xl" />
              </div>
            ))}
          </div>
        ) : podcasts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-[#0A3D52]/15">
            <Headphones className="w-12 h-12 text-[#0A3D52]/10 mx-auto mb-4" />
            <p className="font-bold text-[#0A3D52]/40 uppercase tracking-widest text-sm mb-2">
              Nenhum podcast ainda
            </p>
            <p className="text-[11px] text-[#0A3D52]/30 max-w-xs mx-auto mb-4">
              Seja o primeiro a enviar um podcast para {discipline.nome}!
            </p>
            <button
              onClick={() => setShowUpload(true)}
              className="bg-[#D4941E] text-[#0A3D52] px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] cursor-pointer"
            >
              Enviar primeiro podcast
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {podcasts.map((podcast) => {
              const active = isPlayingThis(podcast.url);
              return (
                <div
                  key={podcast.id}
                  className={cn(
                    "bg-white rounded-2xl border p-5 transition-all",
                    active ? "border-[#D4941E]/30 shadow-lg ring-1 ring-[#D4941E]/10" : "border-[#0A3D52]/10 shadow-sm",
                  )}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <button
                      onClick={() => (active ? pauseAudio() : tocar(podcast))}
                      className="w-11 h-11 rounded-xl shrink-0 flex items-center justify-center text-white shadow-md active:scale-95 transition-all cursor-pointer"
                      style={{ background: discipline.cor }}
                    >
                      {audioState.buffering && active ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : active ? (
                        <Pause className="w-5 h-5" />
                      ) : (
                        <Play className="w-5 h-5 ml-0.5" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {podcast.objetivo && (
                          <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-[#D4941E]/10 text-[#D4941E]">
                            {podcast.objetivo}
                          </span>
                        )}
                        {podcast.duracao_seg ? (
                          <span className="text-[9px] font-bold text-[#0A3D52]/40 font-mono flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {formatarDuracao(podcast.duracao_seg)}
                          </span>
                        ) : null}
                        <span className="text-[9px] font-bold text-[#0A3D52]/30">
                          {new Date(podcast.criado_em).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm leading-tight mt-1">{podcast.titulo}</h4>
                      {podcast.descricao && (
                        <p className="text-[10px] text-[#0A3D52]/50 font-medium line-clamp-2 mt-0.5">{podcast.descricao}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(podcast)}
                      className="text-[#0A3D52]/20 hover:text-[#E74C3C] transition-colors p-1 cursor-pointer"
                      aria-label="Excluir podcast"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Player inline quando ativo */}
                  {active ? (
                    <div className="bg-[#F5F7FA] rounded-xl p-3 space-y-2">
                      <PodcastProgressBar podcastUrl={podcast.url} cor={discipline.cor} />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <button onClick={() => skipBackward(15)} className="w-8 h-8 rounded-lg bg-white border border-[#0A3D52]/5 flex items-center justify-center text-[#0A3D52]/50 hover:text-[#0A3D52] cursor-pointer">
                            <SkipBack className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => tocar(podcast)} className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm cursor-pointer" style={{ background: discipline.cor }}>
                            <Pause className="w-5 h-5" />
                          </button>
                          <button onClick={() => skipForward(15)} className="w-8 h-8 rounded-lg bg-white border border-[#0A3D52]/5 flex items-center justify-center text-[#0A3D52]/50 hover:text-[#0A3D52] cursor-pointer">
                            <SkipForward className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <button
                          onClick={() => setPlaybackRate(playbackRates[(currentRateIdx + 1) % playbackRates.length])}
                          className="text-[10px] font-black uppercase tracking-wider text-[#0A3D52]/50 hover:text-[#0A3D52] px-2 py-1 rounded-lg bg-white border border-[#0A3D52]/5 cursor-pointer"
                        >
                          {playbackRates[currentRateIdx]}x
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => tocar(podcast)}
                      className="w-full bg-[#F5F7FA] rounded-xl py-2.5 text-[10px] font-black uppercase tracking-wider hover:bg-[#0A3D52]/5 transition-colors cursor-pointer flex items-center justify-center gap-2"
                      style={{ color: discipline.cor }}
                    >
                      <Music className="w-3.5 h-3.5" /> Ouvir
                    </button>
                  )}
                  {audioState.error && active && (
                    <p className="text-[10px] font-bold text-[#E74C3C] mt-2">{audioState.error}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

// Barra de progresso do podcast ativo
function PodcastProgressBar({ podcastUrl, cor }: { podcastUrl: string; cor: string }) {
  const [time, setTime] = useState(0);
  const [dur, setDur] = useState(0);

  useEffect(() => {
    return subscribeAudio(() => {
      const s = getAudioState();
      if (s.currentUrl === podcastUrl) {
        setTime(s.currentTime);
        setDur(s.duration);
      }
    });
  }, [podcastUrl]);

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    seekAudio(pct * dur);
  };

  return (
    <div>
      <div className="h-2 bg-white rounded-full overflow-hidden cursor-pointer" onClick={seek}>
        <div
          className="h-full rounded-full transition-all duration-200"
          style={{ width: `${dur ? (time / dur) * 100 : 0}%`, background: cor }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[9px] font-mono text-[#0A3D52]/40">{formatarDuracao(time)}</span>
        <span className="text-[9px] font-mono text-[#0A3D52]/40">{dur ? formatarDuracao(dur) : "--:--"}</span>
      </div>
    </div>
  );
}
