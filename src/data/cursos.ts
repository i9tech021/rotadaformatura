// src/data/cursos.ts
// Catálogo de cursos do CEDERJ + polos + mapeamento disciplina↔curso.
// Administração é o único curso ativo; os outros ficam "coming soon".

export interface Polo {
  id: string;
  nome: string;
  universidade: string;
  uf: string;
}

export interface Curso {
  id: string;
  nome: string;
  codigo: string;
  universidade: string;
  polos: string[]; // IDs dos polos onde o curso é oferecido
  disciplinasApp: string[]; // IDs das disciplinas mapeadas no app (cresce com o tempo)
  totalDisciplinas: number; // total real da grade (pode ser maior que disciplinasApp)
  totalPeriodos: number;
  totalCH: string; // ex: "3.165h"
  ativo: boolean; // false = coming soon
  cor: string;
  icone: string;
}

// ============================================================
// 43 POLOS CEDERJ (fonte: cecierj.edu.br — lista oficial)
// ============================================================
export const polos: Polo[] = [
  // ── Polos com Administração/UFRRJ confirmada ─────
  { id: "angra-dos-reis", nome: "Angra dos Reis", universidade: "UFRRJ", uf: "RJ" },
  { id: "barra-do-pirai", nome: "Barra do Piraí", universidade: "UFRRJ", uf: "RJ" },
  { id: "cantagalo", nome: "Cantagalo", universidade: "UFRRJ", uf: "RJ" },
  { id: "itaperuna", nome: "Itaperuna", universidade: "UFRRJ", uf: "RJ" },
  { id: "macae", nome: "Macaé", universidade: "UFRRJ", uf: "RJ" },
  { id: "mage", nome: "Magé", universidade: "UFRRJ", uf: "RJ" },
  { id: "petropolis", nome: "Petrópolis", universidade: "UFRRJ", uf: "RJ" },
  { id: "pirai", nome: "Piraí", universidade: "UFRRJ", uf: "RJ" },
  { id: "resende", nome: "Resende", universidade: "UFRRJ", uf: "RJ" },
  { id: "rio-das-flores", nome: "Rio das Flores", universidade: "UFRRJ", uf: "RJ" },
  { id: "rocinha", nome: "Rocinha", universidade: "UFRRJ", uf: "RJ" },
  { id: "sao-fidelis", nome: "São Fidélis", universidade: "UFRRJ", uf: "RJ" },
  { id: "sao-goncalo", nome: "São Gonçalo", universidade: "UFRRJ", uf: "RJ" },
  { id: "saquarema", nome: "Saquarema", universidade: "UFRRJ", uf: "RJ" },

  // ── Outros polos oficiais CEDERJ ─────────────────
  { id: "belford-roxo", nome: "Belford Roxo", universidade: "", uf: "RJ" },
  { id: "bom-jardim", nome: "Bom Jardim", universidade: "", uf: "RJ" },
  { id: "bom-jesus-itabapoana", nome: "Bom Jesus do Itabapoana", universidade: "", uf: "RJ" },
  { id: "buzios", nome: "Búzios", universidade: "", uf: "RJ" },
  { id: "cabo-frio", nome: "Cabo Frio", universidade: "", uf: "RJ" },
  { id: "cardoso-moreira", nome: "Cardoso Moreira", universidade: "", uf: "RJ" },
  { id: "duque-de-caxias", nome: "Duque de Caxias", universidade: "", uf: "RJ" },
  { id: "itagual", nome: "Itaguaí", universidade: "", uf: "RJ" },
  { id: "itaocara", nome: "Itaocara", universidade: "", uf: "RJ" },
  { id: "mangaratiba", nome: "Mangaratiba", universidade: "", uf: "RJ" },
  { id: "mesquita", nome: "Mesquita", universidade: "", uf: "RJ" },
  { id: "miguel-pereira", nome: "Miguel Pereira", universidade: "", uf: "RJ" },
  { id: "miracema", nome: "Miracema", universidade: "", uf: "RJ" },
  { id: "natividade", nome: "Natividade", universidade: "", uf: "RJ" },
  { id: "niteroi", nome: "Niterói", universidade: "", uf: "RJ" },
  { id: "nova-friburgo", nome: "Nova Friburgo", universidade: "", uf: "RJ" },
  { id: "nova-iguacu", nome: "Nova Iguaçu", universidade: "", uf: "RJ" },
  { id: "paracambi", nome: "Paracambi", universidade: "", uf: "RJ" },
  { id: "pinheiral", nome: "Pinheiral", universidade: "", uf: "RJ" },
  { id: "quatis", nome: "Quatis", universidade: "", uf: "RJ" },
  { id: "rio-bonito", nome: "Rio Bonito", universidade: "", uf: "RJ" },
  { id: "rio-das-ostras", nome: "Rio das Ostras", universidade: "", uf: "RJ" },
  { id: "rio-de-janeiro", nome: "Rio de Janeiro", universidade: "", uf: "RJ" },
  { id: "santa-maria-madalena", nome: "Santa Maria Madalena", universidade: "", uf: "RJ" },
  { id: "sao-francisco-itabapoana", nome: "São Francisco de Itabapoana", universidade: "", uf: "RJ" },
  { id: "sao-pedro-da-aldeia", nome: "São Pedro da Aldeia", universidade: "", uf: "RJ" },
  { id: "teresopolis", nome: "Teresópolis", universidade: "", uf: "RJ" },
  { id: "tres-rios", nome: "Três Rios", universidade: "", uf: "RJ" },
  { id: "volta-redonda", nome: "Volta Redonda", universidade: "", uf: "RJ" },
];

