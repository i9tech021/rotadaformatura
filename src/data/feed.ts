export interface FeedPost {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  type: 'post' | 'achievement' | 'question';
  likes: number;
  comments: number;
  createdAt: string;
}

export const MOCK_FEED: FeedPost[] = [
  {
    id: 'post-1',
    userId: 'u1',
    userName: 'Carlos Silva',
    content: 'Alguém mais sofrendo com o EP3 de Métodos Determinísticos I? A parte de lógica tá tensa!',
    type: 'question',
    likes: 12,
    comments: 5,
    createdAt: '2026-08-11T10:00:00Z',
  },
  {
    id: 'post-2',
    userId: 'u2',
    userName: 'Ana Oliveira',
    content: 'Passei na AP1 de Contabilidade Geral I! Rumo à formatura! 🎓',
    type: 'achievement',
    likes: 45,
    comments: 8,
    createdAt: '2026-08-11T12:30:00Z',
  },
  {
    id: 'post-3',
    userId: 'u3',
    userName: 'Ricardo Mello',
    content: 'Acabei de subir um resumo matador sobre História do Pensamento Administrativo II na aba de materiais. Confiram lá!',
    type: 'post',
    likes: 28,
    comments: 3,
    createdAt: '2026-08-11T14:15:00Z',
  }
];
