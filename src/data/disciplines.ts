// src/data/disciplines.ts
// Dados reais das disciplinas - CEDERJ Administração 2026-2

export interface Aula {
  id: string;
  numero: number;
  titulo: string;
  semanaEstudo: number; // semana do cronograma oficial
  paginas?: string; // ex: "pp.144-145"
  atividades: {
    tipo: 'leitura_caderno' | 'ep' | 'atividade_complementar' | 'video' | 'revisao';
    descricao: string;
    obrigatoria: boolean;
  }[];
  materiaisComplementares?: string[];
  concluida: boolean;
}

export interface Avaliacao {
  id: string;
  tipo: 'AD1' | 'AD2' | 'AP1' | 'AP2' | 'AP3';
  dataInicio?: string; // ISO date
  dataFim?: string; // ISO date (para ADs com prazo)
  dataPresencial?: string; // ISO date (para APs)
  horario?: string; // ex: "09:30"
  conteudoCobrado: string;
  peso?: number;
  observacoes?: string;
  entregue: boolean;
  nota?: number;
}

export interface Disciplina {
  id: string;
  nome: string;
  codigo: string;
  icone: string;
  cor: string;
  coordenador: string;
  totalAulas: number;
  aulas: Aula[];
  avaliacoes: Avaliacao[];
  formulaNota: {
    n1: string;
    n2: string;
    aprovacao: string;
    ap3: string;
  };
  guia: {
    objetivoGeral: string;
    metodoEstudo: string;
    observacoes: string[];
  };
  progresso: number; // 0-100
}

