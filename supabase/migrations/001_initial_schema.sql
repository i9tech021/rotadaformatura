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
-- NOTAS (notas de avaliações por aluno — calculadora de média)
-- ============================================================
create table if not exists public.notas (
  id text primary key,
  student_id text not null default 'default',
  disciplina_id text not null,
  avaliacao_tipo text not null,
  avaliacao_numero int default 1,
  nota numeric,
  peso numeric default 1,
  autor_local_id text,
  autor_nome text,
  autor_polo text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists notas_student_idx on public.notas (student_id);
create index if not exists notas_disciplina_idx on public.notas (disciplina_id);

alter table public.notas enable row level security;

-- Função auxiliar global: devolve o autor_local_id enviado via header
-- 'X-Author-Local-Id' (update/delete "do próprio autor", sem login).
-- Deve ficar ANTES de qualquer policy que a referencie.
create or replace function public.auth_uid_or_default() returns text
  language sql stable as $$
    select coalesce(
      current_setting('request.headers', true)::json->>'x-author-local-id',
      'unknown'
    );
  $$;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'notas_anon_select') then
    execute 'create policy "notas_anon_select" on public.notas for select to anon using (true)';
  end if;
  if not exists (select 1 from pg_policies where policyname = 'notas_anon_insert') then
    execute 'create policy "notas_anon_insert" on public.notas for insert to anon with check (true)';
  end if;
  if not exists (select 1 from pg_policies where policyname = 'notas_anon_update_own') then
    execute 'create policy "notas_anon_update_own" on public.notas for update to anon using (autor_local_id = auth_uid_or_default())';
  end if;
  if not exists (select 1 from pg_policies where policyname = 'notas_anon_delete_own') then
    execute 'create policy "notas_anon_delete_own" on public.notas for delete to anon using (autor_local_id = auth_uid_or_default())';
  end if;
end $$;

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
-- Concede permissões base para o role anon (necessário além de RLS)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

alter table public.disciplinas enable row level security;
alter table public.eventos enable row level security;
alter table public.checkpoints enable row level security;

do $$
declare
  t text;
begin
    foreach t in array array['disciplinas', 'eventos', 'checkpoints'] loop
    execute format('drop policy if exists "anon_all_%I" on public.%I', t, t);
    execute format('create policy "anon_all_%I" on public.%I for all to anon using (true) with check (true)', t, t);
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
-- PUBLICACOES (Comunidade aberta: podcast | pdf | nota por disciplina)
-- Substitui/generaliza a tabela podcasts. Autores se identificam
-- por nome + polo (sem login). Delete/update só do próprio autor.
-- ============================================================
create table if not exists public.publicacoes (
  id text primary key,
  tipo text not null, -- "podcast" | "pdf" | "nota"
  disciplina_id text not null,
  titulo text not null,
  descricao text,
  url text, -- podcast/pfd (Supabase Storage)
  conteudo text, -- nota (texto direto)
  autor_nome text not null,
  autor_polo text not null,
  autor_local_id text not null, -- gerado no navegador
  etapa text default 'Geral', -- "Geral" | "AD1" | "AP1" | "AD2" | "AP2"
  tags text[] default '{}',
  criado_em timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists publicacoes_disciplina_idx on public.publicacoes (disciplina_id);
create index if not exists publicacoes_tipo_idx on public.publicacoes (tipo);
create index if not exists publicacoes_etapa_idx on public.publicacoes (etapa);

-- Migração: tabelas publicacoes já existentes ganham a coluna etapa
alter table public.publicacoes add column if not exists etapa text default 'Geral';

alter table public.publicacoes enable row level security;

-- Função auth_uid_or_default definida no início do bloco RLS

-- Leitura pública (anon select)
create policy "publicacoes_anon_select" on public.publicacoes
  for select to anon using (true);

-- Inserção pública (anon insert)
create policy "publicacoes_anon_insert" on public.publicacoes
  for insert to anon with check (tipo in ('podcast', 'pdf', 'nota'));

-- Exclusão apenas do próprio autor (autor_local_id bate com o informado no update/delete)
create policy "publicacoes_anon_delete_own" on public.publicacoes
  for delete to anon
  using (autor_local_id = auth_uid_or_default());

-- Atualização apenas do próprio autor
create policy "publicacoes_anon_update_own" on public.publicacoes
  for update to anon
  using (autor_local_id = auth_uid_or_default());

-- ============================================================
-- DENUNCIAS (moderação leve — só guarda o dado p/ revisão futura)
-- ============================================================
create table if not exists public.denuncias (
  id text primary key default gen_random_uuid()::text,
  publicacao_id text not null,
  criado_em timestamptz default now()
);

create index if not exists denuncias_publicacao_idx on public.denuncias (publicacao_id);

alter table public.denuncias enable row level security;

create policy "denuncias_anon_insert" on public.denuncias
  for insert to anon with check (true);

-- ============================================================
-- PODCASTS (legado — mantida p/ compatibilidade; novos posts vão p/ publicacoes)
-- ============================================================
create table if not exists public.podcasts (
  id text primary key,
  disciplina_id text not null,
  titulo text not null,
  descricao text,
  url text not null,
  duracao_seg numeric,
  criado_em timestamptz default now()
);

-- Migração: podcasts existentes → publicacoes (tipo 'podcast')
insert into public.publicacoes (
  id, tipo, disciplina_id, titulo, descricao, url, conteudo,
  autor_nome, autor_polo, autor_local_id, tags, criado_em
)
select
  id, 'podcast', disciplina_id, titulo, descricao, url, null,
  'Podcast', 'CEDERJ', id, array['podcast'], criado_em
from public.podcasts
on conflict (id) do nothing;

create index if not exists podcasts_disciplina_idx on public.podcasts (disciplina_id);

-- Bucket de Storage para os arquivos de áudio (público para leitura)
insert into storage.buckets (id, name, public)
  values ('podcasts', 'podcasts', true)
  on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1 from pg_policies where policyname = 'podcasts_public_read'
  ) then
    execute 'create policy "podcasts_public_read" on storage.objects
      for select using (bucket_id = ''podcasts'')';
  end if;
  -- remove a policy ampla antiga (permitia update/delete); leitura+inserção apenas
  execute 'drop policy if exists "podcasts_public_write" on storage.objects';
  if not exists (
    select 1 from pg_policies where policyname = 'podcasts_public_insert'
  ) then
    execute 'create policy "podcasts_public_insert" on storage.objects
      for insert to anon with check (bucket_id = ''podcasts'')';
  end if;
