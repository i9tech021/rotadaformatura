-- Migration 006: RLS permissiva (anon) na tabela podcasts
-- O app é aberto (sem login): anon precisa ler, inserir e excluir podcasts.
alter table public.podcasts enable row level security;

grant select, insert, update, delete on public.podcasts to anon;

drop policy if exists "podcasts_anon_select" on public.podcasts;
create policy "podcasts_anon_select"
  on public.podcasts for select to anon using (true);

drop policy if exists "podcasts_anon_insert" on public.podcasts;
create policy "podcasts_anon_insert"
  on public.podcasts for insert to anon with check (true);

drop policy if exists "podcasts_anon_delete" on public.podcasts;
create policy "podcasts_anon_delete"
  on public.podcasts for delete to anon using (true);

-- Storage: permitir excluir arquivos do bucket podcasts (a exclusão do
-- podcast remove o arquivo junto; sem isso o delete falha em silêncio)
do $$
begin
  execute 'drop policy if exists "podcasts_public_delete" on storage.objects';
  if not exists (select 1 from pg_policies where policyname = 'podcasts_public_delete') then
    execute 'create policy "podcasts_public_delete" on storage.objects
      for delete to anon using (bucket_id = ''podcasts'')';
  end if;
end $$;