// ============================================================
// MÉTODOS DETERMINÍSTICOS I
// ============================================================
export const metodosDeterministicos: Disciplina = {
  id: 'metodos-deterministicos-i',
  nome: 'Métodos Determinísticos I',
  codigo: 'MDI',
  icone: '📐',
  cor: '#2563EB', // blue-600
  coordenador: 'Denise de Oliveira Pinto e Leonardo Tadeu Silvares Martins',
  totalAulas: 15,
  progresso: 0,
  aulas: [
    {
      id: 'mdi-a1', numero: 1, titulo: 'Conjuntos', semanaEstudo: 1,
      atividades: [
        { tipo: 'leitura_caderno', descricao: 'Ler Caderno Didático - Aula 1', obrigatoria: true },
        { tipo: 'ep', descricao: 'EP 1 - Lista de exercícios', obrigatoria: true },
      ],
      concluida: false,
    },
    {
      id: 'mdi-a2', numero: 2, titulo: 'Os Conjuntos dos Números Naturais, Inteiros e Racionais', semanaEstudo: 2,
      paginas: 'pp.144-145 (Equação do 1º Grau, Aula 12)',
      atividades: [
        { tipo: 'leitura_caderno', descricao: 'Ler Caderno Didático - Aula 2', obrigatoria: true },
        { tipo: 'ep', descricao: 'EP 2 - Lista de exercícios', obrigatoria: true },
        { tipo: 'atividade_complementar', descricao: 'Revisar pp.144-145 da Aula 12 (Equação 1º Grau)', obrigatoria: true },
      ],
      concluida: false,
    },
    {
      id: 'mdi-a3', numero: 3, titulo: 'Proposições e Conectivos', semanaEstudo: 3,
      atividades: [
        { tipo: 'leitura_caderno', descricao: 'Ler Caderno Didático - Aula 3', obrigatoria: true },
        { tipo: 'ep', descricao: 'EP 3 - Lista de exercícios', obrigatoria: true },
      ],
      concluida: false,
    },
    {
      id: 'mdi-a4', numero: 4, titulo: 'Tabelas-verdade e Leis da Lógica', semanaEstudo: 4,
      atividades: [
        { tipo: 'leitura_caderno', descricao: 'Ler Caderno Didático - Aula 4', obrigatoria: true },
        { tipo: 'ep', descricao: 'EP 4 - Lista de exercícios', obrigatoria: true },
      ],
      concluida: false,
    },
    {
      id: 'mdi-a5', numero: 5, titulo: 'Argumentos e Provas', semanaEstudo: 4,
      atividades: [
        { tipo: 'leitura_caderno', descricao: 'Ler Caderno Didático - Aula 5', obrigatoria: true },
        { tipo: 'ep', descricao: 'EP 4 (continuação)', obrigatoria: true },
      ],
      concluida: false,
    },
    {
      id: 'mdi-a6', numero: 6, titulo: 'Representação Decimal de Números Racionais, Porcentagens e Números Irracionais', semanaEstudo: 5,
      atividades: [
        { tipo: 'leitura_caderno', descricao: 'Ler Caderno Didático - Aula 6', obrigatoria: true },
        { tipo: 'ep', descricao: 'EP 5 - Lista de exercícios', obrigatoria: true },
      ],
      concluida: false,
    },
    {
      id: 'mdi-a7', numero: 7, titulo: 'Potências, Radicais e Expressões Numéricas', semanaEstudo: 5,
      atividades: [
        { tipo: 'leitura_caderno', descricao: 'Ler Caderno Didático - Aula 7', obrigatoria: true },
        { tipo: 'ep', descricao: 'EP 5 (continuação)', obrigatoria: true },
      ],
      concluida: false,
    },
    {
      id: 'mdi-a8', numero: 8, titulo: 'Números Reais: Relação de Ordem, Intervalos e Inequações', semanaEstudo: 6,
      atividades: [
        { tipo: 'leitura_caderno', descricao: 'Ler Caderno Didático - Aula 8', obrigatoria: true },
        { tipo: 'ep', descricao: 'EP 6 - Lista de exercícios', obrigatoria: true },
        { tipo: 'revisao', descricao: 'Revisão geral para AP1', obrigatoria: true },
      ],
      concluida: false,
    },
    {
      id: 'mdi-a9', numero: 9, titulo: 'Módulo de um Número Real e Inequações Modulares', semanaEstudo: 7,
      atividades: [
        { tipo: 'leitura_caderno', descricao: 'Ler Caderno Didático - Aula 9', obrigatoria: true },
        { tipo: 'ep', descricao: 'EP 7 - Lista de exercícios', obrigatoria: true },
      ],
      concluida: false,
    },
    {
      id: 'mdi-a10', numero: 10, titulo: 'Sistemas de Coordenadas em um Plano', semanaEstudo: 8,
      atividades: [
        { tipo: 'leitura_caderno', descricao: 'Ler Caderno Didático - Aula 10', obrigatoria: true },
        { tipo: 'ep', descricao: 'EP 8 - Lista de exercícios', obrigatoria: true },
      ],
      concluida: false,
    },
    {
      id: 'mdi-a11', numero: 11, titulo: 'Distância entre Pontos do Plano Euclidiano', semanaEstudo: 8,
      atividades: [
        { tipo: 'leitura_caderno', descricao: 'Ler Caderno Didático - Aula 11', obrigatoria: true },
        { tipo: 'ep', descricao: 'EP 8 (continuação)', obrigatoria: true },
      ],
      concluida: false,
    },
    {
      id: 'mdi-a12', numero: 12, titulo: 'Equações, Inequações e Sistemas de 1º e 2º Graus', semanaEstudo: 9,
      paginas: 'pp.146-149, 155-157',
      atividades: [
        { tipo: 'leitura_caderno', descricao: 'Ler Caderno Didático - Aula 12', obrigatoria: true },
        { tipo: 'ep', descricao: 'EP 9 - Lista de exercícios', obrigatoria: true },
      ],
      concluida: false,
    },
    {
      id: 'mdi-a13', numero: 13, titulo: 'Introdução às Funções', semanaEstudo: 10,
      atividades: [
        { tipo: 'leitura_caderno', descricao: 'Ler Caderno Didático - Aula 13', obrigatoria: true },
        { tipo: 'ep', descricao: 'EP 10 - Lista de exercícios', obrigatoria: true },
      ],
      concluida: false,
    },
    {
      id: 'mdi-a14', numero: 14, titulo: 'Gráficos de Funções: Linear e Quadrática', semanaEstudo: 10,
      atividades: [
        { tipo: 'leitura_caderno', descricao: 'Ler Caderno Didático - Aula 14', obrigatoria: true },
        { tipo: 'ep', descricao: 'EP 10 (continuação)', obrigatoria: true },
      ],
      concluida: false,
    },
    {
      id: 'mdi-a16', numero: 16, titulo: 'Aplicações', semanaEstudo: 11,
      atividades: [
        { tipo: 'leitura_caderno', descricao: 'Ler Caderno Didático - Aula 16', obrigatoria: true },
        { tipo: 'ep', descricao: 'EP 11 - Lista de exercícios', obrigatoria: true },
      ],
      concluida: false,
    },
  ],
  avaliacoes: [
    { id: 'mdi-ad1-q1', tipo: 'AD1', dataFim: '2026-08-19', conteudoCobrado: 'Questão 1', peso: 0.5, observacoes: 'Prazo estendido por ingresso tardio de calouros', entregue: false },
    { id: 'mdi-ad1-q2', tipo: 'AD1', dataFim: '2026-08-19', conteudoCobrado: 'Questão 2', peso: 0.5, entregue: false },
    { id: 'mdi-ad1-q3', tipo: 'AD1', dataFim: '2026-08-26', conteudoCobrado: 'Questão 3', peso: 0.5, entregue: false },
    { id: 'mdi-ad1-q4', tipo: 'AD1', dataFim: '2026-09-02', conteudoCobrado: 'Questão 4', peso: 0.5, entregue: false },
    { id: 'mdi-ad2-q1', tipo: 'AD2', dataFim: '2026-09-16', conteudoCobrado: 'Questão 1', peso: 0.67, entregue: false },
    { id: 'mdi-ad2-q2', tipo: 'AD2', dataFim: '2026-09-23', conteudoCobrado: 'Questão 2', peso: 0.67, entregue: false },
    { id: 'mdi-ad2-q3', tipo: 'AD2', dataFim: '2026-10-07', conteudoCobrado: 'Questão 3', peso: 0.66, entregue: false },
    { id: 'mdi-ap1', tipo: 'AP1', dataPresencial: '2026-09-05', horario: '09:30', conteudoCobrado: 'Aulas 1 a 8 + pp.144-145 (Equação 1º Grau)', peso: 8, observacoes: 'Prova presencial no polo', entregue: false },
    { id: 'mdi-ap2', tipo: 'AP2', dataPresencial: '2026-10-17', horario: '09:30', conteudoCobrado: 'Aulas 9 a 16 (exceto Aula 15)', peso: 8, observacoes: 'Prova presencial no polo', entregue: false },
    { id: 'mdi-ap3', tipo: 'AP3', dataPresencial: '2026-11-21', horario: '08:30', conteudoCobrado: 'Todo o conteúdo do semestre', peso: 10, observacoes: 'Recuperação - média com maior N deve ser ≥ 5,0', entregue: false },
  ],
  formulaNota: {
    n1: 'N1 = (2 × AD1 + 8 × AP1) / 10',
    n2: 'N2 = (2 × AD2 + 8 × AP2) / 10',
    aprovacao: 'Média aritmética (N1 + N2) / 2 ≥ 6,0',
    ap3: 'Se média < 6,0: média(AP3, maior N) ≥ 5,0',
  },
  guia: {
    objetivoGeral: 'Revisar tópicos do ensino fundamental e médio de maneira aprofundada, abordando conceitos básicos visando a compreensão e desenvolvimento do Cálculo Diferencial e Integral em Métodos Determinísticos II.',
    metodoEstudo: 'Estudar Caderno Didático + EPs semanalmente. Resolver EPs antes de ver o gabarito. Participar dos encontros presenciais tendo refletido sobre os exercícios. Acessar plataforma 2x por semana.',
    observacoes: [
      'EPs são referência FUNDAMENTAL, não apenas complementar.',
      'A complexidade das questões das APs se baseia nos EPs.',
      'Resoluções da AD devem ser manuscritas, escaneadas em PDF.',
      'Aula 15 (Funções Polinomiais) NÃO é estudada nesta disciplina.',
      'Conteúdos posteriores dependem dos anteriores. Não acumule dúvidas!',
    ],
  },
};

