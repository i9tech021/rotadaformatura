// src/routes/community/index.tsx
// Hub da comunidade: Conversas (salas realtime por disciplina) + Materiais
// (publicações da turma em realtime). Tudo ao vivo via Supabase Realtime.
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  GraduationCap,
  Menu,
  MessageSquare,
  FileText,
  Send,
  ChevronRight,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AppBottomNav, AppDesktopNav, AppMobileMenu } from "@/components/AppNav";
import { useCallback, useEffect, useState } from "react";
import { disciplinas } from "@/data/disciplines";
import { getChatRooms, loadMessages, subscribeAllMessages } from "@/lib/chatService";
import type { ChatMessage } from "@/data/chat";
import {
  denunciarPublicacao,
  excluirPublicacao,
  getIdentidade,
  listPublicacoes,
  subscribePublicacoes,
  type Publicacao,
  type TipoPublicacao,
} from "@/lib/publicacoesService";
import { PublicacaoCard } from "@/components/PublicacaoCard";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export const Route = createFileRoute("/community/")({
  component: CommunityHub,
  head: () => ({
    title: "Comunidade | Rota da Formatura",
    meta: [
      {
        name: "description",
        content: "Converse em tempo real e troque materiais com a turma do CEDERJ.",
      },
    ],
  }),
});

type Aba = "conversas" | "materiais";

