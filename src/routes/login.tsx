// src/routes/login.tsx
// Entrada simples: só nome + polo. Sem senha, sem código de turma.
import { useState } from "react";
import { useNavigate, createFileRoute } from "@tanstack/react-router";
import { GraduationCap, User, ArrowRight, Shield, MapPin } from "lucide-react";
import { salvarIdentidade, CODIGO_TURMA_PADRAO } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({
    meta: [{ title: "Login | Rota da Formatura" }],
  }),
});

function LoginPage() {
  const navigate = useNavigate();
  const [nome, setNome] = useState("");
  const [polo, setPolo] = useState("");

  const podeEntrar = nome.trim().length >= 2 && polo.trim().length >= 2;

  const handleEntrar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!podeEntrar) return;
    salvarIdentidade(nome, polo, CODIGO_TURMA_PADRAO);
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
          <p className="text-sm text-white/60 mt-1 font-medium">CEDERJ · Administração · 2026-2</p>
        </div>

        {/* Form */}
        <form onSubmit={handleEntrar} className="bg-white rounded-3xl shadow-2xl p-6 space-y-5">
          <div className="text-center mb-2">
            <h2 className="font-black text-[#0A3D52] text-lg">Entrar na Plataforma</h2>
            <p className="text-xs text-[#0A3D52]/50 font-medium">
              Só seu nome e seu polo — sem senha
            </p>
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
                className="w-full bg-[#F5F7FA] rounded-xl pl-9 pr-3 py-2.5 text-sm font-bold text-[#0A3D52] placeholder:text-[#0A3D52]/30 focus:ring-2 focus:ring-[#D4941E] outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!podeEntrar}
            className="w-full bg-[#0A3D52] text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-[#0A3D52]/20 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2"
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
        </form>
      </div>
    </div>
  );
}