// ============================================================
// HISTÓRIA DO PENSAMENTO ADMINISTRATIVO II
// ============================================================
export const historiaPensamentoAdm: Disciplina = {
  id: 'historia-pensamento-administrativo-ii',
  nome: 'História do Pensamento Administrativo II',
  codigo: 'HPA2',
  icone: '🏛️',
  cor: '#7C3AED', // violet-600
  coordenador: 'Prof. Júlio Macedo',
  totalAulas: 20,
  progresso: 0,
  aulas: [
    { id: 'hpa-a11', numero: 11, titulo: 'O Behaviorismo e as Teorias Comportamentalistas', semanaEstudo: 1, atividades: [{ tipo: 'leitura_caderno', descricao: 'Ler Caderno Didático - Aula 11', obrigatoria: true }], concluida: false },
    { id: 'hpa-a12', numero: 12, titulo: 'A Revolução Druckeriana: Gestão Contemporânea e Novos Desenhos Organizacionais', semanaEstudo: 1, atividades: [{ tipo: 'leitura_caderno', descricao: 'Ler Caderno Didático - Aula 12', obrigatoria: true }], concluida: false },
    { id: 'hpa-a13', numero: 13, titulo: 'Cultura e Clima Organizacional e Modelos de DO e APO de Mudança', semanaEstudo: 1, atividades: [{ tipo: 'leitura_caderno', descricao: 'Ler Caderno Didático - Aula 13', obrigatoria: true }], concluida: false },
    { id: 'hpa-a14', numero: 14, titulo: 'As Teorias sobre a Liderança: de Weber a Welch', semanaEstudo: 2, atividades: [{ tipo: 'leitura_caderno', descricao: 'Ler Caderno Didático - Aula 14', obrigatoria: true }], concluida: false },
    { id: 'hpa-a15', numero: 15, titulo: 'A Teoria Estruturalista Aplicada à Administração', semanaEstudo: 2, atividades: [{ tipo: 'leitura_caderno', descricao: 'Ler Caderno Didático - Aula 15', obrigatoria: true }], concluida: false },
    { id: 'hpa-a16', numero: 16, titulo: 'A Teoria dos Sistemas e a Análise das Organizações como Sistemas Abertos', semanaEstudo: 2, atividades: [{ tipo: 'leitura_caderno', descricao: 'Ler Caderno Didático - Aula 16', obrigatoria: true }], concluida: false },
    { id: 'hpa-a17', numero: 17, titulo: 'A Escola do Planejamento, Administração e Gestão Estratégica', semanaEstudo: 4, atividades: [{ tipo: 'leitura_caderno', descricao: 'Ler Caderno Didático - Aula 17', obrigatoria: true }], concluida: false },
    { id: 'hpa-a18', numero: 18, titulo: 'A Abordagem Contingencial da Administração', semanaEstudo: 4, atividades: [{ tipo: 'leitura_caderno', descricao: 'Ler Caderno Didático - Aula 18', obrigatoria: true }], concluida: false },
    { id: 'hpa-a19', numero: 19, titulo: 'As Teorias e Modelos de Empreendedorismo Corporativo e Social', semanaEstudo: 5, atividades: [{ tipo: 'leitura_caderno', descricao: 'Ler Caderno Didático - Aula 19', obrigatoria: true }], concluida: false },
    { id: 'hpa-a20', numero: 20, titulo: 'As Teorias e Novos Modelos de Gestão da Qualidade', semanaEstudo: 5, atividades: [{ tipo: 'leitura_caderno', descricao: 'Ler Caderno Didático - Aula 20', obrigatoria: true }], concluida: false },
    { id: 'hpa-a21', numero: 21, titulo: 'A Nova Visão do Futuro: Toffler e Naisbitt', semanaEstudo: 7, atividades: [{ tipo: 'leitura_caderno', descricao: 'Ler Caderno Didático - Aula 21', obrigatoria: true }], concluida: false },
    { id: 'hpa-a22', numero: 22, titulo: 'O Choque da Reengenharia', semanaEstudo: 7, atividades: [{ tipo: 'leitura_caderno', descricao: 'Ler Caderno Didático - Aula 22', obrigatoria: true }], concluida: false },
    { id: 'hpa-a23', numero: 23, titulo: 'A Nova Era dos Gurus', semanaEstudo: 8, atividades: [{ tipo: 'leitura_caderno', descricao: 'Ler Caderno Didático - Aula 23', obrigatoria: true }], concluida: false },
    { id: 'hpa-a24', numero: 24, titulo: 'As Teorias sobre Criatividade e Inovação nas Empresas', semanaEstudo: 8, atividades: [{ tipo: 'leitura_caderno', descricao: 'Ler Caderno Didático - Aula 24', obrigatoria: true }], concluida: false },
    { id: 'hpa-a25', numero: 25, titulo: 'Analisando o Trabalho na Sociedade Pós-Industrial', semanaEstudo: 9, atividades: [{ tipo: 'leitura_caderno', descricao: 'Ler Caderno Didático - Aula 25', obrigatoria: true }], concluida: false },
    { id: 'hpa-a26', numero: 26, titulo: 'As Teorias sobre o Capital Humano e Intelectual', semanaEstudo: 9, atividades: [{ tipo: 'leitura_caderno', descricao: 'Ler Caderno Didático - Aula 26', obrigatoria: true }], concluida: false },
    { id: 'hpa-a27', numero: 27, titulo: 'As Teorias e Modelos de Ética Empresarial', semanaEstudo: 11, atividades: [{ tipo: 'leitura_caderno', descricao: 'Ler Caderno Didático - Aula 27', obrigatoria: true }], concluida: false },
    { id: 'hpa-a28', numero: 28, titulo: 'Os Modelos de Gestão da Responsabilidade Social Corporativa', semanaEstudo: 11, atividades: [{ tipo: 'leitura_caderno', descricao: 'Ler Caderno Didático - Aula 28', obrigatoria: true }], concluida: false },
    { id: 'hpa-a29', numero: 29, titulo: 'Os Novos Marketings e o Gerenciamento da Marca', semanaEstudo: 11, atividades: [{ tipo: 'leitura_caderno', descricao: 'Ler Caderno Didático - Aula 29', obrigatoria: true }], concluida: false },
    { id: 'hpa-a30', numero: 30, titulo: 'A Corporação Virtual e os Novos Modelos Organizacionais', semanaEstudo: 11, atividades: [{ tipo: 'leitura_caderno', descricao: 'Ler Caderno Didático - Aula 30', obrigatoria: true }], concluida: false },
  ],
  avaliacoes: [
    { id: 'hpa-ad1', tipo: 'AD1', dataInicio: '2026-08-10', dataFim: '2026-08-16', conteudoCobrado: 'Aulas 11 a 16', peso: 2, observacoes: 'Nota de 0 a 2,0. Feita na plataforma.', entregue: false },
    { id: 'hpa-ad2', tipo: 'AD2', dataInicio: '2026-09-28', dataFim: '2026-10-04', conteudoCobrado: 'Aulas 21 a 26', peso: 2, observacoes: 'Nota de 0 a 2,0. Feita na plataforma.', entregue: false },
    { id: 'hpa-ap1', tipo: 'AP1', dataPresencial: '2026-09-06', horario: '13:30 às 16:00', conteudoCobrado: 'Aulas 11 a 20', peso: 8, observacoes: 'Grupo 1. Prova presencial no polo.', entregue: false },
    { id: 'hpa-ap2', tipo: 'AP2', dataPresencial: '2026-10-18', horario: '13:30 às 16:00', conteudoCobrado: 'Aulas 21 a 30', peso: 8, observacoes: 'Grupo 1. Prova presencial no polo.', entregue: false },
    { id: 'hpa-ap3', tipo: 'AP3', dataPresencial: '2026-11-22', horario: '14:00 às 16:00', conteudoCobrado: 'Aulas 11 a 30 (conteúdo completo)', peso: 10, observacoes: 'Grupo 1 e 2. Recuperação.', entregue: false },
  ],
  formulaNota: {
    n1: 'N1 = AD1 (20%) + AP1 (80%)',
    n2: 'N2 = AD2 (20%) + AP2 (80%)',
    aprovacao: 'Média aritmética (N1 + N2) / 2 ≥ 6,0',
    ap3: 'Se média < 6,0: média(AP3, maior N) ≥ 5,0',
  },
  guia: {
    objetivoGeral: 'Fornecer informações sobre a evolução do Pensamento Administrativo de meados do século XX até os dias atuais.',
    metodoEstudo: 'Ler aulas com autonomia. Fazer atividades e refletir sobre padrões de resposta. Discutir em fóruns. Buscar casos práticos em jornais e revistas.',
    observacoes: [
      'Disciplina dividida em 3 módulos: I (Aulas 11-17), II (Aulas 18-24), III (Aulas 25-30).',
      'ADs valem 20% cada. APs valem 80% cada.',
      'Revisões de nota devem ser solicitadas em até 72h após lançamento.',
      'Participar ativamente de fóruns de discussão na plataforma.',
    ],
  },
};

