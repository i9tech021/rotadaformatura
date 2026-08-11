export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
}

export interface ChatRoom {
  id: string;
  name: string;
  description: string;
  messages: ChatMessage[];
}

export const MOCK_CHAT_ROOMS: ChatRoom[] = [
  {
    id: 'metodos-1',
    name: 'Métodos Determinísticos I',
    description: 'Sala oficial de estudos da disciplina',
    messages: [
      { id: 'm1', userId: 'u1', userName: 'Carlos', content: 'Boa tarde pessoal!', createdAt: '2026-08-11T14:00:00Z' },
      { id: 'm2', userId: 'u2', userName: 'Ana', content: 'Oi Carlos, tudo bem?', createdAt: '2026-08-11T14:05:00Z' }
    ]
  },
  {
    id: 'contab-1',
    name: 'Contabilidade Geral I',
    description: 'Tire suas dúvidas sobre balanços aqui',
    messages: []
  }
];
