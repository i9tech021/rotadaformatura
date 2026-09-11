-- Migration 007: tabelas colaborativas em tempo real
-- Tudo que um aluno publica (provas, perguntas, resumos, atividades,
-- resultados de desafio, eventos coletivos) aparece para TODOS via Realtime.
-- App aberto (sem login): RLS permissiva para anon, mesmo padrão da 006.

-- ============================================================
-- BANCO DE PROVAS (provas anteriores enviadas pelos alunos)
-- ============================================================
create table if not exists public.banco_provas (
  id text primary key,
  disciplina_id text not null,
  disciplina_nome text not null default '',
  tipo text not null default 'AD1',
  semestre text not null default '',
  conteudo text not null default '',
  autor_nome text not null default 'Anônimo',
  autor_polo text not null default '',
  autor_local_id text,
  avaliacoes int not null default 0,
  criado_em timestamptz not null default now()
);
create index if not exists banco_provas_disciplina_idx on public.banco_provas (disciplina_id);
create index if not exists banco_provas_criado_idx on public.banco_provas (criado_em desc);

-- ============================================================
-- FAQ (perguntas da turma)
-- ============================================================
create table if not exists public.faq_perguntas (
  id text primary key,
  titulo text not null,
  conteudo text not null default '',
  disciplina_id text not null default '',
  autor_nome text not null default 'Anônimo',
  autor_polo text not null default '',
  autor_local_id text,
  votos int not null default 0,
  resolvida boolean not null default false,
  criado_em timestamptz not null default now()
);
create index if not exists faq_perguntas_disciplina_idx on public.faq_perguntas (disciplina_id);
create index if not exists faq_perguntas_criado_idx on public.faq_perguntas (criado_em desc);

create table if not exists public.faq_respostas (
  id text primary key,
  pergunta_id text not null references public.faq_perguntas (id) on delete cascade,
  conteudo text not null,
  autor_nome text not null default 'Anônimo',
  autor_polo text not null default '',
  autor_local_id text,
  votos int not null default 0,
  melhor boolean not null default false,
  criado_em timestamptz not null default now()
);
create index if not exists faq_respostas_pergunta_idx on public.faq_respostas (pergunta_id);

-- ============================================================
-- RESUMOS COLABORATIVOS
-- ============================================================
create table if not exists public.resumos (
  id text primary key,
  titulo text not null,
  conteudo text not null default '',
  disciplina_id text not null default '',
  disciplina_nome text not null default '',
  autor_nome text not null default 'Anônimo',
  autor_polo text not null default '',
  autor_local_id text,
  votos_uteis int not null default 0,
  visualizacoes int not null default 0,
  criado_em timestamptz not null default now()
);
create index if not exists resumos_disciplina_idx on public.resumos (disciplina_id);
create index if not exists resumos_criado_idx on public.resumos (criado_em desc);

-- ============================================================
-- ATIVIDADES (feed: o que cada aluno está fazendo)
-- ============================================================
create table if not exists public.atividades (
  id text primary key,
  usuario text not null default 'Aluno',
  polo text not null default '',
  acao text not null default '',
  disciplina_id text not null default '',
  tipo text not null default 'estudo',
  criado_em timestamptz not null default now()
);
create index if not exists atividades_criado_idx on public.atividades (criado_em desc);

-- ============================================================
-- DESAFIO DA SEMANA (tentativas de todos os alunos)
-- ============================================================
create table if not exists public.desafio_resultados (
  id text primary key,
  desafio_id text not null default 'atual',
  autor_local_id text not null default 'unknown',
  autor_nome text not null default 'Anônimo',
  autor_polo text not null default '',
  acertos int not null default 0,
  total int not null default 0,
  tempo_seg int not null default 0,
  criado_em timestamptz not null default now()
);
create index if not exists desafio_resultados_desafio_idx on public.desafio_resultados (desafio_id);

-- ============================================================
-- EVENTOS COLETIVOS (calendário compartilhado da turma)
-- ============================================================
create table if not exists public.eventos_coletivos (
  id text primary key,
  titulo text not null,
  descricao text not null default '',
  data date not null,
  hora text,
  tipo text not null default 'evento',
  criado_por text not null default 'Turma',
  criado_em timestamptz not null default now()
);
create index if not exists eventos_coletivos_data_idx on public.eventos_coletivos (data);

-- ============================================================
-- RLS + GRANTS (anon pode tudo — app sem login)
-- ============================================================
do $$
declare
  t text;
begin
  foreach t in array array[
    'banco_provas', 'faq_perguntas', 'faq_respostas', 'resumos',
    'atividades', 'desafio_resultados', 'eventos_coletivos'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('grant select, insert, update, delete on public.%I to anon', t);
    execute format('drop policy if exists "%I_anon_all" on public.%I', t || '', t);
    execute format(
      'create policy "%I_anon_all" on public.%I for all to anon using (true) with check (true)',
      t, t
    );
    execute format('alter table public.%I replica identity full', t);
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- ============================================================
-- SEED: eventos oficiais do calendário coletivo (2026-2)
-- ============================================================
insert into public.eventos_coletivos (id, titulo, descricao, data, hora, tipo, criado_por)
values
  ('ev-001', 'Início das Aulas 2026-2', 'Primeiro dia de aulas do semestre. Verifique seu horário no portal.', '2026-07-28', null, 'aula', 'CEDERJ'),
  ('ev-002', 'AD1 - Métodos Determinísticos I', 'Avaliação Diagnóstica 1. Peso: 20% da média final.', '2026-09-05', '14:00', 'prova', 'Prof. Silva'),
  ('ev-003', 'Feriado - Independência', 'Não haverá aulas. Aproveite para estudar!', '2026-09-07', null, 'evento', 'CEDERJ'),
  ('ev-004', 'Prazo Monografia - Versão Preliminar', 'Entrega da versão preliminar da monografia para orientação.', '2026-09-15', null, 'prazo', 'Coordenação'),
  ('ev-005', 'Prazo TCC - Projeto Final', 'Entrega do projeto final do TCC para aprovação da banca.', '2026-10-30', null, 'prazo', 'Coordenação'),
  ('ev-006', 'Colação de Grau - Turma 2025-2', 'Cerimônia de colação de grau dos formandos do semestre anterior.', '2026-11-15', '10:00', 'formatura', 'CEDERJ'),
  ('ev-007', 'Prazo Estágio - Relatório Final', 'Entrega do relatório final de estágio para validação.', '2026-12-01', null, 'prazo', 'Coordenação'),
  ('ev-008', 'Semana de Provas Finais', 'Período de provas finais do semestre. Confira seu horário no portal.', '2026-12-10', null, 'prova', 'CEDERJ')
on conflict (id) do nothing;
