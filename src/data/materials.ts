export interface Material {
  id: string;
  disciplineId: string;
  title: string;
  type: 'pdf' | 'doc' | 'link' | 'image';
  url: string;
  uploadedAt: string; // ISO string
}

export const MATERIALS: Material[] = [
  {
    id: "mat-1",
    disciplineId: "metodos-1",
    title: "Notas de Aula - Conjuntos",
    type: "pdf",
    url: "#",
    uploadedAt: "2026-08-01T10:00:00Z",
  },
  {
    id: "mat-2",
    disciplineId: "metodos-1",
    title: "Exercícios Resolvidos - Lógica",
    type: "doc",
    url: "#",
    uploadedAt: "2026-08-02T14:30:00Z",
  },
  {
    id: "mat-3",
    disciplineId: "hpa-2",
    title: "Artigo: Pensamento Administrativo Clássico",
    type: "link",
    url: "https://example.com/artigo",
    uploadedAt: "2026-07-28T09:00:00Z",
  },
];
