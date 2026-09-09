// src/components/PodcastCard.tsx
// Card de podcast usando o player GLOBAL (singleton): continua tocando ao
// trocar de página, com barra de progresso, velocidade, buffering e erro.
import { useEffect, useState } from "react";
import { Headphones, Trash2, Target, Play, Pause, Loader2 } from "lucide-react";
import { formatarDuracao, type Podcast } from "@/lib/podcastService";
import {
  playAudio,
  pauseAudio,
  seekAudio,
  setPlaybackRate,
  subscribeAudio,
  getAudioState,
} from "@/lib/audioContext";
import { track } from "@/lib/metricas";

interface PodcastCardProps {
  podcast: Podcast;
  disciplinaCor: string;
  disciplinaNome: string;
  podeRemover?: boolean;
  onRemover?: (podcast: Podcast) => void;
}

const objetivoLabel: Record<string, string> = {
  AP1: "AP1",
  AP2: "AP2",
  AP3: "AP3",
  AD1: "AD1",
  AD2: "AD2",
  revisao: "Revisao",
  conteudo: "Aula",
  dica: "Dica",
};

const VELOCIDADES = [1, 1.25, 1.5, 2];

export function PodcastCard({
  podcast,
  disciplinaCor,
  disciplinaNome,
  podeRemover,
  onRemover,
}: PodcastCardProps) {
  const [audio, setAudio] = useState(getAudioState());

  useEffect(() => subscribeAudio(() => setAudio(getAudioState())), []);

  const ativo = audio.currentUrl === podcast.url;
  const tocando = ativo && audio.playing;
  const objLabel = podcast.objetivo ? objetivoLabel[podcast.objetivo] || podcast.objetivo : null;
  const idxVel = VELOCIDADES.indexOf(audio.playbackRate);

  const alternar = () => {
    if (ativo) {
      if (audio.playing) pauseAudio();
      else playAudio(podcast.url);
    } else {
      playAudio(podcast.url, { titulo: podcast.titulo, disciplina: disciplinaNome });
      track("audio_tocado", {
        podcastId: podcast.id,
        disciplinaId: podcast.disciplina_id,
        objetivo: podcast.objetivo ?? null,
      });
    }
  };

  const buscar = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ativo || !audio.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    seekAudio(pct * audio.duration);
  };

  const tempoAtual = ativo ? audio.currentTime : 0;
  const duracao = ativo && audio.duration ? audio.duration : (podcast.duracao_seg ?? 0);

  return (
    <div className="bg-white rounded-2xl border border-[#0A3D52]/10 p-4 shadow-sm hover:border-[#D4941E]/30 transition-all">
      <div className="flex items-start gap-3 mb-3">
        <button
          onClick={alternar}
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white active:scale-95 transition-all cursor-pointer"
          style={{ background: disciplinaCor }}
          aria-label={tocando ? "Pausar" : "Tocar"}
        >
          {ativo && audio.buffering ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : tocando ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5 ml-0.5" />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded"
              style={{ color: disciplinaCor, background: `${disciplinaCor}15` }}
            >
              {disciplinaNome}
            </span>
            {objLabel && (
              <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-[#D4941E]/10 text-[#D4941E]">
                <Target className="w-2.5 h-2.5 inline -mt-0.5" /> {objLabel}
              </span>
            )}
            {duracao ? (
              <span className="text-[9px] font-bold text-[#0A3D52]/40 font-mono">
                {formatarDuracao(duracao)}
              </span>
            ) : null}
          </div>
          <h4 className="font-bold text-sm leading-tight mt-1 truncate">{podcast.titulo}</h4>
          {podcast.descricao && (
            <p className="text-[10px] text-[#0A3D52]/50 font-medium line-clamp-2">
              {podcast.descricao}
            </p>
          )}
        </div>
        {podeRemover && onRemover && (
          <button
            onClick={() => onRemover(podcast)}
            className="text-[#0A3D52]/25 hover:text-[#E74C3C] transition-colors p-1 cursor-pointer"
            aria-label="Remover podcast"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Player inline */}
      <div className="bg-[#F5F7FA] rounded-xl p-3 border border-[#0A3D52]/5">
        <div className="flex items-center gap-3">
          <button
            onClick={alternar}
            className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-white shadow-sm active:scale-90 transition-transform cursor-pointer"
            style={{ background: disciplinaCor }}
            aria-label={tocando ? "Pausar" : "Tocar"}
          >
            {ativo && audio.buffering ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : tocando ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4 ml-0.5" />
            )}
          </button>
          <div className="flex-1 min-w-0">
            <div
              className="h-2 bg-white rounded-full overflow-hidden border border-[#0A3D52]/5 cursor-pointer"
              onClick={buscar}
            >
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${duracao ? (tempoAtual / duracao) * 100 : 0}%`,
                  background: disciplinaCor,
                }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[9px] font-bold text-[#0A3D52]/40 font-mono">
                {formatarDuracao(tempoAtual)}
              </span>
              <span className="text-[9px] font-bold text-[#0A3D52]/40 font-mono">
                {duracao ? formatarDuracao(duracao) : "--:--"}
              </span>
            </div>
          </div>
          <button
            onClick={() => setPlaybackRate(VELOCIDADES[(idxVel + 1) % VELOCIDADES.length] ?? 1)}
            className="text-[9px] font-black uppercase tracking-widest text-[#0A3D52]/50 hover:text-[#0A3D52] shrink-0 px-1.5 cursor-pointer"
            aria-label="Velocidade"
          >
            {audio.playbackRate}x
          </button>
          <Headphones className="w-3.5 h-3.5 text-[#0A3D52]/30 shrink-0" />
        </div>
        {ativo && audio.error && (
          <p className="text-[10px] font-bold text-[#E74C3C] mt-2">{audio.error}</p>
        )}
      </div>
    </div>
  );
}
