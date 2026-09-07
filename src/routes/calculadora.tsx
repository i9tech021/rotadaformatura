// src/routes/calculadora.tsx
// Calculadora dedicada de AP/AD — média CEDERJ + calculadora reversa.
// Link próprio: /calculadora (compartilhável, sem login).
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppBottomNav, AppDesktopNav } from "@/components/AppNav";
import {
  ArrowLeft,
  Calculator,
  GraduationCap,
  LayoutDashboard,
  ListChecks,
  Plus,
  RefreshCcw,
  Target,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";
import { disciplinas } from "@/data/disciplines";
import { calcularMedia, type Nota } from "@/lib/gradesService";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/calculadora")({
  component: CalculadoraPage,
  head: () => ({
    meta: [{ title: "Calculadora AP/AD | Rota da Formatura" }],
  }),
});

// Pesos padrão CEDERJ (20% AD + 80% AP)
const PESO_AD = 2;
const PESO_AP = 8;
const MEDIA_MINIMA = 6.0;

type AvaliacaoTipo = "AD1" | "AP1" | "AD2" | "AP2" | "AP3";

const CAMPOS: { tipo: AvaliacaoTipo; label: string; peso: number }[] = [
  { tipo: "AD1", label: "AD1", peso: PESO_AD },
  { tipo: "AP1", label: "AP1", peso: PESO_AP },
  { tipo: "AD2", label: "AD2", peso: PESO_AD },
  { tipo: "AP2", label: "AP2", peso: PESO_AP },
  { tipo: "AP3", label: "AP3 (recuperação)", peso: 10 },
];

