// scripts/seed-database.ts
// Semeia o Supabase com disciplinas, eventos e checkpoints usando Service Role Key.
import { createClient } from "@supabase/supabase-js";
import { disciplinas } from "../src/data/disciplines";
import { eventos as STATIC_EVENTOS } from "../src/data/events";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function seed() {
  console.log("Seeding disciplinas...");
  const disciplinasRows = disciplinas.map((d) => ({
    id: d.id,
    nome: d.nome,
    codigo: d.codigo,
    icone: d.icone,
    cor: d.coordenador ? undefined : d.cor,
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
  if (eDisc) {
    console.error("Erro disciplinas:", eDisc.message);
  } else {
    console.log(`  ✓ ${disciplinasRows.length} disciplinas inseridas`);
  }

  console.log("Seeding eventos...");
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

  const { error: eEvt } = await sb.from("eventos").upsert(eventosRows, { onConflict: "id" });
  if (eEvt) {
    console.error("Erro eventos:", eEvt.message);
  } else {
    console.log(`  ✓ ${eventosRows.length} eventos inseridos`);
  }

  console.log("Seeding checkpoints...");
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
  if (eCp) {
    console.error("Erro checkpoints:", eCp.message);
  } else {
    console.log(`  ✓ ${checkpointRows.length} checkpoints inseridos`);
  }

  console.log("\nSeed completo!");
}

seed().catch(console.error);
