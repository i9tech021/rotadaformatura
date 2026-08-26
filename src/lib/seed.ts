// src/lib/seed.ts
// Semeia o Supabase com os dados reais (sem inventar nada). Idempotente via upsert no id.
import { getSupabase, isSupabaseConfigured } from "./supabase";
import { disciplinas } from "@/data/disciplines";
import { eventos as STATIC_EVENTOS } from "@/data/events";

export interface SeedResult {
  ok: boolean;
  message: string;
  detalhes?: { disciplinas: number; eventos: number; checkpoints: number };
}

export async function seedDatabase(): Promise<SeedResult> {
  const sb = getSupabase();
  if (!sb) {
    return {
      ok: false,
      message:
        "Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.",
    };
  }

  // 1) Disciplinas
  const disciplinasRows = disciplinas.map((d) => ({
    id: d.id,
    nome: d.nome,
    codigo: d.codigo,
    icone: d.icone,
    cor: d.cor,
    coordenador: d.coordenador,
    total_aulas: d.totalAulas,
    periodo: d.period ?? null,
    ch: d.ch ?? null,
    progresso: d.progresso ?? 0,
    guia_objetivo: d.guia?.objetivoGeral ?? null,
    guia_metodo: d.guia?.metodoEstudo ?? null,
    formula_n1: d.formulaNota?.n1 ?? null,
    formula_n2: d.formulaNota?.n2 ?? null,
    formula_aprovacao: d.formulaNota?.aprovacao ?? null,
    formula_ap3: d.formulaNota?.ap3 ?? null,
    semestre: "2026-2",
  }));
  const { error: eDisc } = await sb
    .from("disciplinas")
    .upsert(disciplinasRows, { onConflict: "id" });
  if (eDisc) return { ok: false, message: `Erro ao semear disciplinas: ${eDisc.message}` };

  // 2) Eventos
  const eventosRows = STATIC_EVENTOS.map((e) => ({
    id: e.id,
    disciplina_id: e.disciplinaId,
    disciplina_nome: e.disciplinaNome,
    disciplina_codigo: e.disciplinaCodigo,
    disciplina_cor: e.disciplinaCor,
    titulo: e.titulo,
    tipo: e.tipo,
    data_inicio: e.dataInicio,
    data_fim: e.dataFim ?? null,
    horario: e.horario ?? null,
    local: e.local ?? null,
    conteudo: e.conteudo,
    peso: e.peso ?? null,
    observacoes: e.observacoes ?? null,
    alerta_dias: e.alertaDias,
  }));
  const { error: eEvt } = await sb
    .from("eventos")
    .upsert(eventosRows, { onConflict: "id" });
  if (eEvt) return { ok: false, message: `Erro ao semear eventos: ${eEvt.message}` };

  // 3) Checkpoints (1 por aula, concluido=false por padrão)
  const checkpointRows = disciplinas.flatMap((d) =>
    d.aulas.map((a) => ({
      aula_id: a.id,
      disciplina_id: d.id,
      concluido: false,
    })),
  );
  const { error: eCp } = await sb
    .from("checkpoints")
    .upsert(checkpointRows, { onConflict: "aula_id" });
  if (eCp) return { ok: false, message: `Erro ao semear checkpoints: ${eCp.message}` };

  return {
    ok: true,
    message: "Banco semeado com sucesso!",
    detalhes: {
      disciplinas: disciplinasRows.length,
      eventos: eventosRows.length,
      checkpoints: checkpointRows.length,
    },
  };
}

export { isSupabaseConfigured };
