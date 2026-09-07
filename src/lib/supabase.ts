// src/lib/supabase.ts
// Cliente Supabase (browser). A chave anon é pública por design.
// Toda leitura/gravação passa por RLS permissiva (Frente 1: anon pode ler/escrever).
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const env = import.meta.env as any;
const url: string | undefined = env.VITE_SUPABASE_URL;
const anonKey: string | undefined = env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!client) {
    client = createClient(url as string, anonKey as string, {
      auth: { persistSession: false },
    });
  }
  return client;
}
