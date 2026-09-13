// src/routes/login.tsx
// Onboarding 3 passos: Curso → Disciplinas → Nome + Polo
import { useState, useMemo } from "react";
import { useNavigate, createFileRoute, useSearch } from "@tanstack/react-router";
import {
  GraduationCap,
  User,
  ArrowRight,
  ArrowLeft,
  Shield,
  MapPin,
  BookOpen,
  CheckCircle2,
  Search,
  ChevronRight,
} from "lucide-react";
import { salvarIdentidade, CODIGO_TURMA_PADRAO } from "@/lib/auth";
import { cursos, polos, getPolosPorCurso, type Curso } from "@/data/cursos";
import { disciplinas as todasDisciplinas, type Disciplina } from "@/data/disciplines";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({
    meta: [{ title: "Login | Rota da Formatura" }],
  }),
});

function LoginPage() {
  const navigate = useNavigate();

  // Estado do wizard
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [cursoId, setCursoId] = useState("administracao");
  const [disciplinasSelecionadas, setDisciplinasSelecionadas] = useState<string[]>([]);
  const [nome, setNome] = useState("");
  const [polo, setPolo] = useState("");
  const [buscaPolo, setBuscaPolo] = useState("");

  // Curso ativo (por enquanto só ADM)
  const cursoAtivo = cursos.find((c) => c.id === cursoId) ?? cursos[0]!;

  // Disciplinas disponíveis para o curso selecionado
  const disciplinasDisponiveis = useMemo(() => {
    const ids = cursoAtivo?.disciplinasApp ?? [];
    return todasDisciplinas.filter((d) => ids.includes(d.id));
  }, [cursoId]);

  // Polos filtrados por busca
  const polosFiltrados = useMemo(() => {
    const polosCurso = getPolosPorCurso(cursoId);
    if (!buscaPolo.trim()) return polosCurso;
    const q = buscaPolo.toLowerCase();
    return polosCurso.filter((p) => p.nome.toLowerCase().includes(q));
  }, [cursoId, buscaPolo]);

  // Toggle disciplina
  const toggleDisciplina = (id: string) => {
    setDisciplinasSelecionadas((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id],
    );
  };

  // Pode avançar
  const podeAvancar1 = !!cursoId;
  const podeAvancar2 = disciplinasSelecionadas.length > 0;
  const podeEntrar = nome.trim().length >= 2 && polo.trim().length >= 2;

  // Entrar
  const handleEntrar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!podeEntrar) return;
    salvarIdentidade(nome, polo, CODIGO_TURMA_PADRAO, cursoId, disciplinasSelecionadas);
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A3D52] via-[#0D4A63] to-[#0A3D52] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#D4941E]/20 flex items-center justify-center">
            <GraduationCap className="w-8 h-8 text-[#D4941E]" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Rota da Formatura</h1>
          <p className="text-sm text-white/60 mt-1 font-medium">CEDERJ · 2026-2</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                  step >= s
                    ? "bg-[#D4941E] text-[#0A3D52]"
                    : "bg-white/10 text-white/40"
                }`}
              >
                {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
              </div>
              {s < 3 && (
                <div
                  className={`w-8 h-0.5 rounded transition-all ${
                    step > s ? "bg-[#D4941E]" : "bg-white/10"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <form onSubmit={step === 3 ? handleEntrar : undefined} className="bg-white rounded-3xl shadow-2xl p-6">
          {/* ── STEP 1: Curso ── */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center mb-2">
                <h2 className="font-black text-[#0A3D52] text-lg">Qual seu curso?</h2>
                <p className="text-xs text-[#0A3D52]/50 font-medium">
                  Escolha entre os cursos disponíveis no CEDERJ
                </p>
              </div>

              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                {cursos.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    disabled={!c.ativo}
                    onClick={() => {
                      setCursoId(c.id);
                      setDisciplinasSelecionadas([]);
                    }}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                      c.ativo
                        ? cursoId === c.id
                          ? "border-[#D4941E] bg-[#D4941E]/5 shadow-md"
                          : "border-[#0A3D52]/10 hover:border-[#D4941E]/40 hover:bg-[#F5F7FA]"
                        : "border-[#0A3D52]/5 bg-[#F5F7FA]/50 opacity-50 cursor-not-allowed"
                    }`}
                  >
                    <span className="text-2xl">{c.icone}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-[#0A3D52] truncate">{c.nome}</p>
                      <p className="text-[10px] font-bold text-[#0A3D52]/40 uppercase">
                        {c.universidade} • {c.totalCH} • {c.totalPeriodos} períodos
                      </p>
                    </div>
                    {!c.ativo && (
                      <span className="text-[9px] font-black uppercase px-2 py-1 rounded-full bg-[#0A3D52]/5 text-[#0A3D52]/40">
                        Em breve
                      </span>
                    )}
                    {c.ativo && cursoId === c.id && (
                      <CheckCircle2 className="w-5 h-5 text-[#D4941E] shrink-0" />
                    )}
                  </button>
                ))}
              </div>

              <button
                type="button"
                disabled={!podeAvancar1}
                onClick={() => setStep(2)}
                className="w-full bg-[#0A3D52] text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-[#0A3D52]/20 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2 mt-4"
              >
                Próximo
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ── STEP 2: Disciplinas ── */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="p-2 hover:bg-[#F5F7FA] rounded-xl transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4 text-[#0A3D52]/40" />
                </button>
                <div>
                  <h2 className="font-black text-[#0A3D52] text-lg">Quais matérias você faz?</h2>
                  <p className="text-[10px] text-[#0A3D52]/50 font-medium uppercase tracking-wider">
                    {cursoAtivo.nome} • {disciplinasSelecionadas.length} selecionada(s)
                  </p>
                </div>
              </div>

              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                {disciplinasDisponiveis.map((d) => {
                  const selecionada = disciplinasSelecionadas.includes(d.id);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => toggleDisciplina(d.id)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                        selecionada
                          ? "border-[#D4941E] bg-[#D4941E]/5 shadow-md"
                          : "border-[#0A3D52]/10 hover:border-[#D4941E]/40 hover:bg-[#F5F7FA]"
                      }`}
                    >
                      <span className="text-xl">{d.icone}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-[#0A3D52] truncate">{d.nome}</p>
                        <p className="text-[10px] font-bold text-[#0A3D52]/40 uppercase">
                          {d.codigo} • {d.period ?? "—"} • {d.ch ?? "—"}
                        </p>
                      </div>
                      {selecionada && (
                        <CheckCircle2 className="w-5 h-5 text-[#D4941E] shrink-0" />
                      )}
                    </button>
                  );
                })}
                {disciplinasDisponiveis.length === 0 && (
                  <div className="text-center py-8">
                    <BookOpen className="w-8 h-8 text-[#0A3D52]/20 mx-auto mb-2" />
                    <p className="text-sm font-bold text-[#0A3D52]/40">
                      Nenhuma disciplina mapeada ainda
                    </p>
                    <p className="text-[10px] text-[#0A3D52]/30 mt-1">
                      Em breve mais matérias estarão disponíveis
                    </p>
                  </div>
                )}
              </div>

              <button
                type="button"
                disabled={!podeAvancar2}
                onClick={() => setStep(3)}
                className="w-full bg-[#0A3D52] text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-[#0A3D52]/20 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2 mt-4"
              >
                Próximo
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ── STEP 3: Nome + Polo ── */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="p-2 hover:bg-[#F5F7FA] rounded-xl transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4 text-[#0A3D52]/40" />
                </button>
                <div>
                  <h2 className="font-black text-[#0A3D52] text-lg">Seus dados</h2>
                  <p className="text-[10px] text-[#0A3D52]/50 font-medium uppercase tracking-wider">
                    {disciplinasSelecionadas.length} matéria(s) • {cursoAtivo.nome}
                  </p>
                </div>
              </div>

              {/* Nome */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-[#0A3D52]/50 block mb-1.5">
                  Seu Nome
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#0A3D52]/30 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    autoFocus
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Maria Souza"
                    maxLength={50}
                    className="w-full bg-[#F5F7FA] rounded-xl pl-9 pr-3 py-2.5 text-sm font-bold text-[#0A3D52] placeholder:text-[#0A3D52]/30 focus:ring-2 focus:ring-[#D4941E] outline-none"
                  />
                </div>
              </div>

              {/* Polo */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-[#0A3D52]/50 block mb-1.5">
                  Polo
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-[#0A3D52]/30 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={polo}
                    onChange={(e) => setPolo(e.target.value)}
                    placeholder="Ex: São Fidélis"
                    maxLength={40}
                    list="polo-list"
                    className="w-full bg-[#F5F7FA] rounded-xl pl-9 pr-3 py-2.5 text-sm font-bold text-[#0A3D52] placeholder:text-[#0A3D52]/30 focus:ring-2 focus:ring-[#D4941E] outline-none"
                  />
                  <datalist id="polo-list">
                    {polosFiltrados.map((p) => (
                      <option key={p.id} value={p.nome} />
                    ))}
                  </datalist>
                </div>
                <p className="text-[9px] text-[#0A3D52]/30 mt-1">
                  {polosFiltrados.length} polo(s) disponível(is) para {cursoAtivo.nome}
                </p>
              </div>

              <button
                type="submit"
                disabled={!podeEntrar}
                className="w-full bg-[#0A3D52] text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-[#0A3D52]/20 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2 mt-4"
              >
                Entrar
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-start gap-2 p-3 bg-[#F5F7FA] rounded-xl">
                <Shield className="w-4 h-4 text-[#0A3D52]/40 shrink-0 mt-0.5" />
                <p className="text-[10px] text-[#0A3D52]/50 font-medium leading-relaxed">
                  Sem senhas. Sem contas. Seu nome e polo ficam apenas no seu navegador.
                </p>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