function CalculadoraPage() {
  const [disciplinaId, setDisciplinaId] = useState(disciplinas[0]?.id ?? "");
  const [notas, setNotas] = useState<Record<string, string>>({});
  const [meta, setMeta] = useState<number>(MEDIA_MINIMA);

  const disciplina = useMemo(() => disciplinas.find((d) => d.id === disciplinaId), [disciplinaId]);

  // Converte inputs em notas tipadas
  const notasCaixa = useMemo<Nota[]>(() => {
    return CAMPOS.filter((c) => c.tipo !== "AP3")
      .map((c) => {
        const raw = (notas[c.tipo] ?? "").replace(",", ".");
        const val = raw === "" ? null : Number(raw);
        return {
          id: `${disciplinaId}-${c.tipo}`,
          studentId: "calc",
          disciplinaId,
          avaliacaoTipo: c.tipo,
          avaliacaoNumero: c.tipo.includes("1") ? 1 : 2,
          nota: val != null && !Number.isNaN(val) ? val : null,
          peso: c.peso,
        };
      })
      .filter((n) => n.nota != null) as Nota[];
  }, [notas, disciplinaId]);

  // Resultado núcleo (reusa a lógica do gradesService)
  const calculo = useMemo(() => {
    if (notasCaixa.length === 0) return null;
    return calcularMedia(disciplinaId, notasCaixa);
  }, [notasCaixa, disciplinaId]);

  // ==== Calculadora reversa ====
  // "Com N1 já feito, quanto preciso em N2 (ou AP2) pra bater a meta?"
  const n1 = calculo?.n1 ?? null;
  const n2 = calculo?.n2 ?? null;
  const precisaN2 = n1 != null ? Math.max(0, meta * 2 - n1) : null;

  // Com AP3 de recuperação: média = (maior(N1,N2) + AP3)/2
  const nMaior = n1 != null && n2 != null ? Math.max(n1, n2) : n1;
  const precisaAP3 = nMaior != null ? Math.max(0, meta * 2 - nMaior) : null;

  // Helper de parse
  const parseNota = (v: string) => {
    const n = Number(v.replace(",", "."));
    return Number.isNaN(n) ? null : Math.min(10, Math.max(0, n));
  };

  const handleNota = (tipo: string, v: string) => {
    const n = parseNota(v);
    setNotas((prev) => ({ ...prev, [tipo]: n != null ? String(n) : v }));
  };

  const limpar = () => setNotas({});

  const statusCor = (s: string) => {
    if (s.includes("Aprovado")) return "text-[#27AE60]";
    if (s.includes("Precisa") || s.includes("Faltam") || s.includes("recuperação"))
      return "text-[#D4941E]";
    return "text-[#E74C3C]";
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#0A3D52] pb-24">
      {/* Header */}
      <nav className="sticky top-0 z-40 w-full bg-[#0A3D52] text-white px-4 py-3 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-[10px] font-black uppercase underline"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Link>
          <div className="flex items-center gap-2">
            <Calculator className="w-6 h-6 text-[#D4941E]" />
            <span className="font-bold text-lg tracking-tight uppercase hidden min-[420px]:inline">
              Calculadora
            </span>
          </div>
        </div>
        <AppDesktopNav />
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold">Calculadora de Média</h2>
          <p className="text-[#0A3D52]/60 mt-1">
            Descubra sua média e quanto precisa tirar para passar. Fórmula CEDERJ: N1 = (2×AD1 +
            8×AP1)/10.
          </p>
        </div>

        {/* Seletor de disciplina */}
        <section className="mb-6">
          <div className="bg-white rounded-2xl border border-[#0A3D52]/10 p-5 shadow-sm">
            <label className="text-[10px] font-black uppercase text-[#0A3D52]/50 tracking-widest block mb-2">
              Disciplina
            </label>
            <select
              value={disciplinaId}
              onChange={(e) => setDisciplinaId(e.target.value)}
              className="w-full bg-[#F5F7FA] rounded-xl px-3 py-3 text-sm font-bold text-[#0A3D52] focus:ring-2 focus:ring-[#D4941E] outline-none cursor-pointer"
            >
              {disciplinas.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nome} ({d.codigo})
                </option>
              ))}
            </select>
            {disciplina?.formulaNota && (
              <p className="text-[10px] font-bold text-[#0A3D52]/50 mt-2 uppercase">
                Fórmula da disciplina: {disciplina.formulaNota.n1}
              </p>
            )}
          </div>
        </section>

        {/* Inputs de nota */}
        <section className="mb-6">
          <div className="bg-white rounded-2xl border border-[#0A3D52]/10 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-black text-[#0A3D52]/40 uppercase tracking-[0.2em] flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-[#D4941E]" /> Suas notas
              </h3>
              <button
                onClick={limpar}
                className="text-[10px] font-black uppercase text-[#0A3D52]/40 hover:text-[#E74C3C] transition-colors cursor-pointer"
              >
                Limpar
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {CAMPOS.map((c) => (
                <div key={c.tipo} className="bg-[#F5F7FA] rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#0A3D52]/50">
                      {c.label}
                    </span>
                    <span className="text-[9px] font-bold text-[#0A3D52]/30 uppercase">
                      {c.peso === 10 ? "Recup." : `${c.peso * 10}%`}
                    </span>
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    step={0.1}
                    value={notas[c.tipo] ?? ""}
                    onChange={(e) => handleNota(c.tipo, e.target.value)}
                    placeholder="0,0"
                    className="w-full bg-white rounded-xl px-3 py-2.5 text-sm font-bold text-[#0A3D52] focus:ring-2 focus:ring-[#D4941E] outline-none"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Resultado */}
        {calculo && (
          <section className="mb-6">
            <div
              className={cn(
                "rounded-3xl p-6 border-2",
                calculo.podePassar
                  ? "bg-[#27AE60]/5 border-[#27AE60]/30"
                  : calculo.mediaAtual != null
                    ? "bg-[#D4941E]/5 border-[#D4941E]/30"
                    : "bg-white border-[#0A3D52]/10",
              )}
            >
              <div className="flex flex-wrap items-start gap-6 mb-4">
                {/* N1 */}
                <div className="flex-1 min-w-[130px]">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0A3D52]/40">
                    N1 (AD1+AP1)
                  </p>
                  <p className="text-3xl font-black font-mono">
                    {n1 != null ? n1.toFixed(2) : "--"}
                  </p>
                </div>
                {/* N2 */}
                <div className="flex-1 min-w-[130px]">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0A3D52]/40">
                    N2 (AD2+AP2)
                  </p>
                  <p className="text-3xl font-black font-mono">
                    {n2 != null ? n2.toFixed(2) : "--"}
                  </p>
                </div>
                {/* Média */}
                <div className="flex-1 min-w-[130px]">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0A3D52]/40">
                    Média
                  </p>
                  <p className="text-3xl font-black font-mono">
                    {calculo.mediaAtual != null ? calculo.mediaAtual.toFixed(2) : "--"}
                  </p>
                </div>
              </div>

              <p className={cn("font-black text-sm mb-1", statusCor(calculo.situacao))}>
                {calculo.situacao}
              </p>
              <ul className="space-y-1">
                {calculo.detalhes.map((d, i) => (
                  <li key={i} className="text-[11px] font-medium text-[#0A3D52]/50">
                    • {d}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* Calculadora reversa */}
        <section className="mb-6">
          <div className="bg-white rounded-2xl border border-[#0A3D52]/10 p-6 shadow-sm">
            <h3 className="text-xs font-black text-[#0A3D52]/40 uppercase tracking-[0.2em] mb-1 flex items-center gap-2">
              <Target className="w-4 h-4 text-[#D4941E]" /> Quanto preciso tirar?
            </h3>
            <p className="text-[11px] text-[#0A3D52]/50 mb-4">
              Meta de aprovação (mínimo 6,0). A calculadora te diz quanto falta em cada etapa.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Meta editável */}
              <div className="bg-[#F5F7FA] rounded-xl p-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#0A3D52]/50 block mb-2">
                  Meta de média
                </label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  step={0.5}
                  value={meta}
                  onChange={(e) => setMeta(parseNota(e.target.value) ?? MEDIA_MINIMA)}
                  className="w-full bg-white rounded-xl px-3 py-2.5 text-sm font-bold text-[#0A3D52] focus:ring-2 focus:ring-[#D4941E] outline-none"
                />
              </div>

              {/* O que falta */}
              <div className="bg-[#F5F7FA] rounded-xl p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#0A3D52]/50 block mb-2">
                  O que falta
                </p>
                <div className="space-y-1.5 text-[12px] font-bold">
                  {precisaN2 != null ? (
                    <p>
                      N2 ≥ <span className="font-mono text-[#D4941E]">{precisaN2.toFixed(1)}</span>{" "}
                      p/ média {meta.toFixed(1)}
                    </p>
                  ) : (
                    <p className="text-[#0A3D52]/40">Informe ao menos N1 (AD1+AP1).</p>
                  )}
                  {precisaAP3 != null && precisaAP3 <= 10 && (
                    <p>
                      via AP3 ≥{" "}
                      <span className="font-mono text-[#E74C3C]">{precisaAP3.toFixed(1)}</span>{" "}
                      (recuperação)
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Dica da fórmula */}
        <section>
          <div className="bg-[#0A3D52]/5 rounded-2xl border border-[#0A3D52]/10 p-5">
            <h3 className="text-xs font-black text-[#0A3D52]/40 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-[#D4941E]" /> Como funciona a nota no CEDERJ
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-[#0A3D52]/60 font-medium">
              <div className="bg-white rounded-xl p-3">
                <p className="font-bold text-[#0A3D52] mb-1">Cálculo por etapa</p>
                <p className="font-mono text-[10px]">N1 = (2×AD1 + 8×AP1) / 10</p>
                <p className="font-mono text-[10px]">N2 = (2×AD2 + 8×AP2) / 10</p>
              </div>
              <div className="bg-white rounded-xl p-3">
                <p className="font-bold text-[#0A3D52] mb-1">Aprovação</p>
                <p>Média = (N1 + N2) / 2</p>
                <p className="font-bold text-[#27AE60]">≥ {MEDIA_MINIMA.toFixed(1)} = aprovado</p>
                <p className="text-[10px] text-[#0A3D52]/50">
                  Senão, AP3: média com o maior N ≥ 5,0.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Bottom Mobile Nav (global) */}
      <AppBottomNav />
    </div>
  );
}
