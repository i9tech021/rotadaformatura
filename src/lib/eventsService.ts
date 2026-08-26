// src/lib/eventsService.ts
// Fonte de eventos: Supabase quando configurado, senão dados estáticos (events.ts).
// Mantém o app funcional mesmo sem banco (fallback) — não quebra o build nem o deploy.
import { getSupabase } from "./supabase";
import {
  eventos as STATIC_EVENTOS,
  TIPOS_ACAO,
  prazoDe,
  type EventoAcademico,
} from "@/data/events";

function rowToEvento(r: Record<string, any>): EventoAcademico {
  return {
    id: r.id,
    titulo: r.titulo,
    disciplinaId: r.disciplina_id,
    disciplinaNome: r.disciplina_nome,
    disciplinaCodigo: r.disciplina_codigo,
    disciplinaCor: r.disciplina_cor,
    tipo: r.tipo,
    dataInicio: r.data_inicio,
    dataFim: r.data_fim ?? undefined,
    horario: r.horario ?? undefined,
    local: r.local ?? undefined,
    conteudo: r.conteudo,
    peso: r.peso ?? undefined,
    observacoes: r.observacoes ?? undefined,
    alertaDias: r.alerta_dias ?? 7,
  };
}

function ordenaAcao(lista: EventoAcademico[]): EventoAcademico[] {
  return lista
    .filter((e) => (TIPOS_ACAO as readonly string[]).includes(e.tipo))
    .sort((a, b) => prazoDe(a).getTime() - prazoDe(b).getTime());
}

export async function getEventosAcao(): Promise<EventoAcademico[]> {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb.from("eventos").select("*");
    if (!error && data && data.length) return ordenaAcao(data.map(rowToEvento));
  }
  return ordenaAcao(STATIC_EVENTOS);
}

export async function getEventosPorDisciplina(
  disciplinaId: string,
): Promise<EventoAcademico[]> {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb
      .from("eventos")
      .select("*")
      .eq("disciplina_id", disciplinaId);
    if (!error && data) return data.map(rowToEvento);
  }
  return STATIC_EVENTOS.filter((e) => e.disciplinaId === disciplinaId);
}

/**
 * Assina mudanças em tempo real na tabela `eventos` (Supabase Realtime).
 * `onChange` é chamado a cada insert/update/delete. Retorna função p/ cancelar.
 * Sem Supabase configurado, vira no-op (app segue funcional com dados estáticos).
 */
export function subscribeEventos(onChange: () => void): () => void {
  const sb = getSupabase();
  if (!sb) return () => {};
  const channel = sb
    .channel("rdf-eventos")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "eventos" },
      () => onChange(),
    )
    .subscribe();
  return () => {
    sb.removeChannel(channel);
  };
}
