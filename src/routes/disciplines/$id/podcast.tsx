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

export const Route = createFileRoute("/disciplines/$id/podcast")({
  component: DisciplinePodcastPage,
  head: () => ({
    meta: [{ title: "Podcasts | Rota da Formatura" }],
  }),
});

function DisciplinePodcastPage() {
  const { id } = useParams({ from: "/disciplines/$id/podcast" });
  const discipline = useMemo(() => disciplinas.find((d) => d.id === id), [id]);

  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [arquivoNome, setArquivoNome] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
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
    return subscribePodcasts(recarregar);
  }, [recarregar]);

  const onArquivoSelecionado = () => {
    const f = fileRef.current?.files?.[0];
    if (!f) return;
    if (f.size > 50 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Maximo de 50MB.");
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    setArquivoNome(f.name);
    if (!titulo) setTitulo(f.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "));
    toast.success(`Audio selecionado: ${f.name}`);
  };

  const limparArquivo = () => {
    if (fileRef.current) fileRef.current.value = "";
    setArquivoNome("");
  };

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file || !titulo.trim()) {
      toast.error("Selecione um arquivo e preencha o titulo.");
      return;
    }
    const validExts = /\.(mp3|m4a|wav|ogg|aac|wma)$/i;
    if (!validExts.test(file.name)) {
      toast.error("Formato nao suportado. Use MP3, M4A, WAV ou OGG.");
      return;
    }
    setUploading(true);
    setUploadProgress(5);
    try {
      const result = await uploadPodcast(
        file,
        {
          disciplinaId: id,
          titulo: titulo.trim(),
          descricao: descricao.trim(),
          objetivo,
        },
        setUploadProgress,
      );
      if (result.ok) {
        toast.success("Podcast publicado com sucesso!");
        track("podcast_publicado", {
          podcastId: result.podcast?.id ?? null,
          disciplinaId: id,
          objetivo: objetivo || null,
        });
        setTitulo("");
        setDescricao("");
        setObjetivo("");
        setArquivoNome("");
        setShowUpload(false);
        if (fileRef.current) fileRef.current.value = "";
        recarregar();
      } else {
        toast.error(result.error || "Falha no upload.");
      }
    } catch {
      toast.error("Erro inesperado no upload.");
    }
    setUploadProgress(0);
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

        {/* Form upload */}
        {showUpload && (
          <div className="bg-white rounded-2xl border border-[#0A3D52]/10 p-5 shadow-lg mb-6 space-y-3">
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
            <select
              value={objetivo}
              onChange={(e) => setObjetivo(e.target.value)}
              className="w-full bg-[#F5F7FA] border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#D4941E] outline-none cursor-pointer"
            >
              <option value="">Selecione o objetivo...</option>
              <option value="AP1">AP1 — Prova Presencial 1</option>
              <option value="AP2">AP2 — Prova Presencial 2</option>
              <option value="AP3">AP3 — Recuperacao</option>
              <option value="AD1">AD1 — Atividade a Distancia 1</option>
              <option value="AD2">AD2 — Atividade a Distancia 2</option>
              <option value="revisao">Revisao Geral</option>
              <option value="conteudo">Conteudo de Aula</option>
              <option value="dica">Dica / Resumo Rapido</option>
            </select>
            <textarea
              placeholder="Descricao (opcional)"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={2}
              className="w-full bg-[#F5F7FA] border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#D4941E] outline-none resize-none"
            />
            <input
              ref={fileRef}
              type="file"
              accept="audio/*,.mp3,.m4a,.wav,.ogg,.aac,.wma,.opus,.amr,.3gp"
              className="hidden"
              onChange={onArquivoSelecionado}
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full bg-[#F5F7FA] border border-[#0A3D52]/10 rounded-xl px-4 py-3 text-sm text-left text-[#0A3D52]/50 hover:border-[#D4941E]/30 transition-colors cursor-pointer"
            >
              {arquivoNome || "Selecionar arquivo de audio (MP3, M4A, WAV, OGG)..."}
            </button>
            {arquivoNome && (
              <button
                onClick={limparArquivo}
                className="text-[10px] font-black uppercase text-[#E74C3C] cursor-pointer"
              >
                Trocar arquivo
              </button>
            )}
            <p className="text-[9px] text-[#0A3D52]/40 font-medium">Tamanho maximo: 50MB.</p>
            {uploading && (
              <div className="space-y-1">
                <div className="w-full h-2 bg-[#F5F7FA] rounded-full overflow-hidden">
                  <div className="h-full bg-[#D4941E] rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                </div>
                <p className="text-[10px] font-bold text-[#0A3D52]/40 text-center">Enviando... {uploadProgress}%</p>
              </div>
            )}
            <button
              onClick={handleUpload}
              disabled={uploading || !titulo.trim() || !arquivoNome}
              className={cn(
                "w-full py-3 rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all",
                uploading || !titulo.trim() || !arquivoNome
                  ? "bg-[#0A3D52]/10 text-[#0A3D52]/30 cursor-not-allowed"
                  : "bg-[#D4941E] text-[#0A3D52] shadow-lg shadow-[#D4941E]/20 hover:scale-[1.02] cursor-pointer",
              )}
            >
              {uploading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Enviando...
                </span>
              ) : "Publicar"}
            </button>
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