// ============================================================
// CONTABILIDADE GERAL I
// ============================================================
export const contabilidadeGeral: Disciplina = {
  id: 'contabilidade-geral-i',
  nome: 'Contabilidade Geral I',
  codigo: 'CG1',
  icone: '📊',
  cor: '#059669', // emerald-600
  coordenador: 'Prof. Everaldo Gaião e Silva',
  totalAulas: 14,
  progresso: 0,
  aulas: [
    { id: 'cg1-l1', numero: 1, titulo: 'Apresentação do Curso, Pólo, Tutores e Material Didático', semanaEstudo: 1, atividades: [{ tipo: 'leitura_caderno', descricao: 'Ler Lição 1', obrigatoria: true }], concluida: false },
    { id: 'cg1-l2', numero: 2, titulo: 'Contabilidade Econômica e Administrativa, Princípios e Convenções Contábeis', semanaEstudo: 2, atividades: [{ tipo: 'leitura_caderno', descricao: 'Ler Lição 2 + Questões Suplementares', obrigatoria: true }], concluida: false },
    { id: 'cg1-l3', numero: 3, titulo: 'Relatórios e Demonstrações Contábeis', semanaEstudo: 3, atividades: [{ tipo: 'leitura_caderno', descricao: 'Ler Lição 3 + Questões Suplementares', obrigatoria: true }], concluida: false },
    { id: 'cg1-l4', numero: 4, titulo: 'Balanço Patrimonial', semanaEstudo: 4, atividades: [{ tipo: 'leitura_caderno', descricao: 'Ler Lição 4 + Questões Suplementares', obrigatoria: true }], concluida: false },
    { id: 'cg1-l5', numero: 5, titulo: 'Situação Financeira versus Situação Econômica', semanaEstudo: 5, atividades: [{ tipo: 'leitura_caderno', descricao: 'Ler Lição 5 + Questões Suplementares', obrigatoria: true }], concluida: false },
    { id: 'cg1-l6', numero: 6, titulo: 'Regimes de Contabilidade: Competência e Caixa', semanaEstudo: 6, atividades: [{ tipo: 'leitura_caderno', descricao: 'Ler Lição 6 + Questões Suplementares', obrigatoria: true }, { tipo: 'revisao', descricao: 'Revisar lições 1 a 6', obrigatoria: true }], concluida: false },
    { id: 'cg1-l7', numero: 7, titulo: 'Lucro ou Prejuízo? Confronto entre Receitas e Custos/Despesas', semanaEstudo: 8, atividades: [{ tipo: 'leitura_caderno', descricao: 'Ler Lição 7 + Questões Suplementares', obrigatoria: true }], concluida: false },
    { id: 'cg1-l8', numero: 8, titulo: 'Integrando Balanço Patrimonial e DRE', semanaEstudo: 9, atividades: [{ tipo: 'leitura_caderno', descricao: 'Ler Lição 8 + Atividades Suplementares', obrigatoria: true }], concluida: false },
    { id: 'cg1-l9', numero: 9, titulo: 'Impacto dos Fatos Administrativos nas Demonstrações (Parte 1)', semanaEstudo: 10, atividades: [{ tipo: 'leitura_caderno', descricao: 'Ler Lição 9', obrigatoria: true }], concluida: false },
    { id: 'cg1-l10', numero: 10, titulo: 'Impacto dos Fatos Administrativos e Balancete de Verificação (Parte 2)', semanaEstudo: 11, atividades: [{ tipo: 'leitura_caderno', descricao: 'Ler Lição 10', obrigatoria: true }], concluida: false },
    { id: 'cg1-l11', numero: 11, titulo: 'Balancete de Verificação', semanaEstudo: 12, atividades: [{ tipo: 'leitura_caderno', descricao: 'Ler Lição 11', obrigatoria: true }], concluida: false },
    { id: 'cg1-l12', numero: 12, titulo: 'Apuração do Resultado do Exercício (ARE)', semanaEstudo: 12, atividades: [{ tipo: 'leitura_caderno', descricao: 'Ler Lição 12', obrigatoria: true }], concluida: false },
    { id: 'cg1-l13', numero: 13, titulo: 'Revisão Geral e Novas Perspectivas sobre a Escrituração', semanaEstudo: 13, atividades: [{ tipo: 'leitura_caderno', descricao: 'Ler Lição 13', obrigatoria: true }], concluida: false },
    { id: 'cg1-l14', numero: 14, titulo: 'Tópicos Especiais', semanaEstudo: 13, atividades: [{ tipo: 'leitura_caderno', descricao: 'Ler Lição 14', obrigatoria: true }], concluida: false },
  ],
  avaliacoes: [
    { id: 'cg1-ad1', tipo: 'AD1', dataInicio: '2026-08-17', dataFim: '2026-08-23', conteudoCobrado: 'Lições 1 a 4 + Questões Suplementares', peso: 2, observacoes: 'Teórica. Grupo 2. Feita na plataforma.', entregue: false },
    { id: 'cg1-ad2', tipo: 'AD2', dataInicio: '2026-10-05', dataFim: '2026-10-11', conteudoCobrado: 'Lições 6 e 7 + Questões Suplementares', peso: 2, observacoes: 'Teórica. Grupo 2. Feita na plataforma.', entregue: false },
    { id: 'cg1-ap1', tipo: 'AP1', dataPresencial: '2026-09-13', horario: '09:30 às 12:00', conteudoCobrado: 'Lições 1 a 5 (Prática: elaboração, disposição, saldos e classificação de Ativo, Passivo e PL)', peso: 8, observacoes: 'Grupo 2. Prova PRÁTICA no polo. Domingo.', entregue: false },
    { id: 'cg1-ap2', tipo: 'AP2', dataPresencial: '2026-11-01', horario: '09:30 às 12:00', conteudoCobrado: 'Lições 7 a 14 (Prática)', peso: 8, observacoes: 'Grupo 2. Prova PRÁTICA no polo. Domingo.', entregue: false },
    { id: 'cg1-ap3', tipo: 'AP3', dataPresencial: '2026-11-22', horario: '11:00 às 13:00', conteudoCobrado: 'Todo o programa: Balancete, BP, ARE, DRE (conforme IBRACON)', peso: 10, observacoes: 'Grupo 1 e 2. Prova PRÁTICA no polo. Domingo.', entregue: false },
  ],
  formulaNota: {
    n1: 'N1 = AD1 (20%) + AP1 (80%)',
    n2: 'N2 = AD2 (20%) + AP2 (80%)',
    aprovacao: 'Média aritmética (N1 + N2) / 2 ≥ 6,0',
    ap3: 'Se média < 6,0: média(AP3, maior N) ≥ 5,0',
  },
  guia: {
    objetivoGeral: 'Compreender os princípios e técnicas da Contabilidade para elaboração de demonstrações contábeis.',
    metodoEstudo: 'Ler caderno de estudos, elaborar atividades e questões suplementares. Praticar disposição de contas, apuração de resultados e saldos respeitando normas contábeis.',
    observacoes: [
      'ADs são TEÓRICAS (fixação de aprendizagem). APs são PRÁTICAS.',
      'AP1: elaboração de BP com Ativo, Passivo e PL.',
      'AP2: Balancete de Verificação e ARE.',
      'AP3: todo o programa com demonstrações contábeis conforme IBRACON.',
      'Revisões de nota em até 72h após lançamento na plataforma.',
    ],
  },
};

