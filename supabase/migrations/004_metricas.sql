-- supabase/migrations/004_metricas.sql
-- Métricas de uso (base para decisões de produto/monetização).
-- RLS permissiva como nas demais tabelas (app sem login).

create table if not exists public.metricas (
  id text primary key,
  evento text not null,
  rota text,
  detalhe jsonb,
  autor_local_id text,
  created_at timestamptz default now()
);

create index if not exists metricas_evento_idx on public.metricas (evento);
create index if not exists metricas_created_at_idx on public.metricas (created_at);
create index if not exists metricas_rota_idx on public.metricas (rota);

alter table public.metricas enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'metricas_anon_select') then
    execute 'create policy "metricas_anon_select" on public.metricas for select to anon using (true)';
  end if;
  if not exists (select 1 from pg_policies where policyname = 'metricas_anon_insert') then
    execute 'create policy "metricas_anon_insert" on public.metricas for insert to anon with check (true)';
  end if;
end $$;

GRANT SELECT, INSERT ON public.metricas TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.metricas TO service_role;
