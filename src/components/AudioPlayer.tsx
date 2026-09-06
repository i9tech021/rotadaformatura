// src/components/AudioPlayer.tsx
// Player de áudio com controles nativos estilizados (play/pause, progresso, velocidade).

import { useRef, useState, useEffect } from "react";
import { Pause, Play, Volume2 } from "lucide-react";
import { formatarDuracao } from "@/lib/podcastService";

interface AudioPlayerProps {
  url: string;
  cor?: string;
}

export function AudioPlayer({ url, cor = "#D4941E" }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [tocando, setTocando] = useState(false);
  const [atual, setAtual] = useState(0);
  const [total, setTotal] = useState(0);
  const [velocidade, setVelocidade] = useState(1);

  const togglePlay = () => {
    const el = audioRef.current;
    if (!el) return;
    if (tocando) {
      el.pause();
    } else {
      el.playbackRate = velocidade;
      el.play();
    }
  };

  const ciclarVelocidade = () => {
    const ordem = [1, 1.25, 1.5, 2];
    const prox = ordem[(ordem.indexOf(velocidade) + 1) % ordem.length] ?? 1;
    setVelocidade(prox);
    if (audioRef.current) audioRef.current.playbackRate = prox;
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = audioRef.current;
    if (!el || !total) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    el.currentTime = pct * total;
    setAtual(el.currentTime);
  };

  // cleanup: pausa ao desmontar
  useEffect(() => () => audioRef.current?.pause(), []);

  return (
    <div className="bg-[#F5F7FA] rounded-xl p-3 border border-[#0A3D52]/5">
      <audio
        ref={audioRef}
        src={url}
        preload="metadata"
        onLoadedMetadata={(e) => setTotal(e.currentTarget.duration || 0)}
        onTimeUpdate={(e) => setAtual(e.currentTarget.currentTime)}
        onEnded={() => {
          setTocando(false);
          setAtual(0);
        }}
        onPlay={() => setTocando(true)}
        onPause={() => setTocando(false)}
      />

      <div className="flex items-center gap-3">
        <button
          onClick={togglePlay}
          className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-white shadow-sm active:scale-90 transition-transform cursor-pointer"
          style={{ background: cor }}
          aria-label={tocando ? "Pausar" : "Tocar"}
        >
          {tocando ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </button>

        <div className="flex-1 min-w-0">
          {/* barra de progresso clicável */}
          <div
            className="h-2 bg-white rounded-full overflow-hidden border border-[#0A3D52]/5 cursor-pointer"
            onClick={seek}
          >
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${total ? (atual / total) * 100 : 0}%`,
                background: cor,
              }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[9px] font-bold text-[#0A3D52]/40 font-mono">
              {formatarDuracao(atual)}
            </span>
            <span className="text-[9px] font-bold text-[#0A3D52]/40 font-mono">
              {total ? formatarDuracao(total) : "--:--"}
            </span>
          </div>
        </div>

        <button
          onClick={ciclarVelocidade}
          className="text-[9px] font-black uppercase tracking-widest text-[#0A3D52]/50 hover:text-[#0A3D52] shrink-0 px-1.5 cursor-pointer"
          aria-label="Velocidade"
        >
          {velocidade}x
        </button>
        <Volume2 className="w-3.5 h-3.5 text-[#0A3D52]/30 shrink-0" />
      </div>
    </div>
  );
}