// ============================================================
// DISCIPLINAS PENDENTES (PLACEHOLDERS)
// ============================================================
export const fundamentosFinancas: Disciplina = {
  id: 'fundamentos-financas',
  nome: 'Fundamentos de Finanças',
  codigo: 'FFN',
  icone: '💰',
  cor: '#D97706', // amber-600
  coordenador: 'Aguardando dados',
  totalAulas: 0,
  progresso: 0,
  aulas: [],
  avaliacoes: [],
  formulaNota: { n1: 'Aguardando', n2: 'Aguardando', aprovacao: 'Aguardando', ap3: 'Aguardando' },
  guia: { objetivoGeral: 'Aguardando dados do AVA', metodoEstudo: 'Aguardando', observacoes: ['Enviar cronograma, guia e caderno didático'] },
};

export const teoriaGeralAdm: Disciplina = {
  id: 'teoria-geral-adm-i',
  nome: 'Teoria Geral da Administração I',
  codigo: 'TGA1',
  icone: '🏢',
  cor: '#4F46E5', // indigo-600
  coordenador: 'Aguardando dados',
  totalAulas: 0,
  progresso: 0,
  aulas: [],
  avaliacoes: [],
  formulaNota: { n1: 'Aguardando', n2: 'Aguardando', aprovacao: 'Aguardando', ap3: 'Aguardando' },
  guia: { objetivoGeral: 'Aguardando dados do AVA', metodoEstudo: 'Aguardando', observacoes: ['Enviar cronograma, guia e caderno didático'] },
};