function CommunityHub() {
  const [aba, setAba] = useState<Aba>("conversas");
  const [ultimas, setUltimas] = useState<Record<string, ChatMessage>>({});
  const [online, setOnline] = useState(false);

  const [publicacoes, setPublicacoes] = useState<Publicacao[]>([]);
  const [filtroTipo, setFiltroTipo] = useState<TipoPublicacao | "todos">("todos");
  const identidade = getIdentidade();

  const recarregarMateriais = useCallback(async () => {
    const lista = await listPublicacoes();
    setPublicacoes(lista);
  }, []);

  // Previews das salas + realtime global
  useEffect(() => {
    let vivo = true;
    Promise.all(
      disciplinas.map(async (d) => {
        const msgs = await loadMessages(d.id).catch(() => []);
        return [d.id, msgs[msgs.length - 1]] as const;
      }),
    ).then((pares) => {
      if (!vivo) return;
      const map: Record<string, ChatMessage> = {};
      for (const [id, msg] of pares) if (msg) map[id] = msg;
      setUltimas(map);
    });
    const unsub = subscribeAllMessages((msg) => {
      setOnline(true);
      if (!msg.salaId) return;
      setUltimas((prev) => ({ ...prev, [msg.salaId]: msg }));
    });
    return () => {
      vivo = false;
      unsub();
    };
  }, []);

  // Materiais em realtime
  useEffect(() => {
    recarregarMateriais();
    return subscribePublicacoes(recarregarMateriais);
  }, [recarregarMateriais]);

  const handleExcluir = async (p: Publicacao) => {
    const r = await excluirPublicacao(p);
    if (!r.ok) {
      toast.error(r.error || "Não foi possível excluir.");
      return;
    }
    toast.success("Publicação excluída.");
    recarregarMateriais();
  };

  const handleDenunciar = async (p: Publicacao) => {
    const r = await denunciarPublicacao(p.id);
    if (r.ok) toast.success("Denúncia registrada. Obrigado!");
  };

  const filtradas =
    filtroTipo === "todos" ? publicacoes : publicacoes.filter((p) => p.tipo === filtroTipo);
  const rooms = getChatRooms();
  const salaNome = (id: string) =>
    disciplinas.find((d) => d.id === id)?.nome ?? rooms.find((r) => r.id === id)?.name ?? id;

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#0A3D52] pb-20">
      {/* Header */}
      <nav className="bg-[#0A3D52] text-white px-4 py-4 shadow-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Sheet>
              <SheetTrigger asChild>
                <button className="p-2 hover:bg-white/10 rounded-xl transition-colors md:hidden cursor-pointer">
                  <Menu className="w-6 h-6 text-[#D4941E]" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="bg-[#0A3D52] text-white border-[#D4941E]/20 p-0">
                <AppMobileMenu />
              </SheetContent>
            </Sheet>
            <div className="flex items-center gap-3">
              <Link to="/" className="hover:bg-white/10 p-2 rounded-full transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="font-bold text-lg uppercase tracking-tight hidden min-[420px]:inline">
                Comunidade
              </h1>
              {online && (
                <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-[#27AE60]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#27AE60] animate-pulse" />
                  Ao vivo
                </span>
              )}
            </div>
          </div>
          <AppDesktopNav />
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Abas */}
        <div className="grid grid-cols-2 gap-2 bg-white rounded-2xl border border-[#0A3D52]/10 p-2 shadow-sm">
          {(
            [
              { v: "conversas", l: "Conversas", icon: MessageSquare },
              { v: "materiais", l: "Materiais", icon: FileText },
            ] as const
          ).map((t) => (
            <button
              key={t.v}
              onClick={() => setAba(t.v)}
              className={cn(
                "flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all cursor-pointer",
                aba === t.v
                  ? "bg-[#0A3D52] text-white shadow"
                  : "text-[#0A3D52]/50 hover:bg-[#F5F7FA]",
              )}
            >
              <t.icon className="w-4 h-4" /> {t.l}
            </button>
          ))}
        </div>

        {aba === "conversas" ? (
          <div className="space-y-3">
            {disciplinas.map((d) => {
              const ultima = ultimas[d.id];
              return (
                <Link
                  key={d.id}
                  to="/community/chat"
                  search={{ room: d.id }}
                  className="flex items-center gap-3 bg-white rounded-2xl border border-[#0A3D52]/10 p-4 shadow-sm hover:border-[#D4941E]/40 hover:shadow-md transition-all"
                >
                  <div className="w-11 h-11 rounded-2xl bg-[#0A3D52]/5 flex items-center justify-center text-xl shrink-0">
                    {d.icone}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-sm truncate">{d.nome}</h4>
                    <p className="text-xs text-[#0A3D52]/50 truncate font-medium">
                      {ultima ? (
                        <>
                          <span className="font-bold">{ultima.userName}:</span> {ultima.content}
                        </>
                      ) : (
                        "Toque para conversar com a turma"
                      )}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    {ultima && (
                      <p className="text-[9px] font-bold text-[#0A3D52]/40 uppercase">
                        {formatDistanceToNow(new Date(ultima.createdAt), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                    )}
                    <ChevronRight className="w-4 h-4 text-[#D4941E] ml-auto mt-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {(
                [
                  { v: "todos", l: "Tudo" },
                  { v: "podcast", l: "🎧 Podcasts" },
                  { v: "pdf", l: "📄 PDFs" },
                  { v: "nota", l: "📝 Notas" },
                ] as const
              ).map((t) => (
                <button
                  key={t.v}
                  onClick={() => setFiltroTipo(t.v)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all shrink-0 border cursor-pointer",
                    filtroTipo === t.v
                      ? "bg-[#0A3D52] text-white border-[#0A3D52]"
                      : "bg-white text-[#0A3D52]/50 border-[#0A3D52]/10",
                  )}
                >
                  {t.l}
                </button>
              ))}
            </div>

            {filtradas.length === 0 ? (
              <div className="bg-white p-8 rounded-3xl border border-dashed border-[#0A3D52]/10 text-center">
                <FileText className="w-10 h-10 mx-auto mb-3 text-[#0A3D52]/20" />
                <p className="font-bold text-xs uppercase tracking-widest text-[#0A3D52]/40">
                  Nenhum material ainda
                </p>
                <Link
                  to="/publicacoes"
                  className="inline-flex items-center gap-2 mt-4 bg-[#D4941E] text-[#0A3D52] px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-[0.2em]"
                >
                  <Send className="w-3.5 h-3.5" /> Publicar material
                </Link>
              </div>
            ) : (
              filtradas.map((p) => {
                const disc = disciplinas.find((d) => d.id === p.disciplina_id);
                return (
                  <PublicacaoCard
                    key={p.id}
                    publicacao={p}
                    disciplinaCor={disc?.cor ?? "#0A3D52"}
                    disciplinaNome={disc?.nome ?? salaNome(p.disciplina_id)}
                    ehAutor={!!identidade && p.autor_local_id === identidade.autorLocalId}
                    aoExcluir={handleExcluir}
                    aoDenunciar={handleDenunciar}
                  />
                );
              })
            )}
          </div>
        )}
      </main>

      <AppBottomNav />
    </div>
  );
}
