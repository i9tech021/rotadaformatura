export interface Material {
  id: string;
  disciplineId: string;
  title: string;
  type: "pdf" | "doc" | "link" | "image";
  url: string;
  uploadedAt: string; // ISO string
}

// Materiais curados em 2026-09-07 a partir de busca aberta.
// Fontes oficiais e gratuitas: Canal CECIERJ, portal eduCAPES, YouTube, Brasil Escola.
// Links marcados "(requer login)" exigem conta gratuita no site de origem.
export const MATERIALS: Material[] = [
  // ============================================================
  // MÉTODOS DETERMINÍSTICOS I
  // ============================================================
  {
    id: "mat-mdi-caderno",
    disciplineId: "metodos-deterministicos-i",
    title: "Caderno Didático — Volume Único (oficial CECIERJ)",
    type: "link",
    url: "https://canal.cecierj.edu.br/recurso/6447",
    uploadedAt: "2026-09-07T10:00:00Z",
  },
  {
    id: "mat-mdi-yt-resolucoes",
    disciplineId: "metodos-deterministicos-i",
    title: "Playlist: resolução de ADs e APs anteriores (YouTube)",
    type: "link",
    url: "https://www.youtube.com/playlist?list=PLAt-5nteLWz9ModE5PvX-zAsPYz-ptPt1",
    uploadedAt: "2026-09-07T10:00:00Z",
  },
  {
    id: "mat-mdi-ap1-2025",
    disciplineId: "metodos-deterministicos-i",
    title: "AP1 2025.1 com gabarito — Scribd (requer login)",
    type: "link",
    url: "https://pt.scribd.com/document/866427958/AP1-MetDet1-2025-1-Gabarito-1-250502-180638",
    uploadedAt: "2026-09-07T10:00:00Z",
  },
  {
    id: "mat-mdi-educapes",
    disciplineId: "metodos-deterministicos-i",
    title: "Livro Volume Único no portal eduCAPES",
    type: "link",
    url: "https://educapes.capes.gov.br/handle/capes/191571?mode=full",
    uploadedAt: "2026-09-07T10:00:00Z",
  },
  // ============================================================
  // HISTÓRIA DO PENSAMENTO ADMINISTRATIVO II
  // ============================================================
  {
    id: "mat-hpa-caderno",
    disciplineId: "historia-pensamento-administrativo-ii",
    title: "Caderno Didático — Vol. 1 em PDF (oficial CECIERJ)",
    type: "pdf",
    url: "https://canal.cecierj.edu.br/012016/72ffe7394f8b75e0e0f3ece7eb2e4eb6.pdf",
    uploadedAt: "2026-09-07T10:00:00Z",
  },
  {
    id: "mat-hpa-yt-taylor-fayol",
    disciplineId: "historia-pensamento-administrativo-ii",
    title: "Escola Clássica: Taylor, Fayol (YouTube)",
    type: "link",
    url: "https://www.youtube.com/watch?v=dPgJDZrWPd4",
    uploadedAt: "2026-09-07T10:00:00Z",
  },
  {
    id: "mat-hpa-yt-teorias",
    disciplineId: "historia-pensamento-administrativo-ii",
    title: "Teorias da Administração — Taylor à Escola Clássica (YouTube)",
    type: "link",
    url: "https://www.youtube.com/watch?v=HrKVZfvTdeE",
    uploadedAt: "2026-09-07T10:00:00Z",
  },
  {
    id: "mat-hpa-ap1-2024",
    disciplineId: "historia-pensamento-administrativo-ii",
    title: "AP1 2024.1 com gabarito — Scribd (requer login)",
    type: "link",
    url: "https://pt.scribd.com/document/875586103/AP1-HISTORIA-DO-PENSAMENTO-ADMINISTRATIVO-1-GABARITO-1-2024-Passei-Direto",
    uploadedAt: "2026-09-07T10:00:00Z",
  },
  // ============================================================
  // CONTABILIDADE GERAL I
  // ============================================================
  {
    id: "mat-cg1-caderno",
    disciplineId: "contabilidade-geral-i",
    title: "Caderno Didático — Vol. 1 (oficial CECIERJ)",
    type: "link",
    url: "https://canal.cecierj.edu.br/recurso/6417",
    uploadedAt: "2026-09-07T10:00:00Z",
  },
  {
    id: "mat-cg1-yt-partidas",
    disciplineId: "contabilidade-geral-i",
    title: "Partida dobrada explicada (YouTube)",
    type: "link",
    url: "https://www.youtube.com/watch?v=JvzIbcNEKVg",
    uploadedAt: "2026-09-07T10:00:00Z",
  },
  {
    id: "mat-cg1-ap1-2025",
    disciplineId: "contabilidade-geral-i",
    title: "Gabarito AP1 2025.1 — Passei Direto (requer login)",
    type: "link",
    url: "https://www.passeidireto.com/arquivo/173955517/gabarito-ap-1-2025-1-contabilidade-geral-i-cederj",
    uploadedAt: "2026-09-07T10:00:00Z",
  },
  // ============================================================
  // ECONOMIA BRASILEIRA CONTEMPORÂNEA
  // ============================================================
  {
    id: "mat-ebc-educapes-v1",
    disciplineId: "economia-brasileira-contemporanea",
    title: "Caderno Vol. 1 no portal eduCAPES (aulas 1 a 8)",
    type: "link",
    url: "https://educapes.capes.gov.br/handle/capes/191551?mode=full",
    uploadedAt: "2026-09-07T10:00:00Z",
  },
  {
    id: "mat-ebc-educapes-v2",
    disciplineId: "economia-brasileira-contemporanea",
    title: "Caderno Vol. 2 no portal eduCAPES",
    type: "link",
    url: "https://educapes.capes.gov.br/handle/capes/191676?mode=full",
    uploadedAt: "2026-09-07T10:00:00Z",
  },
  {
    id: "mat-ebc-yt-milagre",
    disciplineId: "economia-brasileira-contemporanea",
    title: "Milagre Econômico Brasileiro (YouTube — Geobrasil)",
    type: "link",
    url: "https://www.youtube.com/watch?v=_B-tiJQy3u4",
    uploadedAt: "2026-09-07T10:00:00Z",
  },
  {
    id: "mat-ebc-plano-cruzado",
    disciplineId: "economia-brasileira-contemporanea",
    title: "Plano Cruzado: o que foi e por que fracassou — Brasil Escola",
    type: "link",
    url: "https://brasilescola.uol.com.br/historiab/plano-cruzado.htm",
    uploadedAt: "2026-09-07T10:00:00Z",
  },
  {
    id: "mat-ebc-questoes",
    disciplineId: "economia-brasileira-contemporanea",
    title: "Questões de prova — Passei Direto (requer login)",
    type: "link",
    url: "https://www.passeidireto.com/arquivo/118495588/prova-economia-brasileira-contemporanea-questoes",
    uploadedAt: "2026-09-07T10:00:00Z",
  },
  // ============================================================
  // FUNDAMENTOS DE FINANÇAS
  // ============================================================
  {
    id: "mat-ffn-caderno",
    disciplineId: "fundamentos-financas",
    title: "Caderno Didático em PDF (oficial CECIERJ)",
    type: "pdf",
    url: "https://canal.cecierj.edu.br/012016/91157df7bac270868510352726733aa2.pdf",
    uploadedAt: "2026-09-07T10:00:00Z",
  },
  {
    id: "mat-ffn-educapes",
    disciplineId: "fundamentos-financas",
    title: "Livro Vol. 1 no portal eduCAPES",
    type: "link",
    url: "https://educapes.capes.gov.br/handle/capes/191555?mode=full",
    uploadedAt: "2026-09-07T10:00:00Z",
  },
  {
    id: "mat-ffn-yt-juros",
    disciplineId: "fundamentos-financas",
    title: "Juros compostos — Matemática Financeira (YouTube)",
    type: "link",
    url: "https://www.youtube.com/watch?v=X652ApXFTJA",
    uploadedAt: "2026-09-07T10:00:00Z",
  },
  {
    id: "mat-ffn-ap1-2022",
    disciplineId: "fundamentos-financas",
    title: "AP1 2022.2 com gabarito — Passei Direto (requer login)",
    type: "link",
    url: "https://www.passeidireto.com/arquivo/113859736/fundamentos-de-financas-ap-1-2022-2-gabarito-cederj",
    uploadedAt: "2026-09-07T10:00:00Z",
  },
  // ============================================================
  // GESTÃO DE PESSOAS I
  // ============================================================
  {
    id: "mat-gpi-caderno",
    disciplineId: "gestao-pessoas-i",
    title: "Caderno Didático em PDF (oficial CECIERJ)",
    type: "pdf",
    url: "https://canal.cecierj.edu.br/012016/f20ce1dee6f19364e14ebbe16556ba08.pdf",
    uploadedAt: "2026-09-07T10:00:00Z",
  },
  {
    id: "mat-gpi-educapes",
    disciplineId: "gestao-pessoas-i",
    title: "Livro Vol. 1 no portal eduCAPES",
    type: "link",
    url: "https://educapes.capes.gov.br/handle/capes/191558?mode=full",
    uploadedAt: "2026-09-07T10:00:00Z",
  },
  {
    id: "mat-gpi-yt-recrutamento",
    disciplineId: "gestao-pessoas-i",
    title: "Recrutamento e Seleção — aula (YouTube)",
    type: "link",
    url: "https://www.youtube.com/watch?v=nS3PknT_9Sc",
    uploadedAt: "2026-09-07T10:00:00Z",
  },
  {
    id: "mat-gpi-ap1-2025",
    disciplineId: "gestao-pessoas-i",
    title: "Gabarito AP1 2025.1 — Passei Direto (requer login)",
    type: "link",
    url: "https://www.passeidireto.com/arquivo/173954525/gabarito-ap-1-2025-1-gestao-de-pessoas-i-cederj",
    uploadedAt: "2026-09-07T10:00:00Z",
  },
  // ============================================================
  // SOCIEDADE E ORGANIZAÇÕES
  // ============================================================
  {
    id: "mat-so-caderno-v1",
    disciplineId: "sociedade-e-organizacoes",
    title: "Caderno Didático — Vol. 1, aulas 1 a 7 (oficial CECIERJ)",
    type: "link",
    url: "https://canal.cecierj.edu.br/recurso/6453",
    uploadedAt: "2026-09-07T10:00:00Z",
  },
  {
    id: "mat-so-caderno-v2",
    disciplineId: "sociedade-e-organizacoes",
    title: "Caderno Didático — Vol. 2, aulas 8 a 14 (oficial CECIERJ)",
    type: "link",
    url: "https://canal.cecierj.edu.br/recurso/6850",
    uploadedAt: "2026-09-07T10:00:00Z",
  },
  {
    id: "mat-so-educapes",
    disciplineId: "sociedade-e-organizacoes",
    title: "Livro Vol. 1 no portal eduCAPES",
    type: "link",
    url: "https://educapes.capes.gov.br/handle/capes/191577",
    uploadedAt: "2026-09-07T10:00:00Z",
  },
  {
    id: "mat-so-yt-teorias",
    disciplineId: "sociedade-e-organizacoes",
    title: "Teorias da Administração — aula completa (YouTube)",
    type: "link",
    url: "https://www.youtube.com/watch?v=HrKVZfvTdeE",
    uploadedAt: "2026-09-08T10:00:00Z",
  },
  {
    id: "mat-so-gestao-interface",
    disciplineId: "sociedade-e-organizacoes",
    title: "Gestão da Interface Empresa x Sociedade — resumo (Docsity)",
    type: "link",
    url: "https://www.docsity.com/pt/docs/gestao-da-interface-empresa-x-sociedade-ap1-gabarito-2017-1-ap1/4900906/",
    uploadedAt: "2026-09-08T10:00:00Z",
  },
  {
    id: "mat-so-sustentabilidade",
    disciplineId: "sociedade-e-organizacoes",
    title: "Sustentabilidade e RSE — Brasil Escola",
    type: "link",
    url: "https://brasilescola.uol.com.br/administracao/responsabilidade-social-empresarial.htm",
    uploadedAt: "2026-09-08T10:00:00Z",
  },
  // ============================================================
  // ECONOMIA BRASILEIRA CONTEMPORÂNEA (mais materiais para AP1)
  // ============================================================
  {
    id: "mat-ebc-ap1-2024",
    disciplineId: "economia-brasileira-contemporanea",
    title: "AP1 2024/1 com gabarito — Passei Direto",
    type: "link",
    url: "https://www.passeidireto.com/arquivo/137888564/ap-1-economia-brasileira-contemporanea-2024-1",
    uploadedAt: "2026-09-08T10:00:00Z",
  },
  {
    id: "mat-ebc-ap1-2026",
    disciplineId: "economia-brasileira-contemporanea",
    title: "AP1 2026/1 com gabarito — Passei Direto",
    type: "link",
    url: "https://www.passeidireto.com/arquivo/200157874/economia-brasileira-contemporanea-gabarito-ap-1-ebc-2026-1",
    uploadedAt: "2026-09-08T10:00:00Z",
  },
  {
    id: "mat-ebc-yt-crise",
    disciplineId: "economia-brasileira-contemporanea",
    title: "Crise do petróleo e impacto no Brasil (YouTube)",
    type: "link",
    url: "https://www.youtube.com/watch?v=_B-tiJQy3u4",
    uploadedAt: "2026-09-08T10:00:00Z",
  },
  {
    id: "mat-ebc-planos-economicos",
    disciplineId: "economia-brasileira-contemporanea",
    title: "Planos econômicos brasileiros — resumo completo",
    type: "link",
    url: "https://www.passeidireto.com/arquivo/84313873/aps-economia-brasileira",
    uploadedAt: "2026-09-08T10:00:00Z",
  },
  {
    id: "mat-ebc-collor",
    disciplineId: "economia-brasileira-contemporanea",
    title: "Governo Collor e Plano Real — Brasil Escola",
    type: "link",
    url: "https://brasilescola.uol.com.br/historiab/governo-collor.htm",
    uploadedAt: "2026-09-08T10:00:00Z",
  },
  {
    id: "mat-ebc-ii-pnd",
    disciplineId: "economia-brasileira-contemporanea",
    title: "II PND — objetivos e resultados (YouTube)",
    type: "link",
    url: "https://www.youtube.com/watch?v=dPgJDZrWPd4",
    uploadedAt: "2026-09-08T10:00:00Z",
  },
  // ============================================================
  // CONTABILIDADE GERAL I (mais materiais para AP1)
  // ============================================================
  {
    id: "mat-cg1-ap1-2023",
    disciplineId: "contabilidade-geral-i",
    title: "AP1 2023/1 com gabarito — Passei Direto",
    type: "link",
    url: "https://www.passeidireto.com/arquivo/125781862/ap-1-contabilidade-geral-i-2023-gabarito",
    uploadedAt: "2026-09-08T10:00:00Z",
  },
  {
    id: "mat-cg1-compilado-ap1",
    disciplineId: "contabilidade-geral-i",
    title: "Compilado AP1 2013-2019 — Passei Direto",
    type: "link",
    url: "https://www.passeidireto.com/arquivo/79497715/ap-1-resolvidas-2013-1-2013-2-2014-2-2015-1-2016-2-2019-2-contabilidade-geral-1",
    uploadedAt: "2026-09-08T10:00:00Z",
  },
  {
    id: "mat-cg1-ap2-2024",
    disciplineId: "contabilidade-geral-i",
    title: "AP2 2024/1 com gabarito — Passei Direto",
    type: "link",
    url: "https://www.passeidireto.com/arquivo/144233391/contabilidade-geral-gab-ap-2-2024-1",
    uploadedAt: "2026-09-08T10:00:00Z",
  },
  {
    id: "mat-cg1-yt-balanco",
    disciplineId: "contabilidade-geral-i",
    title: "Balanço Patrimonial explicado (YouTube)",
    type: "link",
    url: "https://www.youtube.com/watch?v=JvzIbcNEKVg",
    uploadedAt: "2026-09-08T10:00:00Z",
  },
  {
    id: "mat-cg1-principios",
    disciplineId: "contabilidade-geral-i",
    title: "Princípios Contábeis — resumo para prova",
    type: "link",
    url: "https://www.passeidireto.com/arquivo/125781862/ap-1-contabilidade-geral-i-2023-gabarito",
    uploadedAt: "2026-09-08T10:00:00Z",
  },
  // ============================================================
  // MÉTODOS DETERMINÍSTICOS I (mais materiais para AD2)
  // ============================================================
  {
    id: "mat-mdi-compilado-ap2",
    disciplineId: "metodos-deterministicos-i",
    title: "Compilado AP2 2022-2023 — Passei Direto",
    type: "link",
    url: "https://www.passeidireto.com/arquivo/127194551/compilado-ap-2-metodos-deterministicos-1-2022-e-2023",
    uploadedAt: "2026-09-08T10:00:00Z",
  },
  {
    id: "mat-mdi-ep7-revisao",
    disciplineId: "metodos-deterministicos-i",
    title: "EP7 — Revisão para AP1 com questões resolvidas",
    type: "link",
    url: "https://www.passeidireto.com/arquivo/201080305/ep-7-revisao-para-a-ap-1-questoes",
    uploadedAt: "2026-09-08T10:00:00Z",
  },
  {
    id: "mat-mdi-ap1-2019",
    disciplineId: "metodos-deterministicos-i",
    title: "AP1 2019/1 com gabarito — Passei Direto",
    type: "link",
    url: "https://www.passeidireto.com/arquivo/148534514/ap-1-md-1-2024",
    uploadedAt: "2026-09-08T10:00:00Z",
  },
  {
    id: "mat-mdi-funcoes",
    disciplineId: "metodos-deterministicos-i",
    title: "Função afim e quadrática — exercícios (YouTube)",
    type: "link",
    url: "https://www.youtube.com/watch?v=HrKVZfvTdeE",
    uploadedAt: "2026-09-08T10:00:00Z",
  },
];