// ============================================================
// 19 CURSOS CEDERJ — lista oficial (cecierj.edu.br + edital 2026.2)
// Fonte: https://cecierj.edu.br/consorcio-cederj/cursos
// ============================================================
export const cursos: Curso[] = [
  // ── UFRRJ (3 cursos) ─────────────────────────────
  {
    id: "administracao",
    nome: "Administração",
    codigo: "ADM",
    universidade: "UFRRJ",
    polos: [
      "angra-dos-reis", "barra-do-pirai", "cantagalo", "itaperuna",
      "macae", "mage", "petropolis", "pirai", "resende",
      "rio-das-flores", "rocinha", "sao-fidelis", "sao-goncalo", "saquarema",
    ],
    disciplinasApp: [
      "metodos-deterministicos-i",
      "historia-pensamento-administrativo-ii",
      "contabilidade-geral-i",
      "fundamentos-financas",
      "economia-brasileira-contemporanea",
      "gestao-pessoas-i",
      "sociedade-e-organizacoes",
    ],
    totalDisciplinas: 35,
    totalPeriodos: 10,
    totalCH: "3.165h",
    ativo: true,
    cor: "#0A3D52",
    icone: "📊",
  },
  {
    id: "formacao-pedagogica-adm",
    nome: "Formação Pedagógica em Administração",
    codigo: "FPA",
    universidade: "UFRRJ",
    polos: [],
    disciplinasApp: [],
    totalDisciplinas: 20,
    totalPeriodos: 5,
    totalCH: "1.800h",
    ativo: false,
    cor: "#0A3D52",
    icone: "📊",
  },
  {
    id: "engenharia-producao",
    nome: "Engenharia de Produção",
    codigo: "ENP",
    universidade: "UFRRJ",
    polos: [],
    disciplinasApp: [],
    totalDisciplinas: 40,
    totalPeriodos: 10,
    totalCH: "3.600h",
    ativo: false,
    cor: "#2563EB",
    icone: "⚙️",
  },

  // ── UFF (7 cursos) ──────────────────────────────
  {
    id: "administracao-publica",
    nome: "Administração Pública",
    codigo: "ADP",
    universidade: "UFF",
    polos: [],
    disciplinasApp: [],
    totalDisciplinas: 36,
    totalPeriodos: 10,
    totalCH: "3.200h",
    ativo: false,
    cor: "#DC2626",
    icone: "🏛️",
  },
  {
    id: "biblioteconomia",
    nome: "Biblioteconomia",
    codigo: "BIB",
    universidade: "UFF",
    polos: [],
    disciplinasApp: [],
    totalDisciplinas: 34,
    totalPeriodos: 10,
    totalCH: "3.000h",
    ativo: false,
    cor: "#9333EA",
    icone: "📚",
  },
  {
    id: "engenharia-producao-uff",
    nome: "Engenharia de Produção",
    codigo: "ENP-UFF",
    universidade: "UFF",
    polos: [],
    disciplinasApp: [],
    totalDisciplinas: 40,
    totalPeriodos: 10,
    totalCH: "3.600h",
    ativo: false,
    cor: "#2563EB",
    icone: "⚙️",
  },
  {
    id: "lic-letras",
    nome: "Licenciatura em Letras",
    codigo: "LET",
    universidade: "UFF",
    polos: [],
    disciplinasApp: [],
    totalDisciplinas: 34,
    totalPeriodos: 10,
    totalCH: "3.000h",
    ativo: false,
    cor: "#DB2777",
    icone: "📝",
  },
  {
    id: "lic-matematica",
    nome: "Licenciatura em Matemática",
    codigo: "MAT",
    universidade: "UFF",
    polos: [],
    disciplinasApp: [],
    totalDisciplinas: 36,
    totalPeriodos: 10,
    totalCH: "3.200h",
    ativo: false,
    cor: "#0891B2",
    icone: "🔢",
  },
  {
    id: "tec-computacao",
    nome: "Tecnologia em Sistemas de Computação",
    codigo: "CMP",
    universidade: "UFF",
    polos: [],
    disciplinasApp: [],
    totalDisciplinas: 24,
    totalPeriodos: 6,
    totalCH: "2.200h",
    ativo: false,
    cor: "#0EA5E9",
    icone: "💻",
  },
  {
    id: "tec-seguranca-publica",
    nome: "Tecnologia em Segurança Pública",
    codigo: "SGP",
    universidade: "UFF",
    polos: [],
    disciplinasApp: [],
    totalDisciplinas: 24,
    totalPeriodos: 6,
    totalCH: "2.200h",
    ativo: false,
    cor: "#B91C1C",
    icone: "🛡️",
  },

  // ── UFRJ (4 cursos) ──────────────────────────────
  {
    id: "ciencias-contabeis",
    nome: "Ciências Contábeis",
    codigo: "CCO",
    universidade: "UFRJ",
    polos: [],
    disciplinasApp: [],
    totalDisciplinas: 38,
    totalPeriodos: 10,
    totalCH: "3.200h",
    ativo: false,
    cor: "#059669",
    icone: "🔢",
  },
  {
    id: "lic-biologicas",
    nome: "Licenciatura em Ciências Biológicas",
    codigo: "BIO",
    universidade: "UFRJ",
    polos: [],
    disciplinasApp: [],
    totalDisciplinas: 38,
    totalPeriodos: 10,
    totalCH: "3.400h",
    ativo: false,
    cor: "#16A34A",
    icone: "🧬",
  },
  {
    id: "lic-fisica",
    nome: "Licenciatura em Física",
    codigo: "FIS",
    universidade: "UFRJ",
    polos: [],
    disciplinasApp: [],
    totalDisciplinas: 36,
    totalPeriodos: 10,
    totalCH: "3.200h",
    ativo: false,
    cor: "#2563EB",
    icone: "⚛️",
  },
  {
    id: "lic-quimica",
    nome: "Licenciatura em Química",
    codigo: "QUI",
    universidade: "UFRJ",
    polos: [],
    disciplinasApp: [],
    totalDisciplinas: 36,
    totalPeriodos: 10,
    totalCH: "3.200h",
    ativo: false,
    cor: "#D97706",
    icone: "🧪",
  },

  // ── UERJ (3 cursos) ──────────────────────────────
  {
    id: "lic-geografia",
    nome: "Licenciatura em Geografia",
    codigo: "GEO",
    universidade: "UERJ",
    polos: [],
    disciplinasApp: [],
    totalDisciplinas: 34,
    totalPeriodos: 10,
    totalCH: "3.000h",
    ativo: false,
    cor: "#059669",
    icone: "🌎",
  },
  {
    id: "lic-pedagogia",
    nome: "Licenciatura em Pedagogia",
    codigo: "PED",
    universidade: "UERJ",
    polos: [],
    disciplinasApp: [],
    totalDisciplinas: 36,
    totalPeriodos: 10,
    totalCH: "3.000h",
    ativo: false,
    cor: "#DB2777",
    icone: "📖",
  },
  {
    id: "lic-biologicas-uerj",
    nome: "Licenciatura em Ciências Biológicas",
    codigo: "BIO-UERJ",
    universidade: "UERJ",
    polos: [],
    disciplinasApp: [],
    totalDisciplinas: 38,
    totalPeriodos: 10,
    totalCH: "3.400h",
    ativo: false,
    cor: "#16A34A",
    icone: "🧬",
  },

  // ── UENF (1 curso) ───────────────────────────────
  {
    id: "engenharia-meteorologica",
    nome: "Engenharia Meteorológica",
    codigo: "EMT",
    universidade: "UENF",
    polos: [],
    disciplinasApp: [],
    totalDisciplinas: 42,
    totalPeriodos: 10,
    totalCH: "3.800h",
    ativo: false,
    cor: "#0EA5E9",
    icone: "🌦️",
  },

  // ── UNIRIO (3 cursos) ────────────────────────────
  {
    id: "lic-historia",
    nome: "Licenciatura em História",
    codigo: "HIS",
    universidade: "UNIRIO",
    polos: [],
    disciplinasApp: [],
    totalDisciplinas: 34,
    totalPeriodos: 10,
    totalCH: "3.000h",
    ativo: false,
    cor: "#B91C1C",
    icone: "📜",
  },
  {
    id: "lic-matematica-unirio",
    nome: "Licenciatura em Matemática",
    codigo: "MAT-UNIRIO",
    universidade: "UNIRIO",
    polos: [],
    disciplinasApp: [],
    totalDisciplinas: 36,
    totalPeriodos: 10,
    totalCH: "3.200h",
    ativo: false,
    cor: "#0891B2",
    icone: "🔢",
  },
  {
    id: "biblioteconomia-unirio",
    nome: "Biblioteconomia",
    codigo: "BIB-UNIRIO",
    universidade: "UNIRIO",
    polos: [],
    disciplinasApp: [],
    totalDisciplinas: 34,
    totalPeriodos: 10,
    totalCH: "3.000h",
    ativo: false,
    cor: "#9333EA",
    icone: "📚",
  },

  // ── CEFET (1 curso) ──────────────────────────────
  {
    id: "engenharia-producao-cefet",
    nome: "Engenharia de Produção",
    codigo: "ENP-CEFET",
    universidade: "CEFET",
    polos: [],
    disciplinasApp: [],
    totalDisciplinas: 40,
    totalPeriodos: 10,
    totalCH: "3.600h",
    ativo: false,
    cor: "#2563EB",
    icone: "⚙️",
  },

  // ── IFF (1 curso) ────────────────────────────────
  {
    id: "tec-design-grafico",
    nome: "Tecnologia em Design Gráfico",
    codigo: "DSG",
    universidade: "IFF",
    polos: [],
    disciplinasApp: [],
    totalDisciplinas: 24,
    totalPeriodos: 6,
    totalCH: "2.200h",
    ativo: false,
    cor: "#7C3AED",
    icone: "🎨",
  },

  // ── CEFET (Turismo) ──────────────────────────────
  {
    id: "tec-gestao-turismo",
    nome: "Tecnologia em Gestão de Turismo",
    codigo: "TRM",
    universidade: "CEFET",
    polos: [],
    disciplinasApp: [],
    totalDisciplinas: 24,
    totalPeriodos: 6,
    totalCH: "2.200h",
    ativo: false,
    cor: "#D97706",
    icone: "✈️",
  },
];

// ============================================================
// HELPERS
// ============================================================

/** Curso por ID */
export function getCursoPorId(id: string): Curso | undefined {
  return cursos.find((c) => c.id === id);
}

/** Polos disponíveis para um curso (retorna Polo[]) */
export function getPolosPorCurso(cursoId: string): Polo[] {
  const curso = getCursoPorId(cursoId);
  if (!curso) return [];
  return polos.filter((p) => curso.polos.includes(p.id));
}

/** Disciplinas do app que pertencem a um curso */
export function getDisciplinasDoCurso(cursoId: string): string[] {
  const curso = getCursoPorId(cursoId);
  return curso?.disciplinasApp ?? [];
}

/** Só os cursos ativos */
export function getCursosAtivos(): Curso[] {
  return cursos.filter((c) => c.ativo);
}

/** Todos os nomes de polo (para autocomplete no login) */
export function getNomesPolos(): string[] {
  return polos.map((p) => p.nome).sort();
}
