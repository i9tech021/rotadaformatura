// src/data/studyPlan.ts
// Plano de estudos semanal integrado - CEDERJ Administração 2026-2
import { parseISO } from "date-fns";
// Rotina: Seg-Sex (trânsito/podcast), Sábado (vídeo/resumo), Domingo (simulado)

export type DiaSemana = "segunda" | "terca" | "quarta" | "quinta" | "sexta" | "sabado" | "domingo";
export type ModoEstudo = "podcast" | "video" | "simulado" | "ad" | "ap" | "revisao" | "descanso";

export interface TarefaDiaria {
  id: string;
  disciplinaId: string;
  disciplinaNome: string;
  disciplinaCodigo: string;
  disciplinaCor: string;
  aulaId?: string;
  aulaTitulo?: string;
  tipo: ModoEstudo;
  titulo: string;
  descricao: string;
  duracaoMinutos: number;
  concluida: boolean;
}

export interface SemanaEstudo {
  numero: number; // semana do semestre
  periodo: string; // ex: "27/07 a 02/08"
  dataInicio: string; // ISO
  dataFim: string; // ISO
  tarefas: Record<DiaSemana, TarefaDiaria[]>;
  observacoes?: string;
}

// ============================================================
// PLANO DE ESTUDOS - AGOSTO (Semanas 1-5)
// ============================================================
export const semanasAgosto: SemanaEstudo[] = [
  {
    numero: 1,
    periodo: "27/07 a 02/08",
    dataInicio: "2026-07-27",
    dataFim: "2026-08-02",
    observacoes: "Semana de ambientação. Aula inaugural online 25/07 e presencial 01/08.",
    tarefas: {
      segunda: [
        {
          id: "s1-seg-mdi",
          disciplinaId: "metodos-deterministicos-i",
          disciplinaNome: "Métodos Determinísticos I",
          disciplinaCodigo: "MDI",
          disciplinaCor: "#2563EB",
          aulaId: "mdi-a1",
          aulaTitulo: "Conjuntos",
          tipo: "podcast",
          titulo: "🎧 Métodos Det. I Aula 1: Conjuntos",
          descricao:
            "Ouvir resumo em áudio/podcast da Aula 1 no trânsito. Focar em: definição de conjuntos, pertinência, inclusão, operações.",
          duracaoMinutos: 30,
          concluida: false,
        },
      ],
      terca: [
        {
          id: "s1-ter-mdi",
          disciplinaId: "metodos-deterministicos-i",
          disciplinaNome: "Métodos Determinísticos I",
          disciplinaCodigo: "MDI",
          disciplinaCor: "#2563EB",
          aulaId: "mdi-a1",
          aulaTitulo: "Conjuntos",
          tipo: "podcast",
          titulo: "🎧 Métodos Det. I Revisão Aula 1",
          descricao:
            "Revisar conceitos da Aula 1 via podcast. Resolver mentalmente exercícios básicos de conjuntos.",
          duracaoMinutos: 25,
          concluida: false,
        },
      ],
      quarta: [
        {
          id: "s1-qua-hpa",
          disciplinaId: "historia-pensamento-administrativo-ii",
          disciplinaNome: "História do Pensamento Adm. II",
          disciplinaCodigo: "HPA2",
          disciplinaCor: "#7C3AED",
          aulaId: "hpa-a11",
          aulaTitulo: "Behaviorismo",
          tipo: "podcast",
          titulo: "🎧 HPA II Aula 11: Behaviorismo",
          descricao:
            "Ouvir resumo sobre behaviorismo e teorias comportamentalistas. Focar em: Skinner, Watson, aplicações em organizações.",
          duracaoMinutos: 30,
          concluida: false,
        },
      ],
      quinta: [
        {
          id: "s1-qui-hpa",
          disciplinaId: "historia-pensamento-administrativo-ii",
          disciplinaNome: "História do Pensamento Adm. II",
          disciplinaCodigo: "HPA2",
          disciplinaCor: "#7C3AED",
          aulaId: "hpa-a12",
          aulaTitulo: "Revolução Druckeriana",
          tipo: "podcast",
          titulo: "🎧 HPA II Aula 12: Revolução Druckeriana",
          descricao:
            "Resumo sobre Peter Drucker, gestão contemporânea e novos desenhos organizacionais.",
          duracaoMinutos: 30,
          concluida: false,
        },
      ],
      sexta: [
        {
          id: "s1-sex-cg1",
          disciplinaId: "contabilidade-geral-i",
          disciplinaNome: "Contabilidade Geral I",
          disciplinaCodigo: "CG1",
          disciplinaCor: "#059669",
          aulaId: "cg1-l1",
          aulaTitulo: "Apresentação",
          tipo: "podcast",
          titulo: "🎧 Contab. Geral I Lição 1: Apresentação",
          descricao:
            "Conhecer estrutura da disciplina, princípios básicos e o que será cobrado nas avaliações.",
          duracaoMinutos: 20,
          concluida: false,
        },
      ],
      sabado: [
        {
          id: "s1-sab-resumo",
          disciplinaId: "geral",
          disciplinaNome: "Resumo da Semana",
          disciplinaCodigo: "GER",
          disciplinaCor: "#64748B",
          tipo: "video",
          titulo: "🎥 Resumo Visual da Semana 1",
          descricao:
            "Revisar tudo o que foi estudado: Métodos A1 (Conjuntos), HPA A11-A12 (Behaviorismo/Drucker), Contab L1. Criar mapa mental ou flashcards.",
          duracaoMinutos: 60,
          concluida: false,
        },
      ],
      domingo: [
        {
          id: "s1-dom-sim",
          disciplinaId: "metodos-deterministicos-i",
          disciplinaNome: "Métodos Determinísticos I",
          disciplinaCodigo: "MDI",
          disciplinaCor: "#2563EB",
          tipo: "simulado",
          titulo: "📝 Simulado EP1 Conjuntos",
          descricao:
            "Resolver EP1 completo. Cronometrar tempo. Verificar gabarito depois. Anotar dúvidas para videotutorial.",
          duracaoMinutos: 90,
          concluida: false,
        },
      ],
    },
  },
  {
    numero: 2,
    periodo: "03/08 a 09/08",
    dataInicio: "2026-08-03",
    dataFim: "2026-08-09",
    observacoes: "Aula inaugural de Métodos: 04/08 20h-22h. AD1 Métodos Q1 disponível.",
    tarefas: {
      segunda: [
        {
          id: "s2-seg-mdi",
          disciplinaId: "metodos-deterministicos-i",
          disciplinaNome: "Métodos Determinísticos I",
          disciplinaCodigo: "MDI",
          disciplinaCor: "#2563EB",
          aulaId: "mdi-a2",
          aulaTitulo: "Números Naturais, Inteiros e Racionais",
          tipo: "podcast",
          titulo: "🎧 Métodos Det. I Aula 2: Números N/Z/Q",
          descricao:
            "Resumo sobre conjuntos numéricos, operações, propriedades. Revisar frações e decimais.",
          duracaoMinutos: 30,
          concluida: false,
        },
      ],
      terca: [
        {
          id: "s2-ter-mdi",
          disciplinaId: "metodos-deterministicos-i",
          disciplinaNome: "Métodos Determinísticos I",
          disciplinaCodigo: "MDI",
          disciplinaCor: "#2563EB",
          aulaId: "mdi-a2",
          aulaTitulo: "Números Naturais, Inteiros e Racionais",
          tipo: "podcast",
          titulo: "🎧 Métodos Det. I EP2 + pp.144-145",
          descricao:
            "Revisar EP2 e páginas 144-145 da Aula 12 (Equação do 1º Grau). Resolver exercícios de fixação.",
          duracaoMinutos: 30,
          concluida: false,
        },
      ],
      quarta: [
        {
          id: "s2-qua-hpa",
          disciplinaId: "historia-pensamento-administrativo-ii",
          disciplinaNome: "História do Pensamento Adm. II",
          disciplinaCodigo: "HPA2",
          disciplinaCor: "#7C3AED",
          aulaId: "hpa-a13",
          aulaTitulo: "Cultura e Clima Organizacional",
          tipo: "podcast",
          titulo: "🎧 HPA II Aula 13: Cultura/Clima Org.",
          descricao:
            "Resumo sobre cultura organizacional, clima, modelos de DO e APO de mudança organizacional.",
          duracaoMinutos: 30,
          concluida: false,
        },
      ],
      quinta: [
        {
          id: "s2-qui-hpa",
          disciplinaId: "historia-pensamento-administrativo-ii",
          disciplinaNome: "História do Pensamento Adm. II",
          disciplinaCodigo: "HPA2",
          disciplinaCor: "#7C3AED",
          aulaId: "hpa-a14",
          aulaTitulo: "Liderança: Weber a Welch",
          tipo: "podcast",
          titulo: "🎧 HPA II Aula 14: Liderança",
          descricao:
            "Resumo sobre teorias da liderança: Weber, teoria dos traços, comportamental, situacional, transformacional, Welch.",
          duracaoMinutos: 30,
          concluida: false,
        },
      ],
      sexta: [
        {
          id: "s2-sex-cg1",
          disciplinaId: "contabilidade-geral-i",
          disciplinaNome: "Contabilidade Geral I",
          disciplinaCodigo: "CG1",
          disciplinaCor: "#059669",
          aulaId: "cg1-l2",
          aulaTitulo: "Princípios e Convenções Contábeis",
          tipo: "podcast",
          titulo: "🎧 Contab. Geral I Lição 2: Princípios",
          descricao:
            "Resumo sobre contabilidade econômica e administrativa, princípios fundamentais de contabilidade, convenções.",
          duracaoMinutos: 30,
          concluida: false,
        },
      ],
      sabado: [
        {
          id: "s2-sab-ad",
          disciplinaId: "metodos-deterministicos-i",
          disciplinaNome: "Métodos Determinísticos I",
          disciplinaCodigo: "MDI",
          disciplinaCor: "#2563EB",
          tipo: "ad",
          titulo: "✍️ AD1 Métodos Questão 1",
          descricao:
            "Resolver AD1 Q1. Escrever à mão, escanear em PDF e enviar na plataforma. NÃO DEIXAR PARA ÚLTIMA HORA.",
          duracaoMinutos: 120,
          concluida: false,
        },
        {
          id: "s2-sab-resumo",
          disciplinaId: "geral",
          disciplinaNome: "Resumo da Semana",
          disciplinaCodigo: "GER",
          disciplinaCor: "#64748B",
          tipo: "video",
          titulo: "🎥 Resumo Visual da Semana 2",
          descricao:
            "Revisar: Métodos A2 (Números), HPA A13-A14 (Cultura/Liderança), Contab L2. Criar flashcards de conceitos-chave.",
          duracaoMinutos: 60,
          concluida: false,
        },
      ],
      domingo: [
        {
          id: "s2-dom-sim",
          disciplinaId: "historia-pensamento-administrativo-ii",
          disciplinaNome: "História do Pensamento Adm. II",
          disciplinaCodigo: "HPA2",
          disciplinaCor: "#7C3AED",
          tipo: "simulado",
          titulo: "📝 Simulado HPA A11-A14",
          descricao:
            "Simular questões teóricas sobre Behaviorismo, Drucker, Cultura Org., Liderança. Praticar redação de respostas estruturadas.",
          duracaoMinutos: 90,
          concluida: false,
        },
      ],
    },
  },
  {
    numero: 3,
    periodo: "10/08 a 16/08",
    dataInicio: "2026-08-10",
    dataFim: "2026-08-16",
    observacoes: "🔴 SEMANA CRÍTICA: AD1 HPA (10-16/08) + AD1 Métodos Q2 (até 19/08).",
    tarefas: {
      segunda: [
        {
          id: "s3-seg-mdi",
          disciplinaId: "metodos-deterministicos-i",
          disciplinaNome: "Métodos Determinísticos I",
          disciplinaCodigo: "MDI",
          disciplinaCor: "#2563EB",
          aulaId: "mdi-a3",
          aulaTitulo: "Proposições e Conectivos",
          tipo: "podcast",
          titulo: "🎧 Métodos Det. I Aula 3: Lógica Proposicional",
          descricao:
            "Resumo sobre proposições, conectivos (e, ou, não, se...então, se e somente se), tabelas-verdade básicas.",
          duracaoMinutos: 30,
          concluida: false,
        },
      ],
      terca: [
        {
          id: "s3-ter-mdi",
          disciplinaId: "metodos-deterministicos-i",
          disciplinaNome: "Métodos Determinísticos I",
          disciplinaCodigo: "MDI",
          disciplinaCor: "#2563EB",
          aulaId: "mdi-a3",
          aulaTitulo: "Proposições e Conectivos",
          tipo: "podcast",
          titulo: "🎧 Métodos Det. I EP3",
          descricao:
            "Resolver EP3 mentalmente. Focar em construção de tabelas-verdade e identificação de conectivos.",
          duracaoMinutos: 25,
          concluida: false,
        },
      ],
      quarta: [
        {
          id: "s3-qua-hpa",
          disciplinaId: "historia-pensamento-administrativo-ii",
          disciplinaNome: "História do Pensamento Adm. II",
          disciplinaCodigo: "HPA2",
          disciplinaCor: "#7C3AED",
          aulaId: "hpa-a15",
          aulaTitulo: "Teoria Estruturalista",
          tipo: "podcast",
          titulo: "🎧 HPA II Aula 15: Estruturalista",
          descricao:
            "Resumo sobre teoria estruturalista aplicada à administração e novos modelos de análise organizacional.",
          duracaoMinutos: 30,
          concluida: false,
        },
      ],
      quinta: [
        {
          id: "s3-qui-hpa",
          disciplinaId: "historia-pensamento-administrativo-ii",
          disciplinaNome: "História do Pensamento Adm. II",
          disciplinaCodigo: "HPA2",
          disciplinaCor: "#7C3AED",
          aulaId: "hpa-a16",
          aulaTitulo: "Teoria dos Sistemas",
          tipo: "podcast",
          titulo: "🎧 HPA II Aula 16: Teoria dos Sistemas",
          descricao:
            "Resumo sobre organizações como sistemas abertos: inputs, processamento, outputs, feedback, entropia.",
          duracaoMinutos: 30,
          concluida: false,
        },
      ],
      sexta: [
        {
          id: "s3-sex-cg1",
          disciplinaId: "contabilidade-geral-i",
          disciplinaNome: "Contabilidade Geral I",
          disciplinaCodigo: "CG1",
          disciplinaCor: "#059669",
          aulaId: "cg1-l3",
          aulaTitulo: "Relatórios e Demonstrações",
          tipo: "podcast",
          titulo: "🎧 Contab. Geral I Lição 3: Relatórios",
          descricao:
            "Resumo sobre etapas, conceitos, categorização, aplicação dos conceitos, bens e direitos.",
          duracaoMinutos: 30,
          concluida: false,
        },
      ],
      sabado: [
        {
          id: "s3-sab-ad1",
          disciplinaId: "historia-pensamento-administrativo-ii",
          disciplinaNome: "História do Pensamento Adm. II",
          disciplinaCodigo: "HPA2",
          disciplinaCor: "#7C3AED",
          tipo: "ad",
          titulo: "✍️ AD1 HPA II (Aulas 11-16)",
          descricao:
            "Resolver AD1 de HPA II na plataforma. Conteúdo: Aulas 11 a 16. ATENÇÃO: prazo termina 16/08!",
          duracaoMinutos: 120,
          concluida: false,
        },
        {
          id: "s3-sab-ad2",
          disciplinaId: "metodos-deterministicos-i",
          disciplinaNome: "Métodos Determinísticos I",
          disciplinaCodigo: "MDI",
          disciplinaCor: "#2563EB",
          tipo: "ad",
          titulo: "✍️ AD1 Métodos Questão 2",
          descricao: "Resolver AD1 Q2. Escrever à mão, escanear em PDF. Prazo: 19/08.",
          duracaoMinutos: 90,
          concluida: false,
        },
        {
          id: "s3-sab-resumo",
          disciplinaId: "geral",
          disciplinaNome: "Resumo da Semana",
          disciplinaCodigo: "GER",
          disciplinaCor: "#64748B",
          tipo: "video",
          titulo: "🎥 Resumo Visual da Semana 3",
          descricao:
            "Revisar: Métodos A3 (Lógica), HPA A15-A16 (Estruturalista/Sistemas), Contab L3. Revisar Aulas 11-16 de HPA para AD1.",
          duracaoMinutos: 60,
          concluida: false,
        },
      ],
      domingo: [
        {
          id: "s3-dom-sim",
          disciplinaId: "contabilidade-geral-i",
          disciplinaNome: "Contabilidade Geral I",
          disciplinaCodigo: "CG1",
          disciplinaCor: "#059669",
          tipo: "simulado",
          titulo: "📝 Simulado Contab L1-L3",
          descricao:
            "Praticar questões teóricas sobre princípios contábeis, relatórios e demonstrações. Simular formato da AD1.",
          duracaoMinutos: 90,
          concluida: false,
        },
      ],
    },
  },
  {
    numero: 4,
    periodo: "17/08 a 23/08",
    dataInicio: "2026-08-17",
    dataFim: "2026-08-23",
    observacoes: "🔴 SEMANA CRÍTICA: AD1 Contab Geral I (17-23/08) + AD1 Métodos Q3 (até 26/08).",
    tarefas: {
      segunda: [
        {
          id: "s4-seg-mdi",
          disciplinaId: "metodos-deterministicos-i",
          disciplinaNome: "Métodos Determinísticos I",
          disciplinaCodigo: "MDI",
          disciplinaCor: "#2563EB",
          aulaId: "mdi-a4",
          aulaTitulo: "Tabelas-verdade e Leis da Lógica",
          tipo: "podcast",
          titulo: "🎧 Métodos Det. I Aula 4: Tabelas-verdade",
          descricao:
            "Resumo sobre construção de tabelas-verdade, leis da lógica (idempotência, comutativa, associativa, distributiva, De Morgan).",
          duracaoMinutos: 30,
          concluida: false,
        },
      ],
      terca: [
        {
          id: "s4-ter-mdi",
          disciplinaId: "metodos-deterministicos-i",
          disciplinaNome: "Métodos Determinísticos I",
          disciplinaCodigo: "MDI",
          disciplinaCor: "#2563EB",
          aulaId: "mdi-a5",
          aulaTitulo: "Argumentos e Provas",
          tipo: "podcast",
          titulo: "🎧 Métodos Det. I Aula 5: Argumentos",
          descricao:
            "Resumo sobre argumentos válidos, regras de inferência, demonstrações diretas e por contraposição.",
          duracaoMinutos: 30,
          concluida: false,
        },
      ],
      quarta: [
        {
          id: "s4-qua-hpa",
          disciplinaId: "historia-pensamento-administrativo-ii",
          disciplinaNome: "História do Pensamento Adm. II",
          disciplinaCodigo: "HPA2",
          disciplinaCor: "#7C3AED",
          aulaId: "hpa-a17",
          aulaTitulo: "Planejamento Estratégico",
          tipo: "podcast",
          titulo: "🎧 HPA II Aula 17: Gestão Estratégica",
          descricao:
            "Resumo sobre escola do planejamento, administração estratégica, ansoff, porter, matriz SWOT.",
          duracaoMinutos: 30,
          concluida: false,
        },
      ],
      quinta: [
        {
          id: "s4-qui-hpa",
          disciplinaId: "historia-pensamento-administrativo-ii",
          disciplinaNome: "História do Pensamento Adm. II",
          disciplinaCodigo: "HPA2",
          disciplinaCor: "#7C3AED",
          aulaId: "hpa-a18",
          aulaTitulo: "Abordagem Contingencial",
          tipo: "podcast",
          titulo: "🎧 HPA II Aula 18: Contingencial",
          descricao:
            "Resumo sobre abordagem contingencial: não existe uma única melhor forma de administrar. Depende do contexto.",
          duracaoMinutos: 30,
          concluida: false,
        },
      ],
      sexta: [
        {
          id: "s4-sex-cg1",
          disciplinaId: "contabilidade-geral-i",
          disciplinaNome: "Contabilidade Geral I",
          disciplinaCodigo: "CG1",
          disciplinaCor: "#059669",
          aulaId: "cg1-l4",
          aulaTitulo: "Balanço Patrimonial",
          tipo: "podcast",
          titulo: "🎧 Contab. Geral I Lição 4: BP",
          descricao:
            "Resumo sobre conceito de BP, características de grupos e subgrupos, situação financeira vs econômica.",
          duracaoMinutos: 30,
          concluida: false,
        },
      ],
      sabado: [
        {
          id: "s4-sab-ad",
          disciplinaId: "contabilidade-geral-i",
          disciplinaNome: "Contabilidade Geral I",
          disciplinaCodigo: "CG1",
          disciplinaCor: "#059669",
          tipo: "ad",
          titulo: "✍️ AD1 Contabilidade Geral I",
          descricao:
            "Resolver AD1 de Contab Geral I na plataforma. Conteúdo: Lições 1 a 4 + Questões Suplementares. Prazo: 23/08.",
          duracaoMinutos: 120,
          concluida: false,
        },
        {
          id: "s4-sab-ad2",
          disciplinaId: "metodos-deterministicos-i",
          disciplinaNome: "Métodos Determinísticos I",
          disciplinaCodigo: "MDI",
          disciplinaCor: "#2563EB",
          tipo: "ad",
          titulo: "✍️ AD1 Métodos Questão 3",
          descricao: "Resolver AD1 Q3. Escrever à mão, escanear em PDF. Prazo: 26/08.",
          duracaoMinutos: 90,
          concluida: false,
        },
        {
          id: "s4-sab-resumo",
          disciplinaId: "geral",
          disciplinaNome: "Resumo da Semana",
          disciplinaCodigo: "GER",
          disciplinaCor: "#64748B",
          tipo: "video",
          titulo: "🎥 Resumo Visual da Semana 4",
          descricao:
            "Revisar: Métodos A4-A5 (Lógica/Argumentos), HPA A17-A18 (Estratégia/Contingencial), Contab L4 (BP).",
          duracaoMinutos: 60,
          concluida: false,
        },
      ],
      domingo: [
        {
          id: "s4-dom-sim",
          disciplinaId: "metodos-deterministicos-i",
          disciplinaNome: "Métodos Determinísticos I",
          disciplinaCodigo: "MDI",
          disciplinaCor: "#2563EB",
          tipo: "simulado",
          titulo: "📝 Simulado Métodos A1-A5",
          descricao:
            "Simulado completo cobrindo Aulas 1 a 5. Focar em conjuntos, números, lógica proposicional e argumentos.",
          duracaoMinutos: 120,
          concluida: false,
        },
      ],
    },
  },
  {
    numero: 5,
    periodo: "24/08 a 30/08",
    dataInicio: "2026-08-24",
    dataFim: "2026-08-30",
    observacoes:
      "🔴 SEMANA CRÍTICA: AD1 Métodos Q4 (até 02/09). Última semana antes da revisão AP1.",
    tarefas: {
      segunda: [
        {
          id: "s5-seg-mdi",
          disciplinaId: "metodos-deterministicos-i",
          disciplinaNome: "Métodos Determinísticos I",
          disciplinaCodigo: "MDI",
          disciplinaCor: "#2563EB",
          aulaId: "mdi-a6",
          aulaTitulo: "Decimais, Porcentagens e Irracionais",
          tipo: "podcast",
          titulo: "🎧 Métodos Det. I Aula 6: Decimais/Irracionais",
          descricao:
            "Resumo sobre representação decimal de racionais, porcentagens, números irracionais (raiz de 2, pi, e).",
          duracaoMinutos: 30,
          concluida: false,
        },
      ],
      terca: [
        {
          id: "s5-ter-mdi",
          disciplinaId: "metodos-deterministicos-i",
          disciplinaNome: "Métodos Determinísticos I",
          disciplinaCodigo: "MDI",
          disciplinaCor: "#2563EB",
          aulaId: "mdi-a7",
          aulaTitulo: "Potências, Radicais e Expressões",
          tipo: "podcast",
          titulo: "🎧 Métodos Det. I Aula 7: Potências/Radicais",
          descricao:
            "Resumo sobre potências (regras de expoentes), radicais (racionalização), expressões numéricas.",
          duracaoMinutos: 30,
          concluida: false,
        },
      ],
      quarta: [
        {
          id: "s5-qua-hpa",
          disciplinaId: "historia-pensamento-administrativo-ii",
          disciplinaNome: "História do Pensamento Adm. II",
          disciplinaCodigo: "HPA2",
          disciplinaCor: "#7C3AED",
          aulaId: "hpa-a19",
          aulaTitulo: "Empreendedorismo",
          tipo: "podcast",
          titulo: "🎧 HPA II Aula 19: Empreendedorismo",
          descricao: "Resumo sobre teorias e modelos de empreendedorismo corporativo e social.",
          duracaoMinutos: 30,
          concluida: false,
        },
      ],
      quinta: [
        {
          id: "s5-qui-hpa",
          disciplinaId: "historia-pensamento-administrativo-ii",
          disciplinaNome: "História do Pensamento Adm. II",
          disciplinaCodigo: "HPA2",
          disciplinaCor: "#7C3AED",
          aulaId: "hpa-a20",
          aulaTitulo: "Gestão da Qualidade",
          tipo: "podcast",
          titulo: "🎧 HPA II Aula 20: Qualidade",
          descricao:
            "Resumo sobre teorias da qualidade total, Deming, Juran, Crosby, Ishikawa, ciclos PDCA.",
          duracaoMinutos: 30,
          concluida: false,
        },
      ],
      sexta: [
        {
          id: "s5-sex-cg1",
          disciplinaId: "contabilidade-geral-i",
          disciplinaNome: "Contabilidade Geral I",
          disciplinaCodigo: "CG1",
          disciplinaCor: "#059669",
          aulaId: "cg1-l5",
          aulaTitulo: "Situação Financeira vs Econômica",
          tipo: "podcast",
          titulo: "🎧 Contab. Geral I Lição 5: Fin vs Econ",
          descricao:
            "Resumo sobre disposição e hierarquia das contas por grau de liquidez e exigibilidade, elaboração do BP.",
          duracaoMinutos: 30,
          concluida: false,
        },
      ],
      sabado: [
        {
          id: "s5-sab-ad",
          disciplinaId: "metodos-deterministicos-i",
          disciplinaNome: "Métodos Determinísticos I",
          disciplinaCodigo: "MDI",
          disciplinaCor: "#2563EB",
          tipo: "ad",
          titulo: "✍️ AD1 Métodos Questão 4",
          descricao:
            "Resolver AD1 Q4. Última questão da AD1! Escrever à mão, escanear em PDF. Prazo: 02/09.",
          duracaoMinutos: 90,
          concluida: false,
        },
        {
          id: "s5-sab-resumo",
          disciplinaId: "geral",
          disciplinaNome: "Resumo da Semana",
          disciplinaCodigo: "GER",
          disciplinaCor: "#64748B",
          tipo: "video",
          titulo: "🎥 Resumo Visual da Semana 5",
          descricao:
            "Revisar: Métodos A6-A7 (Decimais/Potências), HPA A19-A20 (Empreendedorismo/Qualidade), Contab L5. Começar revisão AP1.",
          duracaoMinutos: 90,
          concluida: false,
        },
      ],
      domingo: [
        {
          id: "s5-dom-sim",
          disciplinaId: "geral",
          disciplinaNome: "Simulado Geral AP1",
          disciplinaCodigo: "GER",
          disciplinaCor: "#64748B",
          tipo: "simulado",
          titulo: "📝 Simulado Completo Pré-AP1",
          descricao:
            "Simulado integrado: Métodos (A1-A7) + HPA (A11-A20) + Contab (L1-L5). Simular condições de prova. Cronometrar.",
          duracaoMinutos: 180,
          concluida: false,
        },
      ],
    },
  },
];

