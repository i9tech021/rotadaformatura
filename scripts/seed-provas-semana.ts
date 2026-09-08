#!/usr/bin/env bun
/**
 * Popula provas antigas no Supabase para as disciplinas com prova na semana 08-14/Set/2026.
 * Rodar: SUPABASE_SERVICE_ROLE_KEY=... bun run scripts/seed-provas-semana.ts
 */

const SUPABASE_URL = "https://pboacygsibfjivrdejcp.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_KEY) {
  console.error("Defina SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const headers = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=minimal",
};

function genId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

async function insertProva(p: {
  disciplina_id: string;
  tipo: string;
  titulo: string;
  url: string;
  texto_extraido: string;
  num_paginas: number;
}) {
  const id = genId(p.disciplina_id.split("-")[0]);
  const res = await fetch(`${SUPABASE_URL}/rest/v1/provas_antigas`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      id,
      ...p,
      autor_local_id: "seed-admin",
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    if (err.includes("duplicate")) {
      console.log(`  ⏭️  Já existe: ${p.titulo}`);
      return;
    }
    console.error(`  ❌ Erro ao inserir "${p.titulo}": ${err}`);
  } else {
    console.log(`  ✅ Inserido: ${p.titulo}`);
  }
}

// ============================================================
// EBC — Economia Brasileira Contemporânea (AP1 dia 12/09)
// ============================================================
const ebcProvas = [
  {
    disciplina_id: "economia-brasileira-contemporanea",
    tipo: "AP1",
    titulo: "AP1 2024/1 — Economia Brasileira Contemporânea (gabarito)",
    url: "https://www.passeidireto.com/arquivo/137888564/ap-1-economia-brasileira-contemporanea-2024-1",
    texto_extraido: `AP1 Economia Brasileira Contemporânea 2024/1 — CEDERJ
Coordenador: Thierry Molnar Prates

Marque como verdadeira (V) ou falsa (F):
1. O crescimento da economia no pós-guerra foi feito com o uso intensivo de tecnologia, substituição de trabalho por tecnologia. Provocou enorme desemprego. (F)
2. Durante milagre econômico a eficiência e produtividade cresceram significativamente, provocado por maior presença do setor privado. (F)
3. Duas características do Milagre: produção de bens de consumo duráveis e financiamento pelo capital estrangeiro. (V)
4. Crise do Milagre: elevação dos preços do petróleo pela OPEP, aumentou custos, reduziu oferta de recursos, aumento das taxas de juros. (V)
5. Proposta do II PND: completar industrialização pelo PSI, produção interna de bens de produção. (V)
6. Inflação inercial: quando demanda excede oferta, provocando aumento dos preços. (F)
7. Plano Cruzado: plano heterodoxo, reforma monetária, tabelamento de preços, novas políticas salariais e cambiais. (V)
8. Política monetária: trata da moeda, usa impostos para crescimento equilibrado. (F)
9. Preceitos do Neoliberalismo: estado não interventor, abertura comercial, equilíbrio das contas públicas, estado não produtor, flexibilização das relações capital-trabalho. (V) [Anulada]
10. Governo Collor: postura keynesiana, confisco dos ativos financeiros. (F) [Anulada]`,
    num_paginas: 4,
  },
  {
    disciplina_id: "economia-brasileira-contemporanea",
    tipo: "AP1",
    titulo: "AP1 2026/1 — Economia Brasileira Contemporânea (gabarito)",
    url: "https://www.passeidireto.com/arquivo/200157874/economia-brasileira-contemporanea-gabarito-ap-1-ebc-2026-1",
    texto_extraido: `AP1 Economia Brasileira Contemporânea 2026/1 — CEDERJ

Marque V ou F:
1. Inflação de demanda: quantidade de bens não corresponde ao volume de moeda, aumento da demanda excede oferta. (V)
2. Plano Cruzado: preços tabelados, produtores maquiavam produtos para aumentar preços. (F)
3. Política "feijão com arroz" de Mailson da Nóbrega: medidas heterodoxas gradualistas. (F)
4. Milagre: produção de bens duráveis e financiamento pelo capital estrangeiro. (V)
5. Final do governo JK: empresas com dificuldades para vender, mais forte nos setores de baixa renda. (V)
6. Crise pós JK: Golpe Militar de 1964 restabeleceu condições políticas para capital. (F)
7. Governo Médici: elevadas taxas de crescimento do PIB, repressão política, piora na distribuição de renda. (V)
8. Crise do Milagre: estímulo ao consumo afetado porque crise externa aumentou taxas de juros. (V)

9. III PND — alternativa incorreta: (a) esforço exportador não trouxe superávits na Balança Comercial.
10. Segundo choque do petróleo 1979: (b) F,V,F,V,V.`,
    num_paginas: 4,
  },
  {
    disciplina_id: "economia-brasileira-contemporanea",
    tipo: "AP1",
    titulo: "AP1 2016/2 — Economia Brasileira (gabarito CECIERJ)",
    url: "https://www.passeidireto.com/arquivo/84313873/aps-economia-brasileira",
    texto_extraido: `AP1 2016/2 — Economia Brasileira Contemporânea — CEDERJ
Coordenador: Prof. Dr. Maxwel Ribeiro Moreira

Questão 1 (4,0 pts): Marque V ou F sobre o III PND:
III PND (1980-1985):
1.1. Necessidade de vencer desafios adicionais da economia mundial. (V)
1.2. Importância de rever prazos do desenvolvimento com base na crise energética. (V)
1.3. País não podia renunciar ao crescimento, custo social da estagnação. (V)
1.4. Necessidade de promover distribuição mais justa, melhorando condições dos menos favorecidos. (V)

Questão 2 (3,0 pts): Crise do Milagre — balanças comerciais afetadas diretamente (preço do petróleo) e indiretamente (produtos que usavam derivados).

Questão 3 (4,0 pts): II PND:
3.1. (F) Não desprezou efeitos do milagre.
3.2. (F) Capital privado priorizado em áreas de exportação, bens de capital, agroindústria.
3.3. (F) Déficits 1974-76: aumento importações + diminuição exportações.

Questão 4 (2,0 pts): III PND:
4.1. (V) Políticas exquíveis e socialmente pertinentes.
4.2. (V) Valorização do homem brasileiro.

Questão 5 (2,0 pts): Combinação de dívida externa, dívida interna, ciranda financeira e aceleração inflacionária impediram o Estado de sustentar o desenvolvimento.`,
    num_paginas: 6,
  },
];

