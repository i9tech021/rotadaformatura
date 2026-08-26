-- supabase/schema.sql
-- Rota da Formatura — esquema do banco (CEDERJ Administração 2026-2)
-- Decisão Frente 1: RLS com anon PERMISSIVO (app sem login, dados de cronograma públicos).
-- Execute no SQL Editor do Supabase ou via `supabase db push`.

-- ============================================================
-- DISCIPLINAS (dados de referência, semeados via src/lib/seed.ts)
-- ============================================================
create table if not exists public.disciplinas (
  id text primary key,
  nome text not null,
  codigo text,
  icone text,
  cor text,
  coordenador text,
  total_aulas int default 0,
  periodo text,
  ch text,
  progresso int default 0,
  guia_objetivo text,
  guia_metodo text,
  formula_n1 text,
  formula_n2 text,
  formula_aprovacao text,
  formula_ap3 text,
  semestre text default '2026-2',
  updated_at timestamptz default now()
);

-- ============================================================
-- EVENTOS (avaliações AD/AP/Questionário + marcos)
-- ============================================================
create table if not exists public.eventos (
  id text primary key,
  disciplina_id text not null,
  disciplina_nome text,
  disciplina_codigo text,
  disciplina_cor text,
  titulo text not null,
  tipo text not null,
  data_inicio date not null,
  data_fim date,
  horario text,
  local text,
  conteudo text,
  peso numeric,
  observacoes text,
  alerta_dias int default 7
);

create index if not exists eventos_disciplina_id_idx on public.eventos (disciplina_id);
create index if not exists eventos_data_inicio_idx on public.eventos (data_inicio);

-- ============================================================
-- CHECKPOINTS (progresso de aula por aluno — concluído ou não)
-- ============================================================
create table if not exists public.checkpoints (
  aula_id text primary key,
  disciplina_id text not null,
  concluido boolean default false,
  updated_at timestamptz default now()
);

create index if not exists checkpoints_disciplina_id_idx on public.checkpoints (disciplina_id);

-- ============================================================
-- RLS: anon pode ler e escrever (app sem autenticação)
-- ============================================================
alter table public.disciplinas enable row level security;
alter table public.eventos enable row level security;
alter table public.checkpoints enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['disciplinas', 'eventos', 'checkpoints'] loop
    execute format(
      'drop policy if exists "anon_all_%I" on public.%I;'
      'create policy "anon_all_%I" on public.%I for all to anon using (true) with check (true);',
      t, t, t, t
    );
  end loop;
end $$;

-- ============================================================
-- CHAT COMUNITÁRIO (mensagens por sala de disciplina)
-- ============================================================
create table if not exists public.chat_messages (
  id text primary key,
  sala_id text not null,
  user_name text not null default 'Estudante',
  content text not null,
  created_at timestamptz default now()
);

create index if not exists chat_messages_sala_idx on public.chat_messages (sala_id, created_at);

alter table public.chat_messages enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where policyname = 'anon_all_chat_messages'
  ) then
    execute 'create policy "anon_all_chat_messages" on public.chat_messages
      for all to anon using (true) with check (true)';
  end if;
end $$;

-- ============================================================
-- REALTIME: habilita replicação para os clientes assinarem mudanças
-- (dashboard de urgência e progresso de aulas atualizam ao vivo).
-- ============================================================
alter table public.disciplinas replica identity full;
alter table public.eventos replica identity full;
alter table public.checkpoints replica identity full;
alter table public.chat_messages replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public' and tablename = 'disciplinas'
  ) then
    alter publication supabase_realtime add table public.disciplinas;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public' and tablename = 'eventos'
  ) then
    alter publication supabase_realtime add table public.eventos;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public' and tablename = 'checkpoints'
  ) then
    alter publication supabase_realtime add table public.checkpoints;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public' and tablename = 'chat_messages'
  ) then
    alter publication supabase_realtime add table public.chat_messages;
  end if;
end $$;
