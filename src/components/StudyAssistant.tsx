// src/components/StudyAssistant.tsx
// Assistente de estudos com IA (Tutor Rota da Formatura).
// Mantém apenas as últimas 3 mensagens como contexto enviado à IA.
import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Bot, User } from "lucide-react";
import { askAcademicAI } from "@/lib/academic.functions";
import { cn } from "@/lib/utils";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface StudyAssistantProps {
  disciplinaNome?: string;
  disciplinaCor?: string;
  proximosEventos?: string[];
}

const WELCOME: ChatMessage = {
  role: "assistant",
  content:
    "Olá! Sou seu Tutor da Rota da Formatura. Posso explicar conceitos, sugerir o que estudar hoje ou ajudar na revisão para ADs e APs. Como posso ajudar?",
};

export function StudyAssistant({
  disciplinaNome,
  disciplinaCor = "#0A3D52",
  proximosEventos = [],
}: StudyAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  const buildResumo = () => {
    const partes: string[] = [];
    if (disciplinaNome) partes.push(`Disciplina em foco: ${disciplinaNome}.`);
    if (proximosEventos.length) {
      partes.push("Próximos eventos desta disciplina:");
      partes.push(...proximosEventos.map((e) => `- ${e}`));
    }
    return partes.join("\n");
  };

  const send = async () => {
    const question = input.trim();
    if (!question || loading) return;

    const userMsg: ChatMessage = { role: "user", content: question };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      // Envia apenas as últimas 3 mensagens como histórico de contexto.
      const history = next.slice(-3).map(({ role, content }) => ({
        role,
        content,
      }));
      const res = await askAcademicAI({
        data: {
          question,
          context: { resumo: buildResumo(), history },
        },
      });
      setMessages((m) => [...m, { role: "assistant", content: res.answer }]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            "Erro ao conectar à IA. Verifique se o servidor local está rodando.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-[#0A3D52]/10 shadow-sm overflow-hidden flex flex-col">
      <div
        className="px-5 py-4 flex items-center gap-3 border-b border-[#0A3D52]/10"
        style={{ background: `${disciplinaCor}0D` }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0"
          style={{ background: disciplinaCor }}
        >
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <h3 className="font-black text-sm uppercase tracking-wider text-[#0A3D52]">
            Assistente de Estudos
          </h3>
          <p className="text-[10px] font-bold text-[#0A3D52]/40 uppercase tracking-widest">
            Tutor IA • contexto local
          </p>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3 max-h-[360px] min-h-[200px]"
      >
        {messages.map((m, i) => (
          <div
            key={i}
            className={cn(
              "flex gap-2.5",
              m.role === "user" ? "flex-row-reverse" : "flex-row",
            )}
          >
            <div
              className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                m.role === "user"
                  ? "bg-[#0A3D52] text-white"
                  : "text-white",
              )}
              style={m.role === "assistant" ? { background: disciplinaCor } : undefined}
            >
              {m.role === "user" ? (
                <User className="w-3.5 h-3.5" />
              ) : (
                <Bot className="w-3.5 h-3.5" />
              )}
            </div>
            <div
              className={cn(
                "text-sm leading-relaxed px-3.5 py-2.5 rounded-2xl max-w-[80%]",
                m.role === "user"
                  ? "bg-[#0A3D52] text-white rounded-tr-sm"
                  : "bg-[#F5F7FA] text-[#0A3D52] rounded-tl-sm",
              )}
            >
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0"
              style={{ background: disciplinaCor }}
            >
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="bg-[#F5F7FA] text-[#0A3D52] px-3.5 py-3 rounded-2xl rounded-tl-sm">
              <span className="inline-flex gap-1">
                <span className="w-1.5 h-1.5 bg-[#0A3D52]/40 rounded-full animate-bounce" />
                <span
                  className="w-1.5 h-1.5 bg-[#0A3D52]/40 rounded-full animate-bounce"
                  style={{ animationDelay: "0.15s" }}
                />
                <span
                  className="w-1.5 h-1.5 bg-[#0A3D52]/40 rounded-full animate-bounce"
                  style={{ animationDelay: "0.3s" }}
                />
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-[#0A3D52]/10 p-3 flex gap-2 items-end">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={1}
          placeholder="Pergunte sobre a disciplina..."
          className="flex-1 resize-none bg-[#F5F7FA] rounded-xl px-3.5 py-2.5 text-sm text-[#0A3D52] placeholder:text-[#0A3D52]/30 outline-none focus:ring-2 focus:ring-[#D4941E]/40 max-h-28"
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 disabled:opacity-40 transition-opacity cursor-pointer"
          style={{ background: disciplinaCor }}
          aria-label="Enviar"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
