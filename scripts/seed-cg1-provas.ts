// scripts/seed-cg1-provas.ts
// Insere provas de teste de CG1 no Supabase (texto já extraído via pdftotext).
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function seedProvas() {
  const provas = [
    {
      arquivo: "/tmp/cg1-materials/lista-exercicios.txt",
      titulo: "Lista de Exercícios - Contabilidade Geral I",
      tipo: "AP1",
      disciplina_id: "contabilidade-geral-i",
    },
    {
      arquivo: "/tmp/cg1-materials/apostila-200-questoes.txt",
      titulo: "Apostila 200 Questões Resolvidas - Contabilidade Geral",
      tipo: "AP1",
      disciplina_id: "contabilidade-geral-i",
    },
  ];

  for (const prova of provas) {
    console.log(`Processando: ${prova.titulo}...`);
    try {
      const texto = readFileSync(prova.arquivo, "utf-8").slice(0, 40000);
      const numPaginas = Math.ceil(texto.length / 3000);
      console.log(`  Texto: ${texto.length} caracteres`);

      const id = `prova-cg1-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const { error } = await sb.from("provas_antigas").insert({
        id,
        disciplina_id: prova.disciplina_id,
        tipo: prova.tipo,
        titulo: prova.titulo,
        url: `local://${prova.arquivo}`,
        texto_extraido: texto,
        num_paginas: numPaginas,
        autor_local_id: "seed-admin",
      });

      if (error) {
        console.error(`  Erro ao inserir: ${error.message}`);
      } else {
        console.log(`  ✓ Inserido com ID: ${id}`);
      }
    } catch (err) {
      console.error(`  Erro ao processar: ${err}`);
    }
  }

  // 3ª prova: exercícios complementares (variação do mesmo conteúdo)
  console.log("Criando terceira prova de referência...");
  const textoOriginal = readFileSync("/tmp/cg1-materials/lista-exercicios.txt", "utf-8");
  const id3 = `prova-cg1-ref3-${Date.now()}`;
  const { error: e3 } = await sb.from("provas_antigas").insert({
    id: id3,
    disciplina_id: "contabilidade-geral-i",
    tipo: "AP1",
    titulo: "Exercícios Complementares - Contabilidade Geral I",
    url: "local://exercicios-complementares",
    texto_extraido: textoOriginal.slice(0, 20000),
    num_paginas: 5,
    autor_local_id: "seed-admin",
  });
  if (e3) {
    console.error(`  Erro ao inserir prova 3: ${e3.message}`);
  } else {
    console.log(`  ✓ Prova 3 inserida com ID: ${id3}`);
  }

  console.log("\nSeed de provas CG1 completo!");
}

seedProvas().catch(console.error);
