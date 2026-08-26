import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  GraduationCap,
  Menu,
  LayoutDashboard,
  Calendar as CalendarIcon,
  BookOpen,
  FileText,
  Settings,
  MessageSquare,
  Send,
  Users,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  getChatRooms,
  loadMessages,
  sendMessage,
  subscribeMessages,
  type ChatMessage,
} from "@/lib/chatService";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { isSupabaseConfigured } from "@/lib/seed";
import { disciplinas } from "@/data/disciplines";

export const Route = createFileRoute("/community/chat")({
  component: CommunityChat,
  head: () => ({
    title: "Salas de Aula Virtuais | Comunidade CEDERJ",
    meta: [
      {
        name: "description",
        content: "Converse em tempo real com colegas da sua disciplina.",
      },
    ],
  }),
});

const rooms = getChatRooms();

function CommunityChat() {
  const [selectedRoomId, setSelectedRoomId] = useState(disciplinas[0]?.id || "");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [userName, setUserName] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("rdf:user_name") || "";
    }
    return "";
  });
  const [showNameInput, setShowNameInput] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const subRef = useRef<(() => void) | null>(null);

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId) ||
    disciplinas.find((d) => d.id === selectedRoomId);

  const loadAndSubscribe = useCallback(async (roomId: string) => {
    if (subRef.current) {
      subRef.current();
      subRef.current = null;
    }
    const msgs = await loadMessages(roomId);
    setMessages(msgs);

    const unsub = subscribeMessages(roomId, (msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });
    subRef.current = unsub;
  }, []);

  useEffect(() => {
    if (selectedRoomId) {
      loadAndSubscribe(selectedRoomId);
    }
    return () => {
      if (subRef.current) subRef.current();
    };
  }, [selectedRoomId, loadAndSubscribe]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    if (!userName.trim()) {
      setShowNameInput(true);
      return;
    }

    const msg = await sendMessage(selectedRoomId, userName, newMessage.trim());
    setMessages((prev) => {
      if (prev.some((m) => m.id === msg.id)) return prev;
      return [...prev, msg];
    });
    setNewMessage("");
  };

  const handleSetName = () => {
    if (userName.trim()) {
      localStorage.setItem("rdf:user_name", userName.trim());
      setShowNameInput(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#F5F7FA] text-[#0A3D52]">
      <nav className="bg-[#0A3D52] text-white px-4 py-3 shadow-md z-40 shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Sheet>
              <SheetTrigger asChild>
                <button className="p-2 hover:bg-white/10 rounded-xl transition-colors md:hidden cursor-pointer">
                  <Menu className="w-6 h-6 text-[#D4941E]" />
                </button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="bg-[#0A3D52] text-white border-[#D4941E]/20 p-0"
              >
                <div className="p-6 pt-12 flex flex-col gap-6">
                  <div className="flex items-center gap-2 mb-4">
                    <GraduationCap className="w-8 h-8 text-[#D4941E]" />
                    <span className="font-bold text-lg tracking-tight uppercase">
                      Menu Acadêmico
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <MobileNavLink to="/" icon={LayoutDashboard} label="Dashboard" />
                    <MobileNavLink
                      to="/calendar"
                      icon={CalendarIcon}
                      label="Calendário"
                    />
                    <MobileNavLink
                      to="/disciplines"
                      icon={BookOpen}
                      label="Disciplinas"
                    />
                    <MobileNavLink to="/materials" icon={FileText} label="Materiais" />
                    <MobileNavLink
                      to="/community"
                      icon={MessageSquare}
                      label="Comunidade"
                    />
                    <MobileNavLink
                      to="/settings"
                      icon={Settings}
                      label="Configurações"
                    />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            <div className="flex items-center gap-3">
              <Link
                to="/community"
                className="hover:bg-white/10 p-2 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="font-bold text-lg uppercase tracking-tight hidden sm:inline">
                Salas de Estudo
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full border border-white/10">
            <Users className="w-4 h-4 text-[#D4941E]" />
            <span className="text-[10px] font-black uppercase tracking-widest">
              {isSupabaseConfigured ? "Realtime" : "Local"}
            </span>
          </div>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden max-w-7xl w-full mx-auto">
        <aside className="w-80 bg-white border-r border-[#0A3D52]/10 hidden lg:flex flex-col">
          <div className="p-6 border-b border-[#0A3D52]/5">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0A3D52]/40">
              Suas Disciplinas
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {disciplinas.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelectedRoomId(d.id)}
                className={cn(
                  "w-full text-left p-4 rounded-2xl transition-all group",
                  selectedRoomId === d.id
                    ? "bg-[#0A3D52] text-white shadow-lg"
                    : "hover:bg-[#F5F7FA] text-[#0A3D52]",
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl group-hover:scale-110 transition-transform">
                    {d.icone}
                  </span>
                  <div>
                    <h4 className="font-bold text-xs truncate max-w-[180px]">
                      {d.nome}
                    </h4>
                    <p
                      className={cn(
                        "text-[8px] font-black uppercase tracking-tighter mt-0.5",
                        selectedRoomId === d.id
                          ? "text-white/60"
                          : "text-[#0A3D52]/40",
                      )}
                    >
                      {d.codigo}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </aside>

        <div className="flex-1 flex flex-col bg-white">
          <div className="p-4 border-b border-[#0A3D52]/5 lg:hidden bg-white">
            <select
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              className="w-full bg-[#F5F7FA] border-none rounded-xl px-4 py-2 text-sm font-bold text-[#0A3D52]"
            >
              {disciplinas.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.icone} {d.nome}
                </option>
              ))}
            </select>
          </div>

          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#F5F7FA]/30"
          >
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                <MessageSquare className="w-16 h-16 mb-4" />
                <p className="font-black uppercase tracking-widest text-sm">
                  Comece uma conversa!
                </p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex flex-col max-w-[80%]",
                    msg.userId === "anon"
                      ? "ml-auto items-end"
                      : "items-start",
                  )}
                >
                  <div className="flex items-center gap-2 mb-1 px-2">
                    <span className="text-[10px] font-black uppercase tracking-tighter text-[#0A3D52]/40">
                      {msg.userName}
                    </span>
                    <span className="text-[8px] font-bold text-[#0A3D52]/20">
                      {format(new Date(msg.createdAt), "HH:mm")}
                    </span>
                  </div>
                  <div
                    className={cn(
                      "p-4 rounded-2xl shadow-sm text-sm font-medium leading-relaxed",
                      msg.userId === "anon"
                        ? "bg-[#0A3D52] text-white rounded-tr-none"
                        : "bg-white text-[#0A3D52] rounded-tl-none border border-[#0A3D52]/10",
                    )}
                  >
                    {msg.content}
                  </div>
                </div>
              ))
            )}
          </div>

          {showNameInput && (
            <div className="p-4 border-t border-[#D4941E]/20 bg-[#D4941E]/5">
              <div className="max-w-4xl mx-auto flex gap-3 items-center">
                <span className="text-xs font-bold text-[#0A3D52]/60 whitespace-nowrap">
                  Seu nome:
                </span>
                <input
                  type="text"
                  placeholder="Ex.: Carlos"
                  className="flex-1 bg-white border-none rounded-2xl px-4 py-2 text-sm focus:ring-2 focus:ring-[#D4941E]"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSetName()}
                  autoFocus
                />
                <button
                  onClick={handleSetName}
                  className="bg-[#D4941E] text-[#0A3D52] px-4 py-2 rounded-2xl font-black text-xs uppercase tracking-widest"
                >
                  OK
                </button>
              </div>
            </div>
          )}

          <div className="p-4 border-t border-[#0A3D52]/5 bg-white">
            <div className="max-w-4xl mx-auto flex gap-3">
              <input
                type="text"
                placeholder="Digite sua mensagem..."
                className="flex-1 bg-[#F5F7FA] border-none rounded-2xl px-6 py-3 text-sm focus:ring-2 focus:ring-[#D4941E] transition-all font-medium"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
              />
              <button
                onClick={handleSend}
                className="bg-[#D4941E] text-[#0A3D52] p-3 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-md"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MobileNavLink({
  to,
  icon: Icon,
  label,
}: {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/10 text-white"
      activeProps={{ className: "bg-white/10 border-white/20 text-[#D4941E]" }}
    >
      <Icon className="w-5 h-5" />
      <span className="font-black text-xs uppercase tracking-widest">{label}</span>
    </Link>
  );
}
