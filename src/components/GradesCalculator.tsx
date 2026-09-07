// src/components/GradesCalculator.tsx
// Entrada de notas + Calculadora de Média por disciplina.
import { useState, useEffect } from "react";
import { Calculator, Save, TrendingUp, TrendingDown, CheckCircle2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  loadNotas,
  saveNota,
  calcularMedia,
  type Nota,
  type CalculoMedia,
} from "@/lib/gradesService";

interface Props {
  disciplinaId: string;
  disciplinaCor: string;
}

const AVALIACOES = [
  { tipo: "AD1", label: "AD1", peso: 2 },
  { tipo: "AP1", label: "AP1", peso: 8 },
  { tipo: "AD2", label: "AD2", peso: 2 },
  { tipo: "AP2", label: "AP2", peso: 8 },
  { tipo: "AP3", label: "AP3 (Recuperação)", peso: 10 },
];

export function GradesCalculator({ disciplinaId, disciplinaCor }: Props) {
  const [notas, setNotas] = useState<Record<string, string>>({});
  const [notasDb, setNotasDb] = useState<Nota[]>([]);
  const [calculo, setCalculo] = useState<CalculoMedia | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    loadNotas(disciplinaId).then((n) => {
      setNotasDb(n);
      const map: Record<string, string> = {};
      for (const nota of n) {
        if (nota.nota != null) map[nota.avaliacaoTipo] = String(nota.nota);
      }
      setNotas(map);
    });
  }, [disciplinaId]);

  useEffect(() => {
    setCalculo(calcularMedia(disciplinaId, notasDb));
  }, [disciplinaId, notasDb]);

  const handleNotaChange = (tipo: string, valor: string) => {
    setNotas((prev) => ({ ...prev, [tipo]: valor }));
  };

  const handleSave = async (tipo: string) => {
    const valor = notas[tipo] ?? "";
    const av = AVALIACOES.find((a) => a.tipo === tipo);
    if (!av) return;

    setSaving(tipo);
    const notaVal = valor.trim() === "" ? null : parseFloat(valor.replace(",", "."));
    if (notaVal !== null && (isNaN(notaVal) || notaVal < 0 || notaVal > 10)) {
      setSaving(null);
      return;
    }

    await saveNota({
      disciplinaId,
      avaliacaoTipo: tipo,
      avaliacaoNumero: tipo.includes("1") ? 1 : tipo.includes("2") ? 2 : 3,
      nota: notaVal,
      peso: av.peso,
    });

    const updated = await loadNotas(disciplinaId);
    setNotasDb(updated);
    setSaving(null);
  };

  const SituacaoIcon = calculo?.podePassar ? CheckCircle2 : AlertTriangle;
  const SituacaoCor = calculo?.podePassar ? "text-[#27AE60]" : "text-[#E74C3C]";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <Calculator className="w-4 h-4" style={{ color: disciplinaCor }} />
        <h4 className="font-black text-xs uppercase tracking-widest text-[#0A3D52]/60">
          Notas e Calculadora
        </h4>
      </div>

      {/* Fórmula */}
      <div className="bg-[#F5F7FA] rounded-2xl p-4 border border-[#0A3D52]/5">
        <p className="text-[10px] font-bold text-[#0A3D52]/50 uppercase tracking-widest mb-1">
          Fórmula CEDERJ
        </p>
        <p className="text-xs text-[#0A3D52] font-medium">
          N1 = (2 × AD1 + 8 × AP1) / 10 &nbsp;|&nbsp; Média = (N1 + N2) / 2 ≥ 6,0
        </p>
      </div>

      {/* Inputs de Notas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {AVALIACOES.map((av) => (
          <div
            key={av.tipo}
            className="bg-white rounded-2xl border border-[#0A3D52]/10 p-4 flex items-center gap-3"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-black shrink-0"
              style={{ background: disciplinaCor }}
            >
              {av.label.replace(" (Recuperação)", "")}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-[#0A3D52]/40 uppercase mb-1">
                {av.label} ({av.tipo.includes("P") ? "80%" : av.tipo === "AP3" ? "Recup." : "20%"})
              </p>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={0}
                  max={10}
                  step={0.1}
                  value={notas[av.tipo] || ""}
                  onChange={(e) => handleNotaChange(av.tipo, e.target.value)}
                  placeholder="0,0"
                  className="w-full bg-[#F5F7FA] rounded-xl px-3 py-2 text-sm font-bold text-[#0A3D52] focus:ring-2 focus:ring-[#D4941E] outline-none"
                />
                <button
                  onClick={() => handleSave(av.tipo)}
                  disabled={saving === av.tipo}
                  className="bg-[#D4941E] text-[#0A3D52] px-3 py-2 rounded-xl hover:scale-105 transition-all disabled:opacity-40 cursor-pointer"
                >
                  {saving === av.tipo ? (
                    <span className="w-4 h-4 border-2 border-[#0A3D52]/30 border-t-transparent rounded-full animate-spin inline-block" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Resultado da Calculadora */}
      {calculo && (
        <div
          className={cn(
            "rounded-2xl p-5 border-2 transition-all",
            calculo.podePassar
              ? "bg-[#27AE60]/5 border-[#27AE60]/30"
              : calculo.mediaAtual != null
                ? "bg-[#E74C3C]/5 border-[#E74C3C]/30"
                : "bg-[#F5F7FA] border-[#0A3D52]/5",
          )}
        >
          <div className="flex items-center gap-3 mb-3">
            <SituacaoIcon className={cn("w-5 h-5", SituacaoCor)} />
            <div>
              <p className={cn("font-black text-sm", SituacaoCor)}>
                {calculo.situacao}
              </p>
              {calculo.mediaAtual != null && (
                <p className="text-[10px] font-bold text-[#0A3D52]/40 uppercase">
                  Média atual: {calculo.mediaAtual.toFixed(2)} / 10
                </p>
              )}
            </div>
          </div>

          {calculo.n1 != null && (
            <div className="flex items-center gap-4 mb-2">
              <div className="flex items-center gap-2">
                {calculo.n1 >= MEDIA_MINIMA ? (
                  <TrendingUp className="w-3.5 h-3.5 text-[#27AE60]" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 text-[#E74C3C]" />
                )}
                <span className="text-xs font-bold text-[#0A3D52]/60">
                  N1: <span className="text-[#0A3D52]">{calculo.n1.toFixed(2)}</span>
                </span>
              </div>
              {calculo.n2 != null && (
                <div className="flex items-center gap-2">
                  {calculo.n2 >= MEDIA_MINIMA ? (
                    <TrendingUp className="w-3.5 h-3.5 text-[#27AE60]" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5 text-[#E74C3C]" />
                  )}
                  <span className="text-xs font-bold text-[#0A3D52]/60">
                    N2: <span className="text-[#0A3D52]">{calculo.n2.toFixed(2)}</span>
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="space-y-1">
            {calculo.detalhes.map((d, i) => (
              <p key={i} className="text-[10px] text-[#0A3D52]/50 font-medium">
                {d}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const MEDIA_MINIMA = 6.0;
