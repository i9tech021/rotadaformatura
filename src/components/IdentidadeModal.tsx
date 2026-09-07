// src/components/IdentidadeModal.tsx
// Modal para identificar o autor (nome + polo) antes de publicar.
import { useState } from "react";
import { GraduationCap, User, X } from "lucide-react";

interface Props {
  aberto: boolean;
  aoSalvar: (nome: string, polo: string) => void;
  aoFechar: () => void;
}

export function IdentidadeModal({ aberto, aoSalvar, aoFechar }: Props) {
  const [nome, setNome] = useState("");
  const [polo, setPolo] = useState("");

  if (!aberto) return null;

  const podeSalvar = nome.trim().length >= 2 && polo.trim().length >= 2;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!podeSalvar) return;
    aoSalvar(nome, polo);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={aoFechar} />
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#D4941E]/15 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-[#D4941E]" />
            </div>
            <div>
              <h3 className="font-black text-[#0A3D52]">Quem está publicando?</h3>
              <p className="text-[10px] uppercase tracking-widest text-[#0A3D52]/40 font-bold">
                Identificação para a comunidade
              </p>
            </div>
          </div>
          <button
            onClick={aoFechar}
            className="text-[#0A3D52]/30 hover:text-[#0A3D52] cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-[#0A3D52]/50 block mb-1.5">
              Seu nome
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-[#0A3D52]/30 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                autoFocus
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Maria Souza"
                maxLength={40}
                className="w-full bg-[#F5F7FA] rounded-xl pl-9 pr-3 py-2.5 text-sm font-bold text-[#0A3D52] focus:ring-2 focus:ring-[#D4941E] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-[#0A3D52]/50 block mb-1.5">
              Polo
            </label>
            <div className="relative">
              <GraduationCap className="w-4 h-4 text-[#0A3D52]/30 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={polo}
                onChange={(e) => setPolo(e.target.value)}
                placeholder="Ex: Volta Redonda"
                maxLength={40}
                className="w-full bg-[#F5F7FA] rounded-xl pl-9 pr-3 py-2.5 text-sm font-bold text-[#0A3D52] focus:ring-2 focus:ring-[#D4941E] outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!podeSalvar}
            className="w-full bg-[#0A3D52] text-white py-3 rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-[#0A3D52]/20 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-40 cursor-pointer"
          >
            Entrar na comunidade
          </button>
          <p className="text-[10px] text-[#0A3D52]/40 text-center font-medium">
            Aparecerá junto às suas publicações. Sem login.
          </p>
        </form>
      </div>
    </div>
  );
}
