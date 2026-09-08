-- Migration 005: adiciona coluna objetivo na tabela podcasts
-- (AP1, AP2, AP3, AD1, AD2, revisao, conteudo, dica)
alter table public.podcasts
  add column if not exists objetivo text;