// ============================================================
// SO — Sociedade e Organizações (AP1 dia 12/09)
// ============================================================
const soProvas = [
  {
    disciplina_id: "sociedade-e-organizacoes",
    tipo: "AP1",
    titulo: "AP1 — Gestão da Interface Empresa x Sociedade (gabarito 2017/1)",
    url: "https://www.docsity.com/pt/docs/gestao-da-interface-empresa-x-sociedade-ap1-gabarito-2017-1-ap1/4900906/",
    texto_extraido: `AP1 — Gestão da Interface Empresa x Sociedade — 2017/1 — CEDERJ

Questões Objetivas (1,5 ponto cada):
1. Princípios da sustentabilidade empresarial: tripé (econômico, social, ambiental).
2. Ações da SAMARCO após tragédia ambiental: pagamentos de indenizações e reconstruções = Responsabilidade Social Empresarial.
3. Tipos de organizações sociais: associações, cooperativas, fundações, institutos.
4. Tripé da sustentabilidade: econômico, social, ambiental.

Questão discursiva: Organização social de cunho empresarial vs organização empresarial de cunho social.
- ONGs que desenvolvem atividades empresariais para auto-sustentação.
- Empresas com finalidade social (Ecofair Trade, etc).`,
    num_paginas: 3,
  },
  {
    disciplina_id: "sociedade-e-organizacoes",
    tipo: "AP1",
    titulo: "Conteúdo programático AP1 — Sociedade e Organizações (aulas 1-7)",
    url: "https://canal.cecierj.edu.br/recurso/6453",
    texto_extraido: `SOCIEDADE E ORGANIZAÇÕES — Ementa Resumida

UNIDADE I — Sociedade e Organização:
- Conceito de sociedade, organizações e administração
- Tipos de organizações: pública, privada, terceiro setor
- Responsabilidade Social Empresarial (RSE)
- Sustentabilidade: tripé econômico, social, ambiental
- Stakeholders vs Shareholders

UNIDADE II — Estrutura e Processo:
- Conceito de organização: finalidades, estrutura, processos
- Teoria das organizações: abordagem clássica, comportamental, sistêmica
- Burocracia (Max Weber)
- Departamentalização

UNIDADE III — Pessoas nas Organizações:
- Motivação: Maslow, Herzberg, McGregor
- Liderança e estilos de gestão
- Cultura organizacional
- Comunicação nas organizações

UNIDADE IV — Mudança Organizacional:
- Mudança organizacional
- Resistência à mudança
- Aprendizagem organizacional`,
    num_paginas: 8,
  },
];

