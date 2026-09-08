/**
 * Guias de estudo para AP1 — conteúdo cobrado em cada disciplina.
 * O tutor IA usa estes dados para dar respostas mais precisas.
 * Atualizado em 2026-09-08 com base nas aulas 1-7/8 de cada disciplina.
 */

export interface StudyGuide {
  disciplinaId: string;
  disciplinaCodigo: string;
  provaTipo: string;
  conteudocobrado: string[];
  topicsChave: string[];
  dicasDeProva: string[];
  exerciciosTipicos: string[];
}

export const STUDY_GUIDES: StudyGuide[] = [
  // ============================================================
  // EBC — Economia Brasileira Contemporânea (AP1 — Aulas 1-7)
  // ============================================================
  {
    disciplinaId: "economia-brasileira-contemporanea",
    disciplinaCodigo: "EBC",
    provaTipo: "AP1",
    conteudocobrado: [
      "Aula 1 — Milagre econômico: o que é, contexto internacional pós-guerra",
      "Aula 2 — Milagre econômico brasileiro: características, papel do Estado, capital estrangeiro, bens de consumo duráveis",
      "Aula 3 — Crise do milagre: choques do petróleo (1973 e 1979), OPEP, aumento da dívida externa, inflação",
      "Aula 4 — II PND (1974-1979): objetivos, substituição de importações, bens de produção, interiorização do desenvolvimento",
      "Aula 5 — III PND (1980-1985) e transição política: crise da dívida, ciranda financeira, fim da ditadura",
      "Aula 6 — Nova República e Plano Cruzado (1986): reforma monetária, tabelamento de preços, confiança do consumidor",
      "Aula 7 — Fracasso do Plano Cruzado, Plano Bresser (1987), Plano Verão (1989), política 'feijão com arroz'",
    ],
    topicsChave: [
      "Milagre econômico: características singulares (bens duráveis + capital estrangeiro)",
      "Choques do petróleo e impacto na economia brasileira",
      "Diferença entre II PND e III PND",
      "Plano Cruzado: por que fracassou (maquiagem de preços, Consumidor XYZ)",
      "Política cambial vs política monetária vs política fiscal",
      "Inflação de demanda vs inflação inercial",
      "Neoliberalismo: preceitos (estado não interventor, abertura comercial)",
      "Governo Collor: confisco dos ativos financeiros",
    ],
    dicasDeProva: [
      "Questões são V/F — leia cada palavra com atenção (ex: 'heterodoxo' vs 'ortodoxo')",
      "Plano Cruzado foi HETERODOXO (não ortodoxo) — confunde muito",
      "Política cambial NÃO é a mesma que política monetária",
      "O esforço exportador DO SUCESSO gerou superávits, mas o III PND herdou a crise",
      "Atenção para as alternativas 'incorreta' — pode ser a letra errada!",
    ],
    exerciciosTipicos: [
      "V/F sobre milagre econômico e características",
      "Identificar alternativa incorreta sobre III PND",
      "V/F sobre choques do petróleo e impactos",
      "Sequências V/F sobre Plano Cruzado",
      "Diferenciar política cambial, monetária e fiscal",
    ],
  },

  // ============================================================
  // SO — Sociedade e Organizações (AP1 — Aulas 1-6)
  // ============================================================
  {
    disciplinaId: "sociedade-e-organizacoes",
    disciplinaCodigo: "SO",
    provaTipo: "AP1",
    conteudocobrado: [
      "Aula 1 — Sociologia das Organizações: conceito de organização, tipos (pública, privada, terceiro setor)",
      "Aula 2 — O homem e o trabalho: evolução histórica, Taylorismo, Fordismo",
      "Aula 3 — Concepção contemporânea do trabalho: flexibilização, terceirização, trabalho em equipe",
      "Aula 4 — Mercado de trabalho e globalização: precariedade, informalidade, impactos da globalização",
      "Aula 5 — Ambiente organizacional: cultura organizacional, clima, estrutura",
      "Aula 6 — Sentido do trabalho: motivação, qualidade de vida, ergonomia",
    ],
    topicsChave: [
      "Tipos de organizações: pública, privada, terceiro setor (ONGs, OSCIPs)",
      "Responsabilidade Social Empresarial (RSE)",
      "Tripé da sustentabilidade: econômico, social, ambiental",
      "Taylorismo: divisão do trabalho, tempo e movimento",
      "Fordismo: linha de montagem, consumo de massa",
      "Stakeholders vs Shareholders",
      "Cultura organizacional: valores, crenças, rituais",
      "Globalização e impacto no mercado de trabalho",
    ],
    dicasDeProva: [
      "Questões mistas: V/F + objetivas (múltipla escolha)",
      "Leia o enunciado com atenção — pode pedir 'incorreta' ou 'correta'",
      "Gestão da Interface Empresa x Sociedade cai bastante",
      "RSE e sustentabilidade são temas recorrentes",
      "Diferencie organização social de cunho empresarial vs empresarial de cunho social",
    ],
    exerciciosTipicos: [
      "V/F sobre conceitos de organização e trabalho",
      "Múltipla escolha sobre tipos de organizações",
      "Questão discursiva sobre RSE e sustentabilidade",
      "Diferenciar Taylorismo de Fordismo",
      "Identificar princípios da sustentabilidade",
    ],
  },

  // ============================================================
  // CG1 — Contabilidade Geral I (AP1 — Aulas 1-8)
  // ============================================================
  {
    disciplinaId: "contabilidade-geral-i",
    disciplinaCodigo: "CG1",
    provaTipo: "AP1",
    conteudocobrado: [
      "Aula 1 — Apresentação do curso e material",
      "Aula 2 — Contabilidade Econômica vs Administrativa, Princípios e Convenções Contábeis",
      "Aula 3 — Relatórios e Demonstrações Contábeis obrigatórias (BP, DRE, DLPAc, DFC, DVA)",
      "Aula 4 — Balanço Patrimonial: Ativo, Passivo, Patrimônio Líquido",
      "Aula 5 — Situação Financeira vs Situação Econômica",
      "Aula 6 — Regimes de Contabilidade: Competência vs Caixa",
      "Aula 7 — Lucro ou Prejuízo: confronto entre Receitas e Custos/Despesas",
      "Aula 8 — Integrando BP e DRE",
    ],
    topicsChave: [
      "Princípios contábeis: Entidade, Continuidade, Competência, Prudência, Oportunidade, Custo Histórico, Denominador Comum Monetário",
      "Convenções: Materialidade, Conservadorismo, Consistência, Objetividade, Não Compensação, Prudência",
      "Classificação de contas: Ativo Circulante/Não Circulante, Passivo Circulante/Não Circulante, PL",
      "Regime de Competência: receitas e despesas no período em que ocorrem",
      "Regime de Caixa: receitas e despesas quando recebidas/pagas",
      "Balanço Patrimonial: Ativo = Passivo + PL",
      "DRE: Receita - Custos - Despesas = Lucro Líquido",
      "Cálculo do Lucro: LR = LAIR + Inclusões - Exclusões; PIR = 15% × LR",
    ],
    dicasDeProva: [
      "Calcule sempre com cuidado — use calculadora",
      "Princípios contábeis caem MUITO — decore as siglas",
      "Cuidado com a classificação de contas (intangível vs imobilizado)",
      "Regime de Competência vs Caixa: exemplo clássico de prova",
      "Balanço Patrimonial DEVE fechar (Ativo = Passivo + PL)",
      "IR = 15% sobre o Lucro Real (após inclusões e exclusões)",
    ],
    exerciciosTipicos: [
      "Classificar contas no BP (múltipla escolha)",
      "Relacionar princípios contábeis com suas definições",
      "Calcular resultado por Competência e por Caixa",
      "Estruturar Balanço Patrimonial completo",
      "Elaborar Balancete de Verificação",
      "Calcular Lucro Líquido após Imposto de Renda",
    ],
  },

  // ============================================================
  // MDI — Métodos Determinísticos I (AD2 — Aulas 1-7)
  // ============================================================
  {
    disciplinaId: "metodos-deterministicos-i",
    disciplinaCodigo: "MDI",
    provaTipo: "AD2",
    conteudocobrado: [
      "Aula 1 — Conjuntos: notação, operações (∪, ∩, ⊂), diagramas de Venn",
      "Aula 2 — Números Naturais, Inteiros e Racionais: conjunto Q, representação decimal",
      "Aula 3 — Proposições e Conectivos: negação (~), conjunção (∧), disjunção (∨), condicional (→), bicondicional (↔)",
      "Aula 4 — Tabelas-verdade e Leis da Lógica: leis de De Morgan, equivalências",
      "Aula 5 — Argumentos e Provas: argumentação lógica, validade",
      "Aula 6 — Representação Decimal, Porcentagens e Irracionais",
      "Aula 7 — Potências, Radicais e Expressões Numéricas",
    ],
    topicsChave: [
      "Diagramas de Venn: interseção, união, complementar",
      "Proposições: como identificar e traduzir para linguagem formal",
      "Tabelas-verdade: construir e interpretar",
      "Leis de De Morgan: ~(p∧q) = ~p∨~q; ~(p∨q) = ~p∧~q",
      "Condicional (→): só é falsa quando p é verdadeiro e q é falso",
      "Porcentagem: cálculos com aumentos e descontos",
      "Potenciação e radicalização",
      "Racionalização de expressões com radicais",
    ],
    dicasDeProva: [
      "AD2 é online — questões discursivas com resolução manuscrita",
      "Resolva por partes: identifique o que pede, faça o cálculo, justifique",
      "Diagramas de Venn: comece sempre pela interseção",
      "Cuidado com a condicional (→): não confunda com bicondicional (↔)",
      "Racionalize sempre que possível — simplifique ao máximo",
      "Na AD2, mostre todos os passos da resolução",
    ],
    exerciciosTipicos: [
      "Problemas com diagramas de Venn (empresas, compradores)",
      "Traduzir sentenças lógicas para linguagem formal",
      "Construir tabelas-verdade",
      "Resolver problemas com porcentagem e funções",
      "Racionalizar expressões com radicais",
      "Enunciados com funções afins (salário com comissão)",
    ],
  },
];