const semanasSetembro: SemanaEstudo[] = [
  {
    numero: 6,
    periodo: "31/08 a 06/09",
    dataInicio: "2026-08-31",
    dataFim: "2026-09-06",
    observacoes: "🚨 SEMANA DA AP1! Métodos (05/09) e HPA (06/09). Contab AP1 na semana que vem.",
    tarefas: {
      segunda: [
        {
          id: "s6-seg-mdi",
          disciplinaId: "metodos-deterministicos-i",
          disciplinaNome: "Métodos Determinísticos I",
          disciplinaCodigo: "MDI",
          disciplinaCor: "#2563EB",
          aulaId: "mdi-a8",
          aulaTitulo: "Números Reais: Ordem, Intervalos, Inequações",
          tipo: "podcast",
          titulo: "🎧 Métodos Det. I Aula 8: Reais/Inequações",
          descricao:
            "Última aula antes da AP1. Resumo sobre relação de ordem, intervalos, inequações lineares.",
          duracaoMinutos: 30,
          concluida: false,
        },
      ],
      terca: [
        {
          id: "s6-ter-rev",
          disciplinaId: "metodos-deterministicos-i",
          disciplinaNome: "Métodos Determinísticos I",
          disciplinaCodigo: "MDI",
          disciplinaCor: "#2563EB",
          tipo: "revisao",
          titulo: "📚 Revisão Métodos Aulas 1-8",
          descricao:
            "Revisar todas as aulas 1 a 8. Focar em pontos fracos identificados nos simulados. Revisar pp.144-145 (Equação 1º Grau).",
          duracaoMinutos: 60,
          concluida: false,
        },
      ],
      quarta: [
        {
          id: "s6-qua-rev",
          disciplinaId: "historia-pensamento-administrativo-ii",
          disciplinaNome: "História do Pensamento Adm. II",
          disciplinaCodigo: "HPA2",
          disciplinaCor: "#7C3AED",
          tipo: "revisao",
          titulo: "📚 Revisão HPA Aulas 11-20",
          descricao:
            "Revisar todas as aulas 11 a 20. Focar em conceitos-chave de cada autor/escola. Criar mapa mental rápido.",
          duracaoMinutos: 60,
          concluida: false,
        },
      ],
      quinta: [
        {
          id: "s6-qui-rev",
          disciplinaId: "contabilidade-geral-i",
          disciplinaNome: "Contabilidade Geral I",
          disciplinaCodigo: "CG1",
          disciplinaCor: "#059669",
          tipo: "revisao",
          titulo: "📚 Revisão Contab Lições 1-5",
          descricao:
            "Revisar lições 1 a 5. Praticar elaboração rápida de BP. Revisar princípios e convenções.",
          duracaoMinutos: 60,
          concluida: false,
        },
      ],
      sexta: [
        {
          id: "s6-sex-rev",
          disciplinaId: "metodos-deterministicos-i",
          disciplinaNome: "Métodos Determinísticos I",
          disciplinaCodigo: "MDI",
          disciplinaCor: "#2563EB",
          tipo: "revisao",
          titulo: "📚 Revisão Final Métodos",
          descricao:
            "Última revisão antes da AP1. Resolver exercícios de provas antigas se disponíveis. Dormir cedo.",
          duracaoMinutos: 45,
          concluida: false,
        },
      ],
      sabado: [
        {
          id: "s6-sab-ap1",
          disciplinaId: "metodos-deterministicos-i",
          disciplinaNome: "Métodos Determinísticos I",
          disciplinaCodigo: "MDI",
          disciplinaCor: "#2563EB",
          tipo: "ap",
          titulo: "🚨 AP1 Métodos Determinísticos I",
          descricao:
            "PROVA PRESENCIAL. 09:30 no polo. Aulas 1-8 + pp.144-145. Levar caneta, documento, água. Chegar com antecedência.",
          duracaoMinutos: 120,
          concluida: false,
        },
      ],
      domingo: [
        {
          id: "s6-dom-ap1",
          disciplinaId: "historia-pensamento-administrativo-ii",
          disciplinaNome: "História do Pensamento Adm. II",
          disciplinaCodigo: "HPA2",
          disciplinaCor: "#7C3AED",
          tipo: "ap",
          titulo: "🚨 AP1 HPA II",
          descricao:
            "PROVA PRESENCIAL. 13:30 às 16:00 no polo. Aulas 11-20. Levar caneta, documento. Descansar antes da prova.",
          duracaoMinutos: 150,
          concluida: false,
        },
      ],
    },
  },
  {
    numero: 7,
    periodo: "07/09 a 13/09",
    dataInicio: "2026-09-07",
    dataFim: "2026-09-13",
    observacoes:
      "🚨 AP1 Contabilidade Geral I (13/09, domingo, 09:30-12:00). Início do conteúdo pós-AP1.",
    tarefas: {
      segunda: [
        {
          id: "s7-seg-mdi",
          disciplinaId: "metodos-deterministicos-i",
          disciplinaNome: "Métodos Determinísticos I",
          disciplinaCodigo: "MDI",
          disciplinaCor: "#2563EB",
          aulaId: "mdi-a9",
          aulaTitulo: "Módulo e Inequações Modulares",
          tipo: "podcast",
          titulo: "🎧 Métodos Det. I Aula 9: Módulo",
          descricao:
            "Início do conteúdo da AP2. Resumo sobre módulo de um número real, propriedades, inequações modulares.",
          duracaoMinutos: 30,
          concluida: false,
        },
      ],
      terca: [
        {
          id: "s7-ter-mdi",
          disciplinaId: "metodos-deterministicos-i",
          disciplinaNome: "Métodos Determinísticos I",
          disciplinaCodigo: "MDI",
          disciplinaCor: "#2563EB",
          aulaId: "mdi-a9",
          aulaTitulo: "Módulo e Inequações Modulares",
          tipo: "podcast",
          titulo: "🎧 Métodos Det. I EP7",
          descricao: "Resolver EP7 mentalmente. Focar em resolução de inequações modulares.",
          duracaoMinutos: 25,
          concluida: false,
        },
      ],
      quarta: [
        {
          id: "s7-qua-hpa",
          disciplinaId: "historia-pensamento-administrativo-ii",
          disciplinaNome: "História do Pensamento Adm. II",
          disciplinaCodigo: "HPA2",
          disciplinaCor: "#7C3AED",
          aulaId: "hpa-a21",
          aulaTitulo: "Toffler e Naisbitt",
          tipo: "podcast",
          titulo: "🎧 HPA II Aula 21: Nova Visão do Futuro",
          descricao:
            "Resumo sobre Alvin Toffler (Onda do Choque, Terceira Onda) e John Naisbitt (Megatendências).",
          duracaoMinutos: 30,
          concluida: false,
        },
      ],
      quinta: [
        {
          id: "s7-qui-hpa",
          disciplinaId: "historia-pensamento-administrativo-ii",
          disciplinaNome: "História do Pensamento Adm. II",
          disciplinaCodigo: "HPA2",
          disciplinaCor: "#7C3AED",
          aulaId: "hpa-a22",
          aulaTitulo: "Reengenharia",
          tipo: "podcast",
          titulo: "🎧 HPA II Aula 22: Reengenharia",
          descricao: "Resumo sobre Michael Hammer, reengenharia de processos, redesenho radical.",
          duracaoMinutos: 30,
          concluida: false,
        },
      ],
      sexta: [
        {
          id: "s7-sex-cg1",
          disciplinaId: "contabilidade-geral-i",
          disciplinaNome: "Contabilidade Geral I",
          disciplinaCodigo: "CG1",
          disciplinaCor: "#059669",
          aulaId: "cg1-l5",
          aulaTitulo: "Revisão BP",
          tipo: "revisao",
          titulo: "📚 Revisão Final Contab AP1",
          descricao:
            "Última revisão antes da AP1. Praticar elaboração completa de BP com Ativo, Passivo e PL. Dormir cedo.",
          duracaoMinutos: 60,
          concluida: false,
        },
      ],
      sabado: [
        {
          id: "s7-sab-resumo",
          disciplinaId: "geral",
          disciplinaNome: "Resumo da Semana",
          disciplinaCodigo: "GER",
          disciplinaCor: "#64748B",
          tipo: "video",
          titulo: "🎥 Resumo Visual da Semana 7",
          descricao:
            "Revisar: Métodos A9 (Módulo), HPA A21-A22 (Toffler/Reengenharia). Preparar mentalmente para AP1 Contab.",
          duracaoMinutos: 60,
          concluida: false,
        },
      ],
      domingo: [
        {
          id: "s7-dom-ap1",
          disciplinaId: "contabilidade-geral-i",
          disciplinaNome: "Contabilidade Geral I",
          disciplinaCodigo: "CG1",
          disciplinaCor: "#059669",
          tipo: "ap",
          titulo: "🚨 AP1 Contabilidade Geral I",
          descricao:
            "PROVA PRÁTICA PRESENCIAL. 09:30-12:00 no polo. Lições 1-5. Elaboração de BP com Ativo, Passivo e PL. Levar caneta, calculadora (se permitido), documento.",
          duracaoMinutos: 150,
          concluida: false,
        },
      ],
    },
  },
];