// ============================================================
// CG1 — Contabilidade Geral I (AP1 dia 13/09)
// ============================================================
const cg1Provas = [
  {
    disciplina_id: "contabilidade-geral-i",
    tipo: "AP1",
    titulo: "AP1 2023/1 — Contabilidade Geral I (gabarito)",
    url: "https://www.passeidireto.com/arquivo/125781862/ap-1-contabilidade-geral-i-2023-gabarito",
    texto_extraido: `AP1 2023/1 — Contabilidade Geral I — CEDERJ
Coordenadora: Dayse Pereira Cardoso Sousa

1ª Questão (3,0 pts): Classifique contas:
(c) Empréstimos a Pagar no Curto Prazo → Passivo Circulante
(e) Máquinas usadas na Produção → Ativo Não Circulante Imobilizado
(c) Fornecedores ou Duplicatas a Pagar → Passivo Circulante
(h) Depósitos Bancários → Ativo Circulante
(g) Empréstimos Concedidos aos Sócios → Ativo Não Circulante Realizável a Longo Prazo
(a) Lucros Acumulados → Patrimônio Líquido
(e) Veículos utilizados pela empresa → Imobilizado
(h) Clientes ou Duplicatas a Receber → Ativo Circulante
(b) Financiamentos obtidos a Longo Prazo → Passivo Não Circulante Exigível a Longo Prazo
(d) Marcas e Patentes → Ativo Não Circulante Intangível
(h) Caixa → Ativo Circulante
(h) Estoque de Mercadorias → Ativo Circulante

2ª Questão (3,0 pts):
a) Contabilidade é ciência Social.
b) Grau decrescente de exigibilidade: Duplicatas a Pagar > Financiamentos LP > Capital Social.
c) Competência: R$1.000.000 / Caixa: R$400.000
d) Ciclo operacional 18 meses → curto prazo = 1 ano e meio.
e) Custo x Benefício → Materialidade.
f) Patrimônio Líquido = Ativo – Capital de Terceiros.

3ª Questão (2,0 pts): Princípios contábeis:
3 = Denominador Comum Monetário
1 = Entidade Contábil
2 = Continuidade
4 = Custo Histórico como Base de Valor

Balanço Patrimonial Empresa Barra do Piraí: Total = R$650.000`,
    num_paginas: 6,
  },
  {
    disciplina_id: "contabilidade-geral-i",
    tipo: "AP1",
    titulo: "Compilado AP1 2013-2019 — Contabilidade Geral I",
    url: "https://www.passeidireto.com/arquivo/79497715/ap-1-resolvidas-2013-1-2013-2-2014-2-2015-1-2016-2-2019-2-contabilidade-geral-1",
    texto_extraido: `Compilado AP1 Contabilidade Geral I — 2013/1 a 2019/2

Questões recorrentes:
1. Classificação de contas (Ativo, Passivo, PL)
2. Princípios contábeis (Entidade, Continuidade, Competência, Prudência, etc.)
3. Regimes de Competência vs Caixa
4. Balanço Patrimonial
5. Balancete de Verificação
6. Demonstração do Resultado do Exercício (DRE)
7. Lucro/Prejuízo Acumulado
8. Cálculo do Imposto de Renda

Fórmulas importantes:
- Regime de Competência: Receitas do período - Despesas do período
- Regime de Caixa: Recebimentos - Pagamentos
- PL = Ativo - Passivo
- Lucro = Receita - Custos - Despesas
- LDIR = LAIR - PIR (15%)`,
    num_paginas: 12,
  },
  {
    disciplina_id: "contabilidade-geral-i",
    tipo: "AP2",
    titulo: "AP2 2024/1 — Contabilidade Geral I (gabarito)",
    url: "https://www.passeidireto.com/arquivo/144233391/contabilidade-geral-gab-ap-2-2024-1",
    texto_extraido: `AP2 2024/1 — Contabilidade Geral I — CEDERJ
Coordenador: Dayse Pereira Cardoso Sousa

1ª Questão (3,0 pts):
a) DLPAc pode ser substituída por DMPL.
b) Receita Líquida = Receita - Custo das Vendas.
c) Conta Impostos a Recolher = saldo Credor.

2ª Questão (3,0 pts): Balancete de Verificação Empresa Angra dos Reis:
Total = R$16.640.000

3ª Questão (2,0 pts): Material de Escritório:
Compra R$700.000, estoque R$350.000 → Despesa = R$350.000

4ª Questão (2,0 pts): Cálculo IR:
LR = 155.000 + 11.800 - 3.850 = 162.950
PIR = 15% × 162.950 = 24.442,50
LDIR = 155.000 - 24.442,50 = 130.557,50`,
    num_paginas: 4,
  },
];

