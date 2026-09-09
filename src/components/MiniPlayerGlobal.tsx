// src/components/MiniPlayerGlobal.tsx
// Mini player fixo visível em TODAS as páginas enquanto há áudio ativo.
// Como o <audio> é singleton no módulo, a reprodução continua ao navegar.
import { useEffect, useState } from "react";
import { Pause, Play, SkipForward, X, Loader2 } from "lucide-react";
import { formatarDuracao } from "@/lib/podcastService";
import {
  playAudio,
  pauseAudio,
  stopAudio,
  skipForward,
  subscribeAudio,
  getAudioState,
} from "@/lib/audioContext";

export function MiniPlayerGlobal() {
  const [audio, setAudio] = useState(getAudioState());

  useEffect(() => subscribeAudio(() => setAudio(getAudioState())), []);

  if (!audio.currentUrl) return null;

  const alternar = () => {
    if (audio.playing) pauseAudio();
    else playAudio(audio.currentUrl);
  };

  return (
    <div className="fixed bottom-16 md:bottom-4 left-0 right-0 z-50 px-4 pointer-events-none">
      <div className="max-w-3xl mx-auto pointer-events-auto">
        <div className="bg-[#0A3D52] text-white rounded-2xl p-3 shadow-2xl flex items-center gap-3 border border-white/10">
          <button
            onClick={alternar}
            className="w-9 h-9 rounded-lg bg-[#D4941E] text-[#0A3D52] flex items-center justify-center shrink-0 active:scale-95 transition-all cursor-pointer"
            aria-label={audio.playing ? "Pausar" : "Tocar"}
          >
            {audio.buffering ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : audio.playing ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4 ml-0.5" />
            )}
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold truncate">
              {audio.titulo || "Tocando..."}
              {audio.disciplina ? ` • ${audio.disciplina}` : ""}
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1 bg-white/15 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#D4941E] rounded-full"
                  style={{
                    width: `${audio.duration ? (audio.currentTime / audio.duration) * 100 : 0}%`,
                  }}
                />
              </div>
              <p className="text-[9px] text-white/40 font-mono shrink-0">
                {formatarDuracao(audio.currentTime)}
              </p>
            </div>
          </div>
          <button
            onClick={() => skipForward(15)}
            className="text-white/50 hover:text-white p-1 cursor-pointer"
            aria-label="Avançar 15s"
          >
            <SkipForward className="w-4 h-4" />
          </button>
          <button
            onClick={stopAudio}
            className="text-white/50 hover:text-white p-1 cursor-pointer"
            aria-label="Fechar player"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
