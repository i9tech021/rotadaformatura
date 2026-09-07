// scripts/test-simulado-provas.ts — rode: bun scripts/test-simulado-provas.ts
// Testa: limite semanal, upload/validação PDF, extração real (pdf.js),
// geração com IA REAL a partir das provas, correção e banco.
const store = new Map<string, string>();
// @ts-expect-error stub de teste
globalThis.localStorage = {
  getItem: (k: string) => (store.has(k) ? (store.get(k) as string) : null),
  setItem: (k: string, v: string) => void store.set(k, String(v)),
  removeItem: (k: string) => void store.delete(k),
  clear: () => store.clear(),
  get length() {
    return store.size;
  },
  key: (i: number) => [...store.keys()][i] ?? null,
};

const { podeGerarSimulado, montarSimulado, corrigirSimulado } =
  await import("../src/lib/simuladoService");
const { extrairTextoPdf, uploadProva } = await import("../src/lib/provasService");
const { validarQuestao } = await import("../src/lib/questoesService");

let falhas = 0;
function ok(cond: boolean, msg: string) {
  console.log(cond ? `PASS  ${msg}` : `FAIL  ${msg}`);
  if (!cond) falhas++;
}

const AUTOR = "teste-autor-provas";
const AUTOR2 = "teste-autor-provas-2";
const DISC = "metodos-deterministicos-i";

// 1. limite: novo autor pode gerar
const p1 = await podeGerarSimulado(AUTOR);
ok(p1.pode === true, "autor novo pode gerar");

// 2. montar SEM provas → agora funciona via fallback offline
const m0 = await montarSimulado({
  autorLocalId: AUTOR,
  disciplinaId: DISC,
  disciplinaNome: "Métodos Determinísticos I",
  tipo: "AP1",
  quantidade: 10,
});
console.log("m0 modo:", m0.ok ? m0.modo : m0.error);
ok(m0.ok === true, "sem provas gera via fallback offline");

// 3. upload rejeita não-PDF
const txt = new File(["oi"], "nota.txt", { type: "text/plain" });
const rTxt = await uploadProva({
  disciplinaId: DISC,
  tipo: "AP1",
  titulo: "x",
  arquivo: txt,
  autorLocalId: AUTOR,
});
ok(rTxt.ok === false, "upload rejeita arquivo não-PDF");

// 4. PDF mínimo real → extração funciona
const pdfSrc = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj
4 0 obj<</Length 120>>stream
BT /F1 24 Tf 100 700 Td (QUESTAO 1 Resolva dois mais dois na prova) Tj ET
endstream
endobj
5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
trailer<</Root 1 0 R>>`;
const pdfFile = new File([pdfSrc], "ap1-teste.pdf", { type: "application/pdf" });
let textoPdf = "";
try {
  const ext = await extrairTextoPdf(pdfFile);
  textoPdf = ext.texto;
  ok(ext.texto.includes("QUESTAO") && ext.numPaginas === 1, "pdf.js extrai texto do PDF");
} catch (e) {
  ok(false, `pdf.js extrai texto do PDF (${e instanceof Error ? e.message : e})`);
}

// 5. semeia 3 provas e gera com IA REAL
const base =
  textoPdf.trim().length > 50
    ? textoPdf
    : "Prova AP1 Métodos Determinísticos: conjuntos, equações do primeiro grau, proposições lógicas, tabelas verdade, porcentagens, potências e radicais.";
const provasSeed = [1, 2, 3].map((i) => ({
  id: `prova-seed-${i}`,
  disciplina_id: DISC,
  tipo: "AP1",
  titulo: `AP1 202${i} Métodos`,
  url: "local",
  texto_extraido: `${base} (conteúdo da prova ${i}: equações, conjuntos e lógica proposicional)`,
  num_paginas: 4,
  autor_local_id: AUTOR,
  criado_em: new Date().toISOString(),
}));
store.set("rdf:provas", JSON.stringify(provasSeed));

console.log("chamando IA real (pode levar ~1min)...");
const m = await montarSimulado({
  autorLocalId: AUTOR2,
  disciplinaId: DISC,
  disciplinaNome: "Métodos Determinísticos I",
  tipo: "AP1",
  quantidade: 10,
});
ok(m.ok === true, `IA gera simulado a partir das provas (${m.ok ? m.modo : m.error})`);
if (m.ok) {
  ok(
    m.sessao.questoesCompletas.length === 10,
    `10 questões (${m.sessao.questoesCompletas.length})`,
  );
  ok(m.provasUsadas >= 3, `baseado em ${m.provasUsadas} provas`);
  const todasValidas = m.sessao.questoesCompletas.every(
    (q) => validarQuestao(q) !== null && q.alternativas.length === 4,
  );
  ok(todasValidas, "todas as questões válidas (4 alternativas, índice ok)");
  const gab = m.sessao.questoesCompletas.map((q) => q.resposta_correta);
  const c = await corrigirSimulado(m.sessao.id, gab);
  ok(c?.nota === 10 && c?.percentual === 100, `gabarito → nota 10 (${c?.nota})`);
}

// 6. segunda geração bloqueada
const p2 = await podeGerarSimulado(AUTOR);
ok(p2.pode === false && !!p2.liberaEm, "segunda geração bloqueada com data");

console.log(falhas === 0 ? "\nTODOS OS TESTES PASSARAM" : `\n${falhas} FALHA(S)`);
process.exit(falhas === 0 ? 0 : 1);