end $$;

-- Bucket de Storage único para publicacoes (podcast/pfd)
insert into storage.buckets (id, name, public)
  values ('publicacoes', 'publicacoes', true)
  on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1 from pg_policies where policyname = 'publicacoes_public_read'
  ) then
    execute 'create policy "publicacoes_public_read" on storage.objects
      for select using (bucket_id = ''publicacoes'')';
  end if;
  -- remove a policy ampla antiga (permitia update/delete); leitura+inserção apenas
  execute 'drop policy if exists "publicacoes_public_write" on storage.objects';
  if not exists (
    select 1 from pg_policies where policyname = 'publicacoes_public_insert'
  ) then
    execute 'create policy "publicacoes_public_insert" on storage.objects
      for insert to anon with check (bucket_id = ''publicacoes'')';
  end if;
end $$;

-- ============================================================
-- PROVAS ANTIGAS (base real dos simulados: mínimo 3 PDFs por
-- disciplina + etapa; texto extraído no upload para a IA usar)
-- ============================================================
create table if not exists public.provas_antigas (
  id text primary key,
  disciplina_id text not null,
  tipo text not null, -- "AD1" | "AP1" | "AD2" | "AP2"
  titulo text not null,
  url text not null,
  texto_extraido text,
  num_paginas int default 0,
  autor_local_id text,
  criado_em timestamptz default now()
);

create index if not exists provas_disciplina_tipo_idx
  on public.provas_antigas (disciplina_id, tipo);

-- Migração: coluna de autor em tabelas já existentes
alter table public.provas_antigas add column if not exists autor_local_id text;

alter table public.provas_antigas enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'provas_anon_select') then
    execute 'create policy "provas_anon_select" on public.provas_antigas for select to anon using (true)';
  end if;
  if not exists (select 1 from pg_policies where policyname = 'provas_anon_insert') then
    execute 'create policy "provas_anon_insert" on public.provas_antigas for insert to anon with check (true)';
  end if;
  if not exists (select 1 from pg_policies where policyname = 'provas_anon_delete_own') then
    execute 'create policy "provas_anon_delete_own" on public.provas_antigas for delete to anon using (autor_local_id = auth_uid_or_default() or autor_local_id is null)';
  end if;
end $$;

-- Bucket de Storage para as provas em PDF (leitura pública + inserção)
insert into storage.buckets (id, name, public)
  values ('provas', 'provas', true)
  on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1 from pg_policies where policyname = 'provas_public_read'
  ) then
    execute 'create policy "provas_public_read" on storage.objects
      for select using (bucket_id = ''provas'')';
  end if;
  execute 'drop policy if exists "provas_public_write" on storage.objects';
  if not exists (
    select 1 from pg_policies where policyname = 'provas_public_insert'
  ) then
    execute 'create policy "provas_public_insert" on storage.objects
      for insert to anon with check (bucket_id = ''provas'')';
  end if;
end $$;

