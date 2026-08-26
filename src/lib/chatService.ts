// src/lib/chatService.ts
// Chat comunitário: Supabase Realtime quando configurado, senão fallback local.
import { getSupabase } from "./supabase";
import { MOCK_CHAT_ROOMS, type ChatMessage, type ChatRoom } from "@/data/chat";

const LS_KEY = "rdf:chat:local";

function loadLocal(roomId: string): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const all = JSON.parse(localStorage.getItem(LS_KEY) || "{}");
    return all[roomId] || [];
  } catch {
    return [];
  }
}

function saveLocal(roomId: string, msgs: ChatMessage[]) {
  if (typeof window === "undefined") return;
  try {
    const all = JSON.parse(localStorage.getItem(LS_KEY) || "{}");
    all[roomId] = msgs;
    localStorage.setItem(LS_KEY, JSON.stringify(all));
  } catch {
    // ignore
  }
}

export function getChatRooms(): ChatRoom[] {
  return MOCK_CHAT_ROOMS;
}

export async function loadMessages(roomId: string): Promise<ChatMessage[]> {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb
      .from("chat_messages")
      .select("*")
      .eq("sala_id", roomId)
      .order("created_at", { ascending: true });
    if (!error && data?.length) {
      return data.map((r: Record<string, unknown>) => ({
        id: r.id as string,
        userId: (r.user_id as string) || "anon",
        userName: (r.user_name as string) || "Estudante",
        content: r.content as string,
        createdAt: (r.created_at as string) || new Date().toISOString(),
      }));
    }
  }
  const local = loadLocal(roomId);
  if (local.length) return local;
  const mock = MOCK_CHAT_ROOMS.find((r) => r.id === roomId);
  return mock?.messages || [];
}

export async function sendMessage(
  roomId: string,
  userName: string,
  content: string,
): Promise<ChatMessage> {
  const msg: ChatMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    userId: "anon",
    userName,
    content,
    createdAt: new Date().toISOString(),
  };

  const sb = getSupabase();
  if (sb) {
    const { error } = await sb.from("chat_messages").insert({
      id: msg.id,
      sala_id: roomId,
      user_name: userName,
      content: msg.content,
    });
    if (error) console.warn("chat insert error:", error.message);
  } else {
    const existing = loadLocal(roomId);
    saveLocal(roomId, [...existing, msg]);
  }
  return msg;
}

export function subscribeMessages(
  roomId: string,
  onMessage: (msg: ChatMessage) => void,
): () => void {
  const sb = getSupabase();
  if (!sb) return () => {};
  const channel = sb
    .channel(`rdf-chat-${roomId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "chat_messages",
        filter: `sala_id=eq.${roomId}`,
      },
      (payload) => {
        const r = payload.new as Record<string, unknown>;
        onMessage({
          id: r.id as string,
          userId: (r.user_id as string) || "anon",
          userName: (r.user_name as string) || "Estudante",
          content: r.content as string,
          createdAt: (r.created_at as string) || new Date().toISOString(),
        });
      },
    )
    .subscribe();
  return () => {
    sb.removeChannel(channel);
  };
}