// ============================================================
// HELPERS
// ============================================================
export const todasSemanas = [...semanasAgosto, ...semanasSetembro];

export const getTarefasPorDia = (data: string): TarefaDiaria[] => {
  const d = parseISO(data);
  const diaSemana = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"][
    d.getUTCDay()
  ] as DiaSemana;
  for (const semana of todasSemanas) {
    const inicio = parseISO(semana.dataInicio);
    const fim = parseISO(semana.dataFim);
    if (d >= inicio && d <= fim) {
      return semana.tarefas[diaSemana] || [];
    }
  }
  return [];
};

export const getTarefasPendentes = (): TarefaDiaria[] => {
  const hoje = new Date();
  for (const semana of todasSemanas) {
    const inicio = parseISO(semana.dataInicio);
    const fim = parseISO(semana.dataFim);
    if (hoje >= inicio && hoje <= fim) {
      const diaSemana = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"][
        hoje.getDay()
      ] as DiaSemana;
      return (semana.tarefas[diaSemana] || []).filter((t) => !t.concluida);
    }
  }
  return [];
};

export const getProgressoSemana = (numeroSemana: number) => {
  const semana = todasSemanas.find((s) => s.numero === numeroSemana);
  if (!semana) return 0;
  let total = 0;
  let concluidas = 0;
  Object.values(semana.tarefas).forEach((tarefas) => {
    total += tarefas.length;
    concluidas += tarefas.filter((t) => t.concluida).length;
  });
  return total > 0 ? Math.round((concluidas / total) * 100) : 0;
};
