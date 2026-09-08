// src/routes/disciplines.$id-podcast.tsx
// Página dedicada de podcasts por disciplina — upload, player, compartilhamento.
// URL compartilhável: /disciplines/{id}-podcast
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
  Music,
  ChevronDown,
  Copy,
  Check,
  Loader2,
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

export const Route = createFileRoute("/disciplines/$id-podcast")({
  component: DisciplinePodcastPage,
  head: () => ({
    meta: [{ title: "Podcasts | Rota da Formatura" }],
  }),
});

function DisciplinePodcastPage() {
  const { id } = useParams({ from: "/disciplines/$id-podcast" });
  const discipline = useMemo(() => disciplinas.find((d) => d.id === id), [id]);

  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUpload, setShowUpload] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Audio player state (from global context)
  const [audioState, setAudioState] = useState(getAudioState());
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    return subscribeAudio(() => setAudioState(getAudioState()));
  }, []);

  // Load podcasts
  const recarregar = useCallback(async () => {
    const lista = await listPodcasts(id);
    setPodcasts(lista);
    setCarregando(false);
  }, [id]);

  useEffect(() => {
    recarregar();
    return subscribePodcasts(recarregar);
  }, [recarregar]);

  // Upload handler
  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file || !titulo.trim()) {
      toast.error("Selecione um arquivo e preencha o titulo.");
      return;
    }

    // Validate file type
    const validTypes = ["audio/mpeg", "audio/mp3", "audio/mp4", "audio/m4a", "audio/wav", "audio/ogg", "audio/x-m4a"];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|m4a|wav|ogg|aac)$/i)) {
      toast.error("Formato nao suportado. Use MP3, M4A, WAV ou OGG.");
      return;
    }

    // Warn if large (>200MB)
    if (file.size > 200 * 1024 * 1024) {
      toast.warning("Arquivo muito grande. Pode demorar depending do upload.");
    }

    setUploading(true);
    setUploadProgress(10);

    try {
      const result = await uploadPodcast(file, {
        disciplinaId: id,
        titulo: titulo.trim(),
        descricao: descricao.trim(),
      });

      setUploadProgress(90);

      if (result.ok) {
        toast.success("Podcast publicado com sucesso!");
        setTitulo("");
        setDescricao("");
        setShowUpload(false);
        if (fileRef.current) fileRef.current.value = "";
        recarregar();
      } else {
        toast.error(result.error || "Falha no upload.");
      }
    } catch (e) {
      toast.error("Erro inesperado no upload.");
    }

    setUploadProgress(0);
    setUploading(false);
  };

  // Delete handler
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

  // Share link
  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/disciplines/${id}-podcast`
    : "";

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copiado! Compartilhe com a turma.");
    setTimeout(() => setCopied(false), 2000);
  };

  // Share API
  const shareNative = () => {
    if (navigator.share) {
      navigator.share({
        title: `Podcasts - ${discipline?.nome || ""}`,
        text: `Ouça os podcasts de ${discipline?.nome} no Rota da Formatura!`,
        url: shareUrl,
      });
    } else {
      copyLink();
    }
  };

  // Player controls
  const isPlayingThis = (url: string) => audioState.playing && audioState.currentUrl === url;
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
      {/* Header */}
      <header className="text-white pt-6 pb-10 px-4 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${discipline.cor}, ${discipline.cor}dd)` }}>
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="max-w-3xl mx-auto relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <Sheet>
              <SheetTrigger asChild>
                <button className="p-2 hover:bg-white/10 rounded-xl transition-colors md:hidden cursor-pointer">
                  <ChevronDown className="w-6 h-6" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="bg-[#0A3D52] text-white border-[#D4941E]/20 p-0">
                <AppMobileMenu />
              </SheetContent>
            </Sheet>
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
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-black leading-tight">
                Podcasts
              </h1>
              <p className="text-[11px] font-bold text-white/60 uppercase tracking-wider mt-1">
                {discipline.nome} • {podcasts.length} episodio{podcasts.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* Share bar */}
          <div className="mt-5 flex gap-2">
            <button
              onClick={shareNative}
              className="flex-1 bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white py-2.5 px-4 rounded-xl font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
            >
              <Share2 className="w-3.5 h-3.5" /> Compartilhar
            </button>
            <button
              onClick={copyLink}
              className="bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white py-2.5 px-4 rounded-xl font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copiado!" : "Link"}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 -mt-6 relative z-20">
        {/* Upload button */}
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="w-full bg-white rounded-2xl border-2 border-dashed border-[#D4941E]/30 p-4 flex items-center justify-center gap-3 text-[#D4941E] hover:bg-[#D4941E]/5 transition-all shadow-sm mb-6 cursor-pointer"
        >
          <Upload className="w-5 h-5" />
          <span className="font-black text-xs uppercase tracking-wider">Enviar Podcast</span>
        </button>

        {/* Upload form */}
        {showUpload && (
          <div className="bg-white rounded-2xl border border-[#0A3D52]/10 p-5 shadow-lg mb-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-sm uppercase">Novo Episodio</h3>
              <button onClick={() => setShowUpload(false)} className="text-[#0A3D52]/40 hover:text-[#0A3D52] cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <input
              type="text"
              placeholder="Titulo do episodio"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full bg-[#F5F7FA] border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#D4941E] outline-none"
            />

            <textarea
              placeholder="Descricao (opcional)"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={2}
              className="w-full bg-[#F5F7FA] border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#D4941E] outline-none resize-none"
            />

            <div className="flex items-center gap-3">
              <input
                ref={fileRef}
                type="file"
                accept="audio/*,.mp3,.m4a,.wav,.ogg,.aac"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f && !titulo) {
                    setTitulo(f.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "));
                  }
                }}
              />
              <button
                onClick={() => fileRef.current?.click()}
                className="flex-1 bg-[#F5F7FA] border border-[#0A3D52]/10 rounded-xl px-4 py-3 text-sm text-left text-[#0A3D52]/50 hover:border-[#D4941E]/30 transition-colors cursor-pointer"
              >
                {fileRef.current?.files?.[0]?.name || "Selecionar arquivo de audio..."}
              </button>
            </div>

            <p className="text-[9px] text-[#0A3D52]/40 font-medium">
              Formatos: MP3, M4A, WAV, OGG. Tamanho maximo: 200MB.
            </p>

            {uploading && (
              <div className="space-y-2">
                <div className="w-full h-2 bg-[#F5F7FA] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#D4941E] rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-[10px] font-bold text-[#0A3D52]/40 text-center">
                  Enviando... {uploadProgress}%
                </p>
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={uploading || !titulo.trim() || !fileRef.current?.files?.[0]}
              className={cn(
                "w-full py-3 rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all",
                uploading || !titulo.trim() || !fileRef.current?.files?.[0]
                  ? "bg-[#0A3D52]/10 text-[#0A3D52]/30 cursor-not-allowed"
                  : "bg-[#D4941E] text-[#0A3D52] shadow-lg shadow-[#D4941E]/20 hover:scale-[1.02] cursor-pointer",
              )}
            >
              {uploading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Enviando...
                </span>
              ) : (
                "Publicar"
              )}
            </button>
          </div>
        )}

        {/* Podcast list */}
        {carregando ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-[#0A3D52]/10 p-5 animate-pulse">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-[#F5F7FA]" />
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
              Seja o primeiro a enviar um podcast para esta disciplina!
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
                    active
                      ? "border-[#D4941E]/30 shadow-lg ring-1 ring-[#D4941E]/10"
                      : "border-[#0A3D52]/10 shadow-sm",
                  )}
                >
                  {/* Header */}
                  <div className="flex items-start gap-3 mb-3">
                    <button
                      onClick={() => active ? pauseAudio() : playAudio(podcast.url)}
                      className="w-11 h-11 rounded-xl shrink-0 flex items-center justify-center text-white shadow-md active:scale-95 transition-all cursor-pointer"
                      style={{ background: discipline.cor }}
                    >
                      {active ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm leading-tight">{podcast.titulo}</h4>
                      {podcast.descricao && (
                        <p className="text-[10px] text-[#0A3D52]/50 font-medium line-clamp-2 mt-0.5">
                          {podcast.descricao}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-1.5">
                        {podcast.duracao_seg ? (
                          <span className="text-[9px] font-bold text-[#0A3D52]/40 font-mono flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {formatarDuracao(podcast.duracao_seg)}
                          </span>
                        ) : null}
                        <span className="text-[9px] font-bold text-[#0A3D52]/30">
                          {new Date(podcast.criado_em).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(podcast)}
                      className="text-[#0A3D52]/20 hover:text-[#E74C3C] transition-colors p-1 cursor-pointer"
                      aria-label="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Player — shows when this podcast is active, or always for mobile */}
                  {active ? (
                    <GlobalPlayerInline
                      podcast={podcast}
                      cor={discipline.cor}
                      playbackRates={playbackRates}
                      currentRateIdx={currentRateIdx}
                    />
                  ) : (
                    <div className="bg-[#F5F7FA] rounded-xl p-3 flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-white rounded-full overflow-hidden">
                        <div className="h-full w-0 rounded-full" style={{ background: discipline.cor }} />
                      </div>
                      <button
                        onClick={() => playAudio(podcast.url)}
                        className="text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                        style={{ color: discipline.cor, background: `${discipline.cor}10` }}
                      >
                        Ouvir
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Floating mini player (when audio is playing and not inline) */}
      {audioState.playing && (
        <FloatingMiniPlayer
          audioState={audioState}
          podcasts={podcasts}
          cor={discipline.cor}
        />
      )}
    </div>
  );
}

// ============================================================
// Inline player for active podcast (with full controls)
// ============================================================
function GlobalPlayerInline({
  podcast,
  cor,
  playbackRates,
  currentRateIdx,
}: {
  podcast: Podcast;
  cor: string;
  playbackRates: number[];
  currentRateIdx: number;
}) {
  const [localTime, setLocalTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const unsub = subscribeAudio(() => {
      const s = getAudioState();
      if (s.currentUrl === podcast.url) {
        setLocalTime(s.currentTime);
        setDuration(s.duration);
      }
    });
    return unsub;
  }, [podcast.url]);

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    seekAudio(pct * duration);
  };

  return (
    <div className="bg-[#F5F7FA] rounded-xl p-3 space-y-2">
      {/* Progress bar */}
      <div
        className="h-2 bg-white rounded-full overflow-hidden border border-[#0A3D52]/5 cursor-pointer"
        onClick={seek}
      >
        <div
          className="h-full rounded-full transition-all duration-200"
          style={{
            width: `${duration ? (localTime / duration) * 100 : 0}%`,
            background: cor,
          }}
        />
      </div>

      <div className="flex items-center gap-2">
        {/* Rewind */}
        <button
          onClick={() => skipBackward(15)}
          className="w-8 h-8 rounded-lg bg-white border border-[#0A3D52]/5 flex items-center justify-center text-[#0A3D52]/50 hover:text-[#0A3D52] transition-colors cursor-pointer"
        >
          <SkipBack className="w-3.5 h-3.5" />
        </button>

        {/* Play/Pause */}
        <button
          onClick={() => playAudio(podcast.url)}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md active:scale-95 transition-all cursor-pointer"
          style={{ background: cor }}
        >
          <Pause className="w-5 h-5" />
        </button>

        {/* Forward */}
        <button
          onClick={() => skipForward(15)}
          className="w-8 h-8 rounded-lg bg-white border border-[#0A3D52]/5 flex items-center justify-center text-[#0A3D52]/50 hover:text-[#0A3D52] transition-colors cursor-pointer"
        >
          <SkipForward className="w-3.5 h-3.5" />
        </button>

        {/* Time */}
        <div className="flex-1 text-center">
          <span className="text-[10px] font-bold font-mono text-[#0A3D52]/60">
            {formatarDuracao(localTime)} / {duration ? formatarDuracao(duration) : "--:--"}
          </span>
        </div>

        {/* Speed */}
        <button
          onClick={() => {
            const next = playbackRates[(currentRateIdx + 1) % playbackRates.length];
            setPlaybackRate(next);
          }}
          className="text-[10px] font-black uppercase tracking-wider text-[#0A3D52]/50 hover:text-[#0A3D52] px-2 py-1 rounded-lg bg-white border border-[#0A3D52]/5 cursor-pointer"
        >
          {playbackRates[currentRateIdx]}x
        </button>
      </div>
    </div>
  );
}

// ============================================================
// Floating mini player (bottom bar when navigating away)
// ============================================================
function FloatingMiniPlayer({
  audioState,
  podcasts,
  cor,
}: {
  audioState: ReturnType<typeof getAudioState>;
  podcasts: Podcast[];
  cor: string;
}) {
  const current = podcasts.find((p) => p.url === audioState.currentUrl);
  if (!current) return null;

  return (
    <div className="fixed bottom-16 left-0 right-0 z-50 px-4 md:px-0 pointer-events-none">
      <div className="max-w-3xl mx-auto pointer-events-auto">
        <div className="bg-[#0A3D52] text-white rounded-2xl p-3 shadow-2xl flex items-center gap-3 border border-white/10">
          <button
            onClick={() => playAudio(current.url)}
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 active:scale-95 transition-all cursor-pointer"
            style={{ background: cor }}
          >
            {audioState.playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold truncate">{current.titulo}</p>
            <p className="text-[9px] text-white/40">{formatarDuracao(audioState.currentTime)}</p>
          </div>
          <button
            onClick={() => skipForward(15)}
            className="text-white/50 hover:text-white p-1 cursor-pointer"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
