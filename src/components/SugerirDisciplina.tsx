// src/components/SugerirDisciplina.tsx
// Sugestão de disciplina → abre conversa no WhatsApp com mensagem pronta.
// Sem banco: só redireciona para wa.me em nova aba.
import { useState } from "react";
import { MessageCircle } from "lucide-react";

const WHATSAPP_NUMERO = "5521996235681";

interface Props {
  compacto?: boolean;
}

export function SugerirDisciplina({ compacto = false }: Props) {
  const [disciplina, setDisciplina] = useState("");
  const [curso, setCurso] = useState("");

  const enviar = () => {
    const nome = disciplina.trim() || "uma disciplina";
    const cs = curso.trim() || "meu curso";
    const texto = `Olá! Gostaria de sugerir a disciplina ${nome} do curso ${cs} no Rota da Formatura.`;
    window.open(
      `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(texto)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  if (compacto) {
    return (
      <button
        onClick={enviar}
        className="inline-flex items-center gap-1.5 text-[#0A3D52]/40 hover:text-[#27AE60] transition-colors text-[10px] font-black uppercase tracking-widest cursor-pointer"
      >
        <MessageCircle className="w-3.5 h-3.5" /> Sugerir disciplina
      </button>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[#0A3D52]/10 p-5 shadow-sm">
      <h3 className="text-xs font-black text-[#0A3D52]/40 uppercase tracking-[0.2em] mb-1 flex items-center gap-2">
        <MessageCircle className="w-3.5 h-3.5 text-[#27AE60]" /> Não achou sua matéria?
      </h3>
      <p className="text-[11px] text-[#0A3D52]/50 mb-4 font-medium">
        Sugira uma disciplina e a gente adiciona. Vai direto pro nosso WhatsApp.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <input
          value={disciplina}
          onChange={(e) => setDisciplina(e.target.value)}
          placeholder="Nome da disciplina"
          maxLength={60}
          className="w-full bg-[#F5F7FA] rounded-xl px-3 py-2.5 text-sm font-bold text-[#0A3D52] focus:ring-2 focus:ring-[#27AE60] outline-none"
        />
        <input
          value={curso}
          onChange={(e) => setCurso(e.target.value)}
          placeholder="Curso (ex: Administração)"
          maxLength={60}
          className="w-full bg-[#F5F7FA] rounded-xl px-3 py-2.5 text-sm font-bold text-[#0A3D52] focus:ring-2 focus:ring-[#27AE60] outline-none"
        />
      </div>
      <button
        onClick={enviar}
        className="w-full bg-[#27AE60] text-white py-3 rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-[#27AE60]/20 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
      >
        Sugerir pelo WhatsApp
      </button>
    </div>
  );
}
