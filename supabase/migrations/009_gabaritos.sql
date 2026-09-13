-- 009_gabaritos.sql
-- Gabarito extraoficial pós-AP: aluno cola a prova transcrita (de outra IA),
-- nossa IA revisa e monta o gabarito. Correção em tempo real.

-- ============================================================
-- GABARITOS (prova transcrita + gabarito montado pela IA)
-- ============================================================
create table if not exists public.gabaritos (
  id text primary key,
  disciplina_id text not null,
  etapa text not null,            -- "AP1" | "AP2" | "AD1" | "AD2"
  titulo text not null,           -- ex: "Contabilidade Geral I · AP1"
  texto_transcrito text not null, -- texto colado pelo aluno (transcrição externa)
  total_questoes int not null default 0,
  autor_local_id text not null,
  autor_nome text not null,
  autor_polo text not null,
  publicado boolean default false,
  criado_em timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists gabaritos_disciplina_idx
  on public.gabaritos (disciplina_id, etapa);

create index if not exists gabaritos_autor_idx
  on public.gabaritos (autor_local_id);

-- ============================================================
-- GABARITO_RESPOSTAS (cada questão do gabarito)
-- ============================================================
create table if not exists public.gabarito_respostas (
  id text primary key,
  gabarito_id text not null references public.gabaritos(id) on delete cascade,
  questao_numero int not null,
  enunciado text not null,
  alternativas jsonb not null,     -- ["A) ...", "B) ...", "C) ...", "D) ..."]
  resposta_correta int not null,   -- índice 0-3
  explicacao text not null,
  tipo text default 'objetiva',   -- "objetiva" | "discursiva"
  resposta_modelo text,           -- para discursiva: resposta modelo
  criado_em timestamptz default now()
);

create index if not exists gabarito_respostas_gabarito_idx
  on public.gabarito_respostas (gabarito_id);

-- ============================================================
-- GABARITO_RESPOSTAS_ALUNO (respostas do aluno que está corrigindo)
-- ============================================================
create table if not exists public.gabarito_respostas_aluno (
  id text primary key,
  gabarito_id text not null references public.gabaritos(id) on delete cascade,
  autor_local_id text not null,
  autor_nome text not null,
  autor_polo text not null,
  respostas jsonb not null,        -- { "1": 0, "2": 2, "3": 1, ... }
  nota numeric,                   -- 0-10
  acertos int,
  total int,
  criado_em timestamptz default now()
);

create index if not exists gabarito_respostas_aluno_gabarito_idx
  on public.gabarito_respostas_aluno (gabarito_id);

create index if not exists gabarito_respostas_aluno_autor_idx
  on public.gabarito_respostas_aluno (autor_local_id);

-- ============================================================
-- RLS (anon lê/escreve, mesmo padrão do resto do app)
-- ============================================================
alter table public.gabaritos enable row level security;
alter table public.gabarito_respostas enable row level security;
alter table public.gabarito_respostas_aluno enable row level security;

do $$
begin
  -- gabaritos
  execute 'drop policy if exists "anon_all_gabaritos" on public.gabaritos';
  if not exists (select 1 from pg_policies where policyname = 'gabaritos_anon_select') then
    execute 'create policy "gabaritos_anon_select" on public.gabaritos for select to anon using (true)';
  end if;
  if not exists (select 1 from pg_policies where policyname = 'gabaritos_anon_insert') then
    execute 'create policy "gabaritos_anon_insert" on public.gabaritos for insert to anon with check (true)';
  end if;
  if not exists (select 1 from pg_policies where policyname = 'gabaritos_anon_update_own') then
    execute 'create policy "gabaritos_anon_update_own" on public.gabaritos
      for update to anon using (autor_local_id = auth_uid_or_default())';
  end if;

  -- gabarito_respostas
  execute 'drop policy if exists "anon_all_gabarito_respostas" on public.gabarito_respostas';
  if not exists (select 1 from pg_policies where policyname = 'gabarito_respostas_anon_select') then
    execute 'create policy "gabarito_respostas_anon_select" on public.gabarito_respostas for select to anon using (true)';
  end if;
  if not exists (select 1 from pg_policies where policyname = 'gabarito_respostas_anon_insert') then
    execute 'create policy "gabarito_respostas_anon_insert" on public.gabarito_respostas for insert to anon with check (true)';
  end if;

  -- gabarito_respostas_aluno
  execute 'drop policy if exists "anon_all_gabarito_respostas_aluno" on public.gabarito_respostas_aluno';
  if not exists (select 1 from pg_policies where policyname = 'gabarito_respostas_aluno_anon_select') then
    execute 'create policy "gabarito_respostas_aluno_anon_select" on public.gabarito_respostas_aluno for select to anon using (true)';
  end if;
  if not exists (select 1 from pg_policies where policyname = 'gabarito_respostas_aluno_anon_insert') then
    execute 'create policy "gabarito_respostas_aluno_anon_insert" on public.gabarito_respostas_aluno for insert to anon with check (true)';
  end if;
  if not exists (select 1 from pg_policies where policyname = 'gabarito_respostas_aluno_anon_delete_own') then
    execute 'create policy "gabarito_respostas_aluno_anon_delete_own" on public.gabarito_respostas_aluno
      for delete to anon using (autor_local_id = auth_uid_or_default())';
  end if;
end $$;

-- ============================================================
-- REALTIME
-- ============================================================
alter table public.gabaritos replica identity full;
alter table public.gabarito_respostas replica identity full;
alter table public.gabarito_respostas_aluno replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'gabaritos'
  ) then
    alter publication supabase_realtime add table public.gabaritos;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'gabarito_respostas'
  ) then
    alter publication supabase_realtime add table public.gabarito_respostas;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'gabarito_respostas_aluno'
  ) then
    alter publication supabase_realtime add table public.gabarito_respostas_aluno;
  end if;
end $$;