// ============================================================
// MDI — Métodos Determinísticos I (AD2 dia 14/09)
// ============================================================
const mdiProvas = [
  {
    disciplina_id: "metodos-deterministicos-i",
    tipo: "AP1",
    titulo: "AP1 2019/1 — Métodos Determinísticos I (gabarito)",
    url: "https://www.passeidireto.com/arquivo/148534514/ap-1-md-1-2024",
    texto_extraido: `AP1 Métodos Determinísticos I — 24/03/2019 — CEDERJ
Código: EAD 06075

Questão 1 (1,0 pt): Bolsa de valores — empresas com ações privadas/governo.
3/4 das empresas com ações privadas não possuem ações do governo.
1/4 do total não possuem ações do governo.
33 empresas possuem ações só no governo ou só na iniciativa privada.

Questão 2 (1,0 pt): Preço de venda V = C + L + I. Margem de lucro 10% sobre C. Imposto I = 20% do L.

Questão 3 (1,0 pt): Preço de venda com imposto 20% de (V - C).

Questão 4 (1,5 pt): Determinar intervalos para desigualdade.

Questão 5 (1,0 pt): Condição necessária e suficiente para lei não cumprida.

Questão 6 (1,0 pt): Negação da sentença.

Questão 7 (2,0 pt): Função afim s(x) = salário com comissão.

Questão 8 (1,0 pt): Função quadrática demanda.`,
    num_paginas: 6,
  },
  {
    disciplina_id: "metodos-deterministicos-i",
    tipo: "AP2",
    titulo: "Compilado AP2 2022-2023 — Métodos Determinísticos I",
    url: "https://www.passeidireto.com/arquivo/127194551/compilado-ap-2-metodos-deterministicos-1-2022-e-2023",
    texto_extraido: `Compilado AP2 Métodos Determinísticos I — 2022 e 2023

Questões recorrentes:
1. Desigualdades com valor absoluto
2. Inequações quadráticas
3. Função afim: salário s(x) com comissão de 10% sobre o que exceder R$30.000
4. Função quadrática: demanda D(P) = -P² + 4P + 5
5. Oferta Q(P) = 2P - 4
6. Preço máximo (raiz da demanda)
7. Preço mínimo de oferta
8. Preço de equilíbrio (D = Q)
9. Esboço gráfico de demanda e oferta

Fórmulas:
- s(x) = 5000 se x ≤ 30000; s(x) = 5000 + 0,10(x-30000) se x > 30000
- Preço equilíbrio: D(P) = Q(P)
- Máximo de D(P): vértice da parábola P = -b/(2a)`,
    num_paginas: 10,
  },
];

async function main() {
  console.log("=== Populando provas antigas para semana 08-14/Set ===\n");

  console.log("📚 EBC (Economia Brasileira Contemporânea) — AP1 dia 12/09:");
  for (const p of ebcProvas) await insertProva(p);

  console.log("\n📚 SO (Sociedade e Organizações) — AP1 dia 12/09:");
  for (const p of soProvas) await insertProva(p);

  console.log("\n📚 CG1 (Contabilidade Geral I) — AP1 dia 13/09:");
  for (const p of cg1Provas) await insertProva(p);

  console.log("\n📚 MDI (Métodos Determinísticos I) — AD2 dia 14/09:");
  for (const p of mdiProvas) await insertProva(p);

  console.log("\n✅ Concluído!");
}

main().catch(console.error);