export const matematicaFinanceira: Disciplina = {
  id: 'matematica-financeira',
  nome: 'Matemática Financeira',
  codigo: 'MATFIN',
  icone: '🧮',
  cor: '#DC2626', // red-600
  coordenador: 'Aguardando dados',
  totalAulas: 0,
  progresso: 0,
  aulas: [],
  avaliacoes: [],
  formulaNota: { n1: 'Aguardando', n2: 'Aguardando', aprovacao: 'Aguardando', ap3: 'Aguardando' },
  guia: { objetivoGeral: 'Aguardando dados do AVA', metodoEstudo: 'Aguardando', observacoes: ['Enviar cronograma, guia e caderno didático'] },
};

export const metodologiaTC: Disciplina = {
  id: 'metodologia-trabalho-cientifico',
  nome: 'Metodologia do Trabalho Científico',
  codigo: 'MTC',
  icone: '📝',
  cor: '#0891B2', // cyan-600
  coordenador: 'Aguardando dados',
  totalAulas: 0,
  progresso: 0,
  aulas: [],
  avaliacoes: [],
  formulaNota: { n1: 'Aguardando', n2: 'Aguardando', aprovacao: 'Aguardando', ap3: 'Aguardando' },
  guia: { objetivoGeral: 'Aguardando dados do AVA', metodoEstudo: 'Aguardando', observacoes: ['Enviar cronograma, guia e caderno didático'] },
};

// Array completo de disciplinas
export const disciplinas: Disciplina[] = [
  metodosDeterministicos,
  historiaPensamentoAdm,
  contabilidadeGeral,
  fundamentosFinancas,
  teoriaGeralAdm,
  matematicaFinanceira,
  metodologiaTC,
];

export const disciplinasCompletas = disciplinas.filter(d => d.aulas.length > 0);
export const disciplinasPendentes = disciplinas.filter(d => d.aulas.length === 0);