-- ============================================================
-- SIMULADOS (banco de questões + realizados; limite 1/7 dias por autor)
-- Identidade = autor_local_id (mesmo da Comunidade, sem login).
-- ============================================================
create table if not exists public.questoes (
  id text primary key,
  disciplina_id text not null,
  enunciado text not null,
  alternativas jsonb not null, -- ["texto alt A", "texto alt B", ...]
  resposta_correta int not null, -- índice 0-3
  explicacao text,
  tipo text not null, -- "AD1" | "AP1" | "AD2" | "AP2"
  dificuldade text default 'medio', -- facil | medio | dificil
  fonte text,
  criado_em timestamptz default now()
);

-- Migração: tabelas já existentes ganham as colunas novas
alter table public.questoes add column if not exists dificuldade text default 'medio';
alter table public.questoes add column if not exists criado_em timestamptz default now();

create index if not exists questoes_disciplina_tipo_idx
  on public.questoes (disciplina_id, tipo);

create table if not exists public.simulados_realizados (
  id text primary key,
  autor_local_id text not null, -- mesmo id local da Comunidade
  disciplina_id text not null,
  tipo text not null, -- "AD1" | "AP1" | "AD2" | "AP2"
  questoes jsonb not null, -- ids das questões usadas
  respostas jsonb,
  nota numeric, -- 0-10
  percentual numeric,
  criado_em timestamptz default now()
);

-- Migração: colunas novas (mantém user_id/acertos/total legados)
alter table public.simulados_realizados add column if not exists autor_local_id text;
alter table public.simulados_realizados add column if not exists tipo text;
alter table public.simulados_realizados add column if not exists nota numeric;
alter table public.simulados_realizados add column if not exists autor_nome text;
alter table public.simulados_realizados add column if not exists autor_polo text;

create index if not exists simulados_autor_idx
  on public.simulados_realizados (autor_local_id, criado_em desc);

alter table public.questoes enable row level security;
alter table public.simulados_realizados enable row level security;

-- RLS controlado (fora do loop permissivo):
-- questoes: leitura pública + inserção pública (banco cresce com a IA).
-- simulados: leitura/inserção públicas; update/delete só do próprio autor.
do $$
begin
  execute 'drop policy if exists "anon_all_questoes" on public.questoes';
  execute 'drop policy if exists "anon_all_simulados_realizados" on public.simulados_realizados';

  if not exists (select 1 from pg_policies where policyname = 'questoes_anon_select') then
    execute 'create policy "questoes_anon_select" on public.questoes for select to anon using (true)';
  end if;
  if not exists (select 1 from pg_policies where policyname = 'questoes_anon_insert') then
    execute 'create policy "questoes_anon_insert" on public.questoes for insert to anon with check (true)';
  end if;

  if not exists (select 1 from pg_policies where policyname = 'simulados_anon_select') then
    execute 'create policy "simulados_anon_select" on public.simulados_realizados for select to anon using (true)';
  end if;
  if not exists (select 1 from pg_policies where policyname = 'simulados_anon_insert') then
    execute 'create policy "simulados_anon_insert" on public.simulados_realizados for insert to anon with check (true)';
  end if;
  if not exists (select 1 from pg_policies where policyname = 'simulados_anon_update_own') then
    execute 'create policy "simulados_anon_update_own" on public.simulados_realizados for update to anon using (autor_local_id = auth_uid_or_default())';
  end if;
  if not exists (select 1 from pg_policies where policyname = 'simulados_anon_delete_own') then
    execute 'create policy "simulados_anon_delete_own" on public.simulados_realizados for delete to anon using (autor_local_id = auth_uid_or_default())';
  end if;
end $$;

-- ============================================================
-- REALTIME: habilita replicação para os clientes assinarem mudanças
-- (dashboard de urgência e progresso de aulas atualizam ao vivo).
-- ============================================================
alter table public.disciplinas replica identity full;
alter table public.eventos replica identity full;
alter table public.checkpoints replica identity full;
alter table public.notas replica identity full;
alter table public.chat_messages replica identity full;
alter table public.publicacoes replica identity full;
alter table public.simulados_realizados replica identity full;
alter table public.provas_antigas replica identity full;
alter table public.questoes replica identity full;

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
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public' and tablename = 'notas'
  ) then
    alter publication supabase_realtime add table public.notas;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public' and tablename = 'podcasts'
  ) then
    alter publication supabase_realtime add table public.podcasts;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public' and tablename = 'simulados_realizados'
  ) then
    alter publication supabase_realtime add table public.simulados_realizados;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public' and tablename = 'publicacoes'
  ) then
    alter publication supabase_realtime add table public.publicacoes;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public' and tablename = 'denuncias'
  ) then
    alter publication supabase_realtime add table public.denuncias;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public' and tablename = 'provas_antigas'
  ) then
    alter publication supabase_realtime add table public.provas_antigas;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public' and tablename = 'questoes'
  ) then
    alter publication supabase_realtime add table public.questoes;
  end if;
end $$;
