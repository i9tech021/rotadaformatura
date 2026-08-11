// src/data/events.ts
// Eventos acadêmicos do semestre 2026-2 - CEDERJ Administração

export interface EventoAcademico {
  id: string;
  titulo: string;
  disciplinaId: string;
  disciplinaNome: string;
  disciplinaCodigo: string;
  disciplinaCor: string;
  tipo: 'AD1' | 'AD2' | 'AP1' | 'AP2' | 'AP3' | 'AULA_INAUGURAL' | 'JORNADA' | 'MANUTENCAO' | 'ENADE' | 'REVISAO';
  dataInicio: string; // ISO date
  dataFim?: string; // ISO date
  horario?: string;
  local?: string;
  conteudo: string;
  peso?: number;
  observacoes?: string;
  alertaDias: number; // dias antes para alerta
}

export const eventos: EventoAcademico[] = [
  // ============================================================
  // AGOSTO 2026
  // ============================================================
  {
    id: 'evt-aula-inaugural-online',
    titulo: 'Aula Inaugural Online',
    disciplinaId: 'geral',
    disciplinaNome: 'Geral',
    disciplinaCodigo: 'GER',
    disciplinaCor: '#64748B',
    tipo: 'AULA_INAUGURAL',
    dataInicio: '2026-07-25',
    conteudo: 'Início do Semestre Letivo 2026-2',
    alertaDias: 1,
  },
  {
    id: 'evt-aula-inaugural-presencial',
    titulo: 'Aula Inaugural Presencial nos Polos',
    disciplinaId: 'geral',
    disciplinaNome: 'Geral',
    disciplinaCodigo: 'GER',
    disciplinaCor: '#64748B',
    tipo: 'AULA_INAUGURAL',
    dataInicio: '2026-08-01',
    conteudo: 'Apresentação do curso, pólo, tutores, coordenadores',
    alertaDias: 3,
  },
  {
    id: 'evt-mdi-aula-inaugural',
    titulo: 'Aula Inaugural - Métodos Determinísticos I',
    disciplinaId: 'metodos-deterministicos-i',
    disciplinaNome: 'Métodos Determinísticos I',
    disciplinaCodigo: 'MDI',
    disciplinaCor: '#2563EB',
    tipo: 'AULA_INAUGURAL',
    dataInicio: '2026-08-04',
    horario: '20:00 às 22:00',
    local: 'Online (link na plataforma)',
    conteudo: 'Apresentação da disciplina e orientações',
    observacoes: 'Link divulgado por aviso na plataforma',
    alertaDias: 2,
  },
  {
    id: 'evt-mdi-ad1-q1',
    titulo: 'AD1 - Questão 1 (Métodos Det. I)',
    disciplinaId: 'metodos-deterministicos-i',
    disciplinaNome: 'Métodos Determinísticos I',
    disciplinaCodigo: 'MDI',
    disciplinaCor: '#2563EB',
    tipo: 'AD1',
    dataInicio: '2026-08-10',
    dataFim: '2026-08-19',
    conteudo: 'Questão 1 - Métodos Determinísticos I',
    peso: 0.5,
    observacoes: 'Prazo estendido por ingresso tardio de calouros. Resolver à mão, escanear em PDF.',
    alertaDias: 7,
  },
  {
    id: 'evt-mdi-ad1-q2',
    titulo: 'AD1 - Questão 2 (Métodos Det. I)',
    disciplinaId: 'metodos-deterministicos-i',
    disciplinaNome: 'Métodos Determinísticos I',
    disciplinaCodigo: 'MDI',
    disciplinaCor: '#2563EB',
    tipo: 'AD1',
    dataInicio: '2026-08-10',
    dataFim: '2026-08-19',
    conteudo: 'Questão 2 - Métodos Determinísticos I',
    peso: 0.5,
    observacoes: 'Resolver à mão, escanear em PDF.',
    alertaDias: 7,
  },
  {
    id: 'evt-hpa-ad1',
    titulo: 'AD1 - História do Pensamento Adm. II',
    disciplinaId: 'historia-pensamento-administrativo-ii',
    disciplinaNome: 'História do Pensamento Administrativo II',
    disciplinaCodigo: 'HPA2',
    disciplinaCor: '#7C3AED',
    tipo: 'AD1',
    dataInicio: '2026-08-10',
    dataFim: '2026-08-16',
    conteudo: 'Aulas 11 a 16',
    peso: 2,
    observacoes: 'Nota de 0 a 2,0. Feita na plataforma. Não aceita envio fora do prazo.',
    alertaDias: 7,
  },
  {
    id: 'evt-mdi-ad1-q3',
    titulo: 'AD1 - Questão 3 (Métodos Det. I)',
    disciplinaId: 'metodos-deterministicos-i',
    disciplinaNome: 'Métodos Determinísticos I',
    disciplinaCodigo: 'MDI',
    disciplinaCor: '#2563EB',
    tipo: 'AD1',
    dataInicio: '2026-08-17',
    dataFim: '2026-08-26',
    conteudo: 'Questão 3 - Métodos Determinísticos I',
    peso: 0.5,
    observacoes: 'Resolver à mão, escanear em PDF.',
    alertaDias: 7,
  },
  {
    id: 'evt-cg1-ad1',
    titulo: 'AD1 - Contabilidade Geral I',
    disciplinaId: 'contabilidade-geral-i',
    disciplinaNome: 'Contabilidade Geral I',
    disciplinaCodigo: 'CG1',
    disciplinaCor: '#059669',
    tipo: 'AD1',
    dataInicio: '2026-08-17',
    dataFim: '2026-08-23',
    conteudo: 'Lições 1 a 4 + Questões Suplementares',
    peso: 2,
    observacoes: 'Teórica. Grupo 2. Feita na plataforma.',
    alertaDias: 7,
  },
  {
    id: 'evt-mdi-ad1-q4',
    titulo: 'AD1 - Questão 4 (Métodos Det. I)',
    disciplinaId: 'metodos-deterministicos-i',
    disciplinaNome: 'Métodos Determinísticos I',
    disciplinaCodigo: 'MDI',
    disciplinaCor: '#2563EB',
    tipo: 'AD1',
    dataInicio: '2026-08-24',
    dataFim: '2026-09-02',
    conteudo: 'Questão 4 - Métodos Determinísticos I',
    peso: 0.5,
    observacoes: 'Resolver à mão, escanear em PDF.',
    alertaDias: 7,
  },

  // ============================================================
  // SETEMBRO 2026
  // ============================================================
  {
    id: 'evt-mdi-ap1',
    titulo: 'AP1 - Métodos Determinísticos I',
    disciplinaId: 'metodos-deterministicos-i',
    disciplinaNome: 'Métodos Determinísticos I',
    disciplinaCodigo: 'MDI',
    disciplinaCor: '#2563EB',
    tipo: 'AP1',
    dataInicio: '2026-09-05',
    horario: '09:30',
    local: 'Polo CEDERJ',
    conteudo: 'Aulas 1 a 8 + pp.144-145 (Equação 1º Grau)',
    peso: 8,
    observacoes: 'Prova presencial. Resoluções à caneta. Não haverá folhas extras.',
    alertaDias: 14,
  },
  {
    id: 'evt-hpa-ap1',
    titulo: 'AP1 - História do Pensamento Adm. II',
    disciplinaId: 'historia-pensamento-administrativo-ii',
    disciplinaNome: 'História do Pensamento Administrativo II',
    disciplinaCodigo: 'HPA2',
    disciplinaCor: '#7C3AED',
    tipo: 'AP1',
    dataInicio: '2026-09-06',
    horario: '13:30 às 16:00',
    local: 'Polo CEDERJ',
    conteudo: 'Aulas 11 a 20',
    peso: 8,
    observacoes: 'Grupo 1. Prova presencial.',
    alertaDias: 14,
  },
  {
    id: 'evt-mdi-ad2-q1',
    titulo: 'AD2 - Questão 1 (Métodos Det. I)',
    disciplinaId: 'metodos-deterministicos-i',
    disciplinaNome: 'Métodos Determinísticos I',
    disciplinaCodigo: 'MDI',
    disciplinaCor: '#2563EB',
    tipo: 'AD2',
    dataInicio: '2026-09-07',
    dataFim: '2026-09-16',
    conteudo: 'Questão 1 - Métodos Determinísticos I',
    peso: 0.67,
    observacoes: 'Resolver à mão, escanear em PDF.',
    alertaDias: 7,
  },
  {
    id: 'evt-cg1-ap1',
    titulo: 'AP1 - Contabilidade Geral I',
    disciplinaId: 'contabilidade-geral-i',
    disciplinaNome: 'Contabilidade Geral I',
    disciplinaCodigo: 'CG1',
    disciplinaCor: '#059669',
    tipo: 'AP1',
    dataInicio: '2026-09-13',
    horario: '09:30 às 12:00',
    local: 'Polo CEDERJ',
    conteudo: 'Lições 1 a 5 (Prática: elaboração, disposição, saldos e classificação de Ativo, Passivo e PL)',
    peso: 8,
    observacoes: 'Grupo 2. Prova PRÁTICA. Domingo.',
    alertaDias: 14,
  },
  {
    id: 'evt-mdi-ad2-q2',
    titulo: 'AD2 - Questão 2 (Métodos Det. I)',
    disciplinaId: 'metodos-deterministicos-i',
    disciplinaNome: 'Métodos Determinísticos I',
    disciplinaCodigo: 'MDI',
    disciplinaCor: '#2563EB',
    tipo: 'AD2',
    dataInicio: '2026-09-14',
    dataFim: '2026-09-23',
    conteudo: 'Questão 2 - Métodos Determinísticos I',
    peso: 0.67,
    observacoes: 'Resolver à mão, escanear em PDF.',
    alertaDias: 7,
  },
  {
    id: 'evt-manutencao-14-09',
    titulo: 'Manutenção Programada da Plataforma',
    disciplinaId: 'geral',
    disciplinaNome: 'Geral',
    disciplinaCodigo: 'GER',
    disciplinaCor: '#64748B',
    tipo: 'MANUTENCAO',
    dataInicio: '2026-09-14',
    conteudo: 'Plataforma CEDERJ fora do ar das 0h01 às 23h59',
    alertaDias: 1,
  },
  {
    id: 'evt-mdi-ad2-q3',
    titulo: 'AD2 - Questão 3 (Métodos Det. I)',
    disciplinaId: 'metodos-deterministicos-i',
    disciplinaNome: 'Métodos Determinísticos I',
    disciplinaCodigo: 'MDI',
    disciplinaCor: '#2563EB',
    tipo: 'AD2',
    dataInicio: '2026-09-21',
    dataFim: '2026-09-30',
    conteudo: 'Questão 3 - Métodos Determinísticos I',
    peso: 0.66,
    observacoes: 'Resolver à mão, escanear em PDF.',
    alertaDias: 7,
  },
  {
    id: 'evt-jornada-26-09',
    titulo: 'Jornada Acadêmica',
    disciplinaId: 'geral',
    disciplinaNome: 'Geral',
    disciplinaCodigo: 'GER',
    disciplinaCor: '#64748B',
    tipo: 'JORNADA',
    dataInicio: '2026-09-26',
    conteudo: 'Jornada Acadêmica CEDERJ',
    alertaDias: 3,
  },

  // ============================================================
  // OUTUBRO 2026
  // ============================================================
  {
    id: 'evt-mdi-ad2-q3-ext',
    titulo: 'AD2 - Questão 3 Estendida (Métodos Det. I)',
    disciplinaId: 'metodos-deterministicos-i',
    disciplinaNome: 'Métodos Determinísticos I',
    disciplinaCodigo: 'MDI',
    disciplinaCor: '#2563EB',
    tipo: 'AD2',
    dataInicio: '2026-09-28',
    dataFim: '2026-10-07',
    conteudo: 'Questão 3 - prazo estendido',
    peso: 0.66,
    observacoes: 'Prazo final para AD2 Q3.',
    alertaDias: 7,
  },
  {
    id: 'evt-hpa-ad2',
    titulo: 'AD2 - História do Pensamento Adm. II',
    disciplinaId: 'historia-pensamento-administrativo-ii',
    disciplinaNome: 'História do Pensamento Administrativo II',
    disciplinaCodigo: 'HPA2',
    disciplinaCor: '#7C3AED',
    tipo: 'AD2',
    dataInicio: '2026-09-28',
    dataFim: '2026-10-04',
    conteudo: 'Aulas 21 a 26',
    peso: 2,
    observacoes: 'Nota de 0 a 2,0. Feita na plataforma.',
    alertaDias: 7,
  },
  {
    id: 'evt-cg1-ad2',
    titulo: 'AD2 - Contabilidade Geral I',
    disciplinaId: 'contabilidade-geral-i',
    disciplinaNome: 'Contabilidade Geral I',
    disciplinaCodigo: 'CG1',
    disciplinaCor: '#059669',
    tipo: 'AD2',
    dataInicio: '2026-10-05',
    dataFim: '2026-10-11',
    conteudo: 'Lições 6 e 7 + Questões Suplementares',
    peso: 2,
    observacoes: 'Teórica. Grupo 2. Feita na plataforma.',
    alertaDias: 7,
  },
  {
    id: 'evt-mdi-ap2',
    titulo: 'AP2 - Métodos Determinísticos I',
    disciplinaId: 'metodos-deterministicos-i',
    disciplinaNome: 'Métodos Determinísticos I',
    disciplinaCodigo: 'MDI',
    disciplinaCor: '#2563EB',
    tipo: 'AP2',
    dataInicio: '2026-10-17',
    horario: '09:30',
    local: 'Polo CEDERJ',
    conteudo: 'Aulas 9 a 16 (exceto Aula 15)',
    peso: 8,
    observacoes: 'Prova presencial. Conteúdos da AP1 podem ser necessários como ferramentas.',
    alertaDias: 14,
  },
  {
    id: 'evt-hpa-ap2',
    titulo: 'AP2 - História do Pensamento Adm. II',
    disciplinaId: 'historia-pensamento-administrativo-ii',
    disciplinaNome: 'História do Pensamento Administrativo II',
    disciplinaCodigo: 'HPA2',
    disciplinaCor: '#7C3AED',
    tipo: 'AP2',
    dataInicio: '2026-10-18',
    horario: '13:30 às 16:00',
    local: 'Polo CEDERJ',
    conteudo: 'Aulas 21 a 30',
    peso: 8,
    observacoes: 'Grupo 1. Prova presencial.',
    alertaDias: 14,
  },
  {
    id: 'evt-manutencao-03-11',
    titulo: 'Manutenção Programada da Plataforma',
    disciplinaId: 'geral',
    disciplinaNome: 'Geral',
    disciplinaCodigo: 'GER',
    disciplinaCor: '#64748B',
    tipo: 'MANUTENCAO',
    dataInicio: '2026-11-03',
    conteudo: 'Plataforma CEDERJ fora do ar das 0h01 às 23h59',
    alertaDias: 1,
  },

  // ============================================================
  // NOVEMBRO 2026
  // ============================================================
  {
    id: 'evt-cg1-ap2',
    titulo: 'AP2 - Contabilidade Geral I',
    disciplinaId: 'contabilidade-geral-i',
    disciplinaNome: 'Contabilidade Geral I',
    disciplinaCodigo: 'CG1',
    disciplinaCor: '#059669',
    tipo: 'AP2',
    dataInicio: '2026-11-01',
    horario: '09:30 às 12:00',
    local: 'Polo CEDERJ',
    conteudo: 'Lições 7 a 14 (Prática)',
    peso: 8,
    observacoes: 'Grupo 2. Prova PRÁTICA. Domingo.',
    alertaDias: 14,
  },
  {
    id: 'evt-mdi-ap3',
    titulo: 'AP3 - Métodos Determinísticos I',
    disciplinaId: 'metodos-deterministicos-i',
    disciplinaNome: 'Métodos Determinísticos I',
    disciplinaCodigo: 'MDI',
    disciplinaCor: '#2563EB',
    tipo: 'AP3',
    dataInicio: '2026-11-21',
    horario: '08:30',
    local: 'Polo CEDERJ',
    conteudo: 'Todo o conteúdo do semestre',
    peso: 10,
    observacoes: 'Recuperação. Média com maior N deve ser ≥ 5,0.',
    alertaDias: 14,
  },
  {
    id: 'evt-hpa-ap3',
    titulo: 'AP3 - História do Pensamento Adm. II',
    disciplinaId: 'historia-pensamento-administrativo-ii',
    disciplinaNome: 'História do Pensamento Administrativo II',
    disciplinaCodigo: 'HPA2',
    disciplinaCor: '#7C3AED',
    tipo: 'AP3',
    dataInicio: '2026-11-22',
    horario: '14:00 às 16:00',
    local: 'Polo CEDERJ',
    conteudo: 'Aulas 11 a 30 (conteúdo completo)',
    peso: 10,
    observacoes: 'Grupo 1 e 2. Recuperação.',
    alertaDias: 14,
  },
  {
    id: 'evt-cg1-ap3',
    titulo: 'AP3 - Contabilidade Geral I',
    disciplinaId: 'contabilidade-geral-i',
    disciplinaNome: 'Contabilidade Geral I',
    disciplinaCodigo: 'CG1',
    disciplinaCor: '#059669',
    tipo: 'AP3',
    dataInicio: '2026-11-22',
    horario: '11:00 às 13:00',
    local: 'Polo CEDERJ',
    conteudo: 'Todo o programa: Balancete, BP, ARE, DRE (conforme IBRACON)',
    peso: 10,
    observacoes: 'Grupo 1 e 2. Prova PRÁTICA. Domingo.',
    alertaDias: 14,
  },
  {
    id: 'evt-enade',
    titulo: 'ENADE 2026',
    disciplinaId: 'geral',
    disciplinaNome: 'Geral',
    disciplinaCodigo: 'GER',
    disciplinaCor: '#64748B',
    tipo: 'ENADE',
    dataInicio: '2026-11-29',
    conteudo: 'Exame Nacional de Desempenho de Estudantes',
    alertaDias: 30,
  },

  // ============================================================
  // DEZEMBRO 2026
  // ============================================================
  {
    id: 'evt-fim-prazo-reabertura',
    titulo: 'Fim do Prazo - Reabertura de Matrícula',
    disciplinaId: 'geral',
    disciplinaNome: 'Geral',
    disciplinaCodigo: 'GER',
    disciplinaCor: '#64748B',
    tipo: 'REVISAO',
    dataInicio: '2026-11-30',
    conteudo: 'Fim do período para solicitação de reabertura de matrícula cancelada para 2027.1',
    alertaDias: 7,
  },
  {
    id: 'evt-cg1-notas-ap3',
    titulo: 'Prazo Final - Lançamento Notas AP3',
    disciplinaId: 'contabilidade-geral-i',
    disciplinaNome: 'Contabilidade Geral I',
    disciplinaCodigo: 'CG1',
    disciplinaCor: '#059669',
    tipo: 'REVISAO',
    dataInicio: '2026-12-07',
    conteudo: 'Prazo final para lançamento de notas AP3',
    alertaDias: 3,
  },
];

// Helpers para filtrar eventos
export const getEventosPorDisciplina = (disciplinaId: string) => 
  eventos.filter(e => e.disciplinaId === disciplinaId);

export const getEventosPorTipo = (tipo: EventoAcademico['tipo']) => 
  eventos.filter(e => e.tipo === tipo);

export const getEventosPorMes = (ano: number, mes: number) => 
  eventos.filter(e => {
    const d = new Date(e.dataInicio);
    return d.getFullYear() === ano && d.getMonth() === mes - 1;
  });

export const getProximosEventos = (dias = 30) => {
  const hoje = new Date();
  const limite = new Date();
  limite.setDate(hoje.getDate() + dias);
  return eventos.filter(e => {
    const d = new Date(e.dataInicio);
    return d >= hoje && d <= limite;
  }).sort((a, b) => new Date(a.dataInicio).getTime() - new Date(b.dataInicio).getTime());
};

export const getEventosUrgentes = () => {
  const hoje = new Date();
  return eventos.filter(e => {
    const d = new Date(e.dataInicio);
    const diff = Math.ceil((d.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    return diff >= 0 && diff <= e.alertaDias;
  }).sort((a, b) => new Date(a.dataInicio).getTime() - new Date(b.dataInicio).getTime());
};
