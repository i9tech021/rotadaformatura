// src/components/SimuladoPlayer.tsx
// Player de simulado: timer, navegação de questões, correção automática e explicação.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Send,
  XCircle,
} from "lucide-react";
import { corrigirSimulado, type SimuladoRealizado } from "@/lib/simuladoService";
import { cn } from "@/lib/utils";

interface Props {
  simulado: SimuladoRealizado;
  onConcluido?: (atualizado: SimuladoRealizado) => void;
  minutos?: number;
}

export function SimuladoPlayer({ simulado, onConcluido, minutos = 45 }: Props) {
  const [indice, setIndice] = useState(0);
  const [respostas, setRespostas] = useState<(number | null)[]>(
    () => simulado.respostas ?? new Array(simulado.questoes.length).fill(null),
  );
  const [segundosRestantes, setSegundosRestantes] = useState(minutos * 60);
  const [enviado, setEnviado] = useState(false);
  const [resultado, setResultado] = useState<SimuladoRealizado | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const questao = simulado.questoes[indice];
  const total = simulado.questoes.length;
  const marcadas = useMemo(() => respostas.filter((r) => r != null).length, [respostas]);

  // Timer
  useEffect(() => {
    if (enviado) return;
    timerRef.current = setInterval(() => {
      setSegundosRestantes((s) => {
        if (s <= 1) {
          clearInterval(timerRef.current as ReturnType<typeof setInterval>);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [enviado]);

  const marcar = (alt: number) => {
    if (enviado) return;
    setRespostas((prev) => {
      const prox = [...prev];
      prox[indice] = alt;
      return prox;
    });
  };

  const enviar = useCallback(async () => {
    if (enviado) return;
    const atualizado = await corrigirSimulado(simulado.id, respostas);
    if (atualizado) {
      setResultado(atualizado);
      setEnviado(true);
      onConcluido?.(atualizado);
    }
  }, [enviado, respostas, simulado.id, onConcluido]);

  const tempoEsgotado = segundosRestantes <= 0;

  // Auto-envio quando tempo esgota
  useEffect(() => {
    if (tempoEsgotado && !enviado) enviar();
  }, [tempoEsgotado, enviado, enviar]);

  const podeNavegar = !enviado;
  const respostaMarcada = respostas[indice];

  if (enviado && resultado) {
    return <ResultadoCard resultado={resultado} onRefazer={() => window.location.reload()} />;
  }

  return (
    <div className="space-y-4">
      {/* Barra de progresso da prova */}
      <div className="bg-white rounded-2xl border border-[#0A3D52]/10 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Send className="w-4 h-4 text-[#D4941E]" />
            <span className="text-xs font-black uppercase tracking-widest text-[#0A3D52]/60">
              Questão {indice + 1} de {total}
            </span>
          </div>
          <div
            className={cn(
              "flex items-center gap-1.5 font-mono text-sm font-black",
              segundosRestantes <= 60 ? "text-[#E74C3C]" : "text-[#0A3D52]",
            )}
          >
            <Clock className="w-4 h-4" />
            {Math.floor(segundosRestantes / 60)}:
            {(segundosRestantes % 60).toString().padStart(2, "0")}
          </div>
        </div>
        <div className="h-2 bg-[#F5F7FA] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#D4941E] transition-all duration-300"
            style={{ width: `${((marcadas / total) * 100).toFixed(0)}%` }}
          />
        </div>
        <p className="text-[10px] font-bold text-[#0A3D52]/40 uppercase mt-1">
          {marcadas}/{total} respondidas
        </p>
      </div>

      {/* Questão */}
      <div className="bg-white rounded-2xl border border-[#0A3D52]/10 p-6 shadow-sm min-h-[260px]">
        <h3 className="text-[11px] font-black uppercase tracking-widest text-[#D4941E] mb-2">
          Questão {indice + 1}
        </h3>
        <p className="text-sm font-medium leading-relaxed text-[#0A3D52] mb-6">
          {questao?.enunciado}
        </p>

        <div className="space-y-2.5">
          {questao?.alternativas.map((alt, i) => {
            const marcada = respostaMarcada === i;
            return (
              <button
                key={i}
                onClick={() => marcar(i)}
                disabled={!podeNavegar}
                className={cn(
                  "w-full text-left p-3 rounded-xl border-2 transition-all cursor-pointer disabled:cursor-default text-sm font-medium",
                  marcada
                    ? "border-[#D4941E] bg-[#D4941E]/10 text-[#0A3D52]"
                    : "border-[#0A3D52]/10 bg-[#F5F7FA] hover:border-[#D4941E]/40 text-[#0A3D52]/70",
                )}
              >
                {alt}
              </button>
            );
          })}
        </div>

        {!podeNavegar && questao?.explicacao && (
          <div className="mt-6 p-4 bg-[#27AE60]/5 border border-[#27AE60]/20 rounded-xl">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#27AE60] mb-1">
              Explicação
            </p>
            <p className="text-xs text-[#0A3D52]/70 leading-relaxed">{questao.explicacao}</p>
          </div>
        )}
      </div>

      {/* Navegação */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => setIndice((i) => Math.max(0, i - 1))}
          disabled={indice === 0 || !podeNavegar}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#0A3D52]/10 text-[10px] font-black uppercase tracking-widest text-[#0A3D52]/60 hover:border-[#D4941E]/40 transition-all disabled:opacity-30 cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Anterior
        </button>

        <span className="text-[10px] font-bold text-[#0A3D52]/40 uppercase">
          {marcadas}/{total}
        </span>

        {indice < total - 1 ? (
          <button
            onClick={() => setIndice((i) => Math.min(total - 1, i + 1))}
            disabled={!podeNavegar}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#0A3D52]/10 text-[10px] font-black uppercase tracking-widest text-[#0A3D52]/60 hover:border-[#D4941E]/40 transition-all disabled:opacity-30 cursor-pointer"
          >
            Próxima <ChevronRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            onClick={enviar}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D4941E] text-[#0A3D52] text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#D4941E]/20 hover:scale-105 transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" /> Enviar
          </button>
        )}
      </div>

      {/* Dot map das questões */}
      <div className="flex gap-1.5 flex-wrap">
        {simulado.questoes.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              if (!enviado) setIndice(i);
            }}
            className={cn(
              "w-7 h-7 rounded-md text-[9px] font-black flex items-center justify-center transition-all",
              i === indice
                ? "bg-[#0A3D52] text-white"
                : respostas[i] != null
                  ? "bg-[#D4941E]/30 text-[#0A3D52]"
                  : "bg-[#F5F7FA] text-[#0A3D52]/40 border border-[#0A3D52]/10",
            )}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}

function ResultadoCard({
  resultado,
  onRefazer,
}: {
  resultado: SimuladoRealizado;
  onRefazer: () => void;
}) {
  const aprovado = resultado.percentual >= 60;
  const Icone = aprovado ? CheckCircle2 : AlertTriangle;
  const cor = aprovado ? "text-[#27AE60]" : "text-[#E74C3C]";

  return (
    <div className="bg-white rounded-3xl border border-[#0A3D52]/10 p-8 shadow-sm text-center">
      <div
        className={cn(
          "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4",
          aprovado ? "bg-[#27AE60]/10" : "bg-[#E74C3C]/10",
        )}
      >
        <Icone className={cn("w-8 h-8", cor)} />
      </div>
      <h3 className="text-2xl font-black mb-1">{resultado.percentual}% de acerto</h3>
      <p className={cn("text-sm font-bold mb-2", cor)}>
        {aprovado ? "Você iria passar! (estilo CEDERJ)" : "Não atingiu os 60% ainda"}
      </p>
      <p className="text-sm text-[#0A3D52]/60 mb-6 font-medium">
        {resultado.acertos} de {resultado.total} questões corretas
      </p>

      <button
        onClick={onRefazer}
        className="bg-[#D4941E] text-[#0A3D52] px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-[#D4941E]/20 hover:scale-105 transition-all cursor-pointer"
      >
        Novo Simulado
      </button>
    </div>
  );
}

export function RevisePorQuestao({ resultado }: { resultado: SimuladoRealizado }) {
  return (
    <div className="space-y-3">
      {resultado.questoes.map((q, i) => {
        const certa = resultado.respostas[i] === q.resposta_correta;
        return (
          <div
            key={q.id}
            className={cn(
              "bg-white rounded-2xl border p-4",
              certa ? "border-[#27AE60]/30" : "border-[#E74C3C]/30",
            )}
          >
            <div className="flex items-start gap-2 mb-2">
              {certa ? (
                <CheckCircle2 className="w-4 h-4 text-[#27AE60] shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-4 h-4 text-[#E74C3C] shrink-0 mt-0.5" />
              )}
              <div>
                <p className="text-sm font-bold">{q.enunciado}</p>
                {!certa && resultado.respostas[i] != null && (
                  <p className="text-[10px] text-[#E74C3C] mt-1">
                    Sua resposta: {q.alternativas[resultado.respostas[i] as number]}
                  </p>
                )}
                <p className="text-[10px] font-bold text-[#27AE60] mt-1">
                  Correta: {q.alternativas[q.resposta_correta]}
                </p>
                {q.explicacao && (
                  <p className="text-[11px] text-[#0A3D52]/60 mt-2 leading-relaxed">
                    {q.explicacao}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
