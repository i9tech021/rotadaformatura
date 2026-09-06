// src/components/PodcastCard.tsx
// Card de podcast com player inline + ações.

import { Headphones, Trash2 } from "lucide-react";
import { AudioPlayer } from "./AudioPlayer";
import { formatarDuracao, type Podcast } from "@/lib/podcastService";

interface PodcastCardProps {
  podcast: Podcast;
  disciplinaCor: string;
  disciplinaNome: string;
  podeRemover?: boolean;
  onRemover?: (podcast: Podcast) => void;
}

export function PodcastCard({
  podcast,
  disciplinaCor,
  disciplinaNome,
  podeRemover,
  onRemover,
}: PodcastCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-[#0A3D52]/10 p-4 shadow-sm hover:border-[#D4941E]/30 transition-all">
      <div className="flex items-start gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white"
          style={{ background: disciplinaCor }}
        >
          <Headphones className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded"
              style={{ color: disciplinaCor, background: `${disciplinaCor}15` }}
            >
              {disciplinaNome}
            </span>
            {podcast.duracao_seg ? (
              <span className="text-[9px] font-bold text-[#0A3D52]/40 font-mono">
                {formatarDuracao(podcast.duracao_seg)}
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
      <AudioPlayer url={podcast.url} cor={disciplinaCor} />
    </div>
  );
}
