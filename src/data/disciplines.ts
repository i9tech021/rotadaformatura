export interface Discipline {
  id: string;
  name: string;
  ch: string;
  period: string;
  icon: string;
  progress: number;
  nextExam?: {
    type: string;
    date: string;
    daysRemaining: number;
  };
  status: 'urgent' | 'warning' | 'normal';
  formula?: string;
  guide?: string;
  lessons: Lesson[];
  podcasts: Podcast[];
  summaries: Summary[];
  oldExams: OldExam[];
}

export interface Lesson {
  id: string;
  title: string;
  items: ChecklistItem[];
}

export interface ChecklistItem {
  id: string;
  label: string;
  type: 'reading' | 'exercise' | 'podcast' | 'video' | 'material';
  completed: boolean;
}

export interface Podcast {
  id: string;
  title: string;
  duration: string;
  url: string;
}

export interface Summary {
  id: string;
  title: string;
  type: 'pdf' | 'doc' | 'link';
  url: string;
}

export interface OldExam {
  id: string;
  year: string;
  type: 'AP1' | 'AP2' | 'AP3' | 'AD1' | 'AD2';
  url: string;
}

export const DISCIPLINES: Discipline[] = [
  {
    id: "metodos-1",
    name: "Métodos Determinísticos I",
    ch: "45h",
    period: "2º período",
    icon: "📐",
    progress: 45,
    nextExam: { type: "AP1", date: "2026-09-05T09:30:00", daysRemaining: 5 },
    status: "urgent",
    formula: "N=(2*AD+8*AP)/10",
    guide: "Esta disciplina aborda os fundamentos da lógica matemática, conjuntos e operações fundamentais.",
    lessons: [
      {
        id: "aula-1",
        title: "Aula 01",
        items: [
          { id: "a1-r1", label: "Leitura: Conjuntos Numéricos", type: "reading", completed: true },
          { id: "a1-p1", label: "Podcast: Introdução à Lógica", type: "podcast", completed: true },
          { id: "a1-e1", label: "EP1: Exercícios de Fixação", type: "exercise", completed: false },
        ]
      },
      {
        id: "aula-2",
        title: "Aula 02",
        items: [
          { id: "a2-r1", label: "Leitura: Naturais e Inteiros", type: "reading", completed: false },
          { id: "a2-e1", label: "EP2: Operações Básicas", type: "exercise", completed: false },
        ]
      },
    ],
    podcasts: [
      { id: "p1", title: "Lógica para Iniciantes", duration: "15:00", url: "#" },
      { id: "p2", title: "Conjuntos e Diagramas", duration: "12:30", url: "#" },
    ],
    summaries: [
      { id: "s1", title: "Resumo: Aulas 1 a 4", type: "pdf", url: "#" },
    ],
    oldExams: [
      { id: "e1", year: "2024.1", type: "AP1", url: "#" },
      { id: "e2", year: "2023.2", type: "AP1", url: "#" },
    ]
  },
  {
    id: "hpa-2",
    name: "História do Pensamento Adm. II",
    ch: "60h",
    period: "2º período",
    icon: "🏛️",
    progress: 25,
    nextExam: { type: "AP1", date: "2026-09-06T13:30:00", daysRemaining: 6 },
    status: "urgent",
    lessons: [],
    podcasts: [],
    summaries: [],
    oldExams: []
  },
  {
    id: "contab-1",
    name: "Contabilidade Geral I",
    ch: "45h",
    period: "3º período",
    icon: "📊",
    progress: 15,
    nextExam: { type: "AP1", date: "2026-09-13T09:30:00", daysRemaining: 13 },
    status: "warning",
    lessons: [],
    podcasts: [],
    summaries: [],
    oldExams: []
  }
];
