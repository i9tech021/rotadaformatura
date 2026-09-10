// src/components/StreakDisplay.tsx
// Exibe o streak de estudos do aluno com animação e motivação.
import { useState, useEffect } from "react";
import { Flame, Trophy, Calendar } from "lucide-react";
import { getStreak, getMensagemStreak, getEmojiStreak, isStreakQuebrado } from "@/lib/streak";
import { cn } from "@/lib/utils";

interface StreakDisplayProps {
  className?: string;
  compact?: boolean; // Versão compacta pro dashboard
}

export function StreakDisplay({ className, compact = false }: StreakDisplayProps) {
  const [streak, setStreak] = useState(() => getStreak());
  const [quebrado, setQuebrado] = useState(() => isStreakQuebrado());

  useEffect(() => {
    // Atualiza a cada minuto
    const interval = setInterval(() => {
      setStreak(getStreak());
      setQuebrado(isStreakQuebrado());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const emoji = getEmojiStreak(streak.current);
  const mensagem = getMensagemStreak(streak.current);

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold",
          streak.current > 0
            ? "bg-gradient-to-r from-orange-500 to-red-500 text-white"
            : "bg-gray-100 text-gray-500"
        )}>
          <Flame className="w-3.5 h-3.5" />
          <span>{streak.current}</span>
        </div>
        {quebrado && streak.current > 0 && (
          <span className="text-[10px] text-orange-500 font-bold animate-pulse">
            Voltou!
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={cn(
      "bg-gradient-to-br from-orange-500 to-red-500 rounded-3xl p-6 text-white shadow-lg",
      className
    )}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Flame className="w-5 h-5" />
            <span className="text-xs font-black uppercase tracking-widest opacity-80">
              Sequência de Estudos
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black">{streak.current}</span>
            <span className="text-sm opacity-80">dias seguidos</span>
          </div>
        </div>
        <span className="text-4xl">{emoji}</span>
      </div>

      <p className="mt-3 text-sm opacity-90">{mensagem}</p>

      <div className="mt-4 flex items-center gap-4 text-xs opacity-80">
        <div className="flex items-center gap-1">
          <Trophy className="w-3.5 h-3.5" />
          <span>Recorde: {streak.longest} dias</span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" />
          <span>Total: {streak.totalDays} dias</span>
        </div>
      </div>

      {quebrado && streak.current > 0 && (
        <div className="mt-3 bg-white/20 rounded-xl px-3 py-2 text-xs">
          ⚠️ Seu streak tá em risco! Estude hoje pra não perder!
        </div>
      )}
    </div>
  );
}
