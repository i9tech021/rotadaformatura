// src/components/PomodoroTimer.tsx
// Timer Pomodoro flutuante para sessões de estudo focado.
// 25 min trabalho → 5 min pausa → 25 min → pausa longa (15 min).
import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Coffee, BookOpen, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PomodoroTimerProps {
  className?: string;
}

type TimerMode = "work" | "break" | "longBreak";

const DURATIONS: Record<TimerMode, number> = {
  work: 25 * 60,      // 25 minutos
  break: 5 * 60,      // 5 minutos
  longBreak: 15 * 60, // 15 minutos
};

const MODE_LABELS: Record<TimerMode, string> = {
  work: "Foco",
  break: "Pausa",
  longBreak: "Pausa Longa",
};

const MODE_COLORS: Record<TimerMode, string> = {
  work: "#0A3D52",
  break: "#27AE60",
  longBreak: "#D4941E",
};

export function PomodoroTimer({ className }: PomodoroTimerProps) {
  const [mode, setMode] = useState<TimerMode>("work");
  const [timeLeft, setTimeLeft] = useState(DURATIONS.work);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [minimized, setMinimized] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((t) => t - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      // Timer acabou
      if (intervalRef.current) clearInterval(intervalRef.current);
      setIsRunning(false);

      // Toca um som de notificação
      try {
        const audio = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVggoKIbF1fdJivrJBhNjVggoKIbF1fdJivrJBhNjVggoKIbF1fdA==");
        audio.play().catch(() => {});
      } catch {}

      // Próximo modo
      if (mode === "work") {
        const newSessions = sessions + 1;
        setSessions(newSessions);
        if (newSessions % 4 === 0) {
          setMode("longBreak");
          setTimeLeft(DURATIONS.longBreak);
        } else {
          setMode("break");
          setTimeLeft(DURATIONS.break);
        }
      } else {
        setMode("work");
        setTimeLeft(DURATIONS.work);
      }
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, timeLeft, mode, sessions]);

  const toggle = () => setIsRunning(!isRunning);

  const reset = () => {
    setIsRunning(false);
    setMode("work");
    setTimeLeft(DURATIONS.work);
    setSessions(0);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = 1 - timeLeft / DURATIONS[mode];

  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        className={cn(
          "fixed bottom-24 right-6 w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-white z-50 hover:scale-110 transition-transform",
          className
        )}
        style={{ background: MODE_COLORS[mode] }}
      >
        <span className="text-xs font-bold">
          {minutes}:{seconds.toString().padStart(2, "0")}
        </span>
      </button>
    );
  }

  return (
    <div
      className={cn(
        "fixed bottom-24 right-6 w-64 bg-white rounded-2xl shadow-2xl border border-[#0A3D52]/10 overflow-hidden z-50",
        className
      )}
    >
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center justify-between text-white"
        style={{ background: MODE_COLORS[mode] }}
      >
        <div className="flex items-center gap-2">
          {mode === "work" ? <BookOpen className="w-4 h-4" /> : <Coffee className="w-4 h-4" />}
          <span className="text-xs font-black uppercase tracking-wider">
            {MODE_LABELS[mode]}
          </span>
        </div>
        <button
          onClick={() => setMinimized(true)}
          className="text-white/70 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Timer */}
      <div className="p-6 text-center">
        {/* Progress ring */}
        <div className="relative w-32 h-32 mx-auto mb-4">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#F5F7FA"
              strokeWidth="8"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={MODE_COLORS[mode]}
              strokeWidth="8"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress)}`}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl font-black text-[#0A3D52]">
              {minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="w-10 h-10 rounded-full bg-[#F5F7FA] flex items-center justify-center text-[#0A3D52] hover:bg-[#0A3D52]/10 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={toggle}
            className="w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-105 transition-transform"
            style={{ background: MODE_COLORS[mode] }}
          >
            {isRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
          </button>
          <div className="w-10 h-10" /> {/* Spacer */}
        </div>

        {/* Sessions */}
        <div className="mt-4 flex items-center justify-center gap-1">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={cn(
                "w-2 h-2 rounded-full",
                i < sessions % 4 ? "bg-[#D4941E]" : "bg-[#0A3D52]/10"
              )}
            />
          ))}
          <span className="text-[10px] text-[#0A3D52]/40 ml-2 font-bold">
            {sessions} sessão{sessions !== 1 ? "ões" : ""}
          </span>
        </div>
      </div>
    </div>
  );
}
