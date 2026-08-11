export interface AcademicEvent {
  id: string;
  disciplineId: string;
  title: string;
  type: 'AD1' | 'AD2' | 'AP1' | 'AP2' | 'AP3' | 'Other';
  date: string; // ISO string
  time: string;
}

export const CALENDAR_EVENTS: AcademicEvent[] = [
  {
    id: "event-1",
    disciplineId: "metodos-1",
    title: "AP1 Métodos Determinísticos I",
    type: "AP1",
    date: "2026-09-05",
    time: "09:30",
  },
  {
    id: "event-2",
    disciplineId: "hpa-2",
    title: "AP1 História do Pensamento Adm. II",
    type: "AP1",
    date: "2026-09-06",
    time: "13:30",
  },
  {
    id: "event-3",
    disciplineId: "contab-1",
    title: "AP1 Contabilidade Geral I",
    type: "AP1",
    date: "2026-09-13",
    time: "09:30",
  },
];
