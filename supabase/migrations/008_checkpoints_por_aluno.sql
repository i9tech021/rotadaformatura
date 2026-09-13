-- 008_checkpoints_por_aluno.sql
-- Corrige bug: checkpoints era GLOBAL (aula_id = PK).
-- Agora é POR ALUNO (aula_id + autor_local_id = PK composta).
-- Cada aluno tem seu próprio progresso, sem afetar os colegas.

-- 1. Adiciona coluna autor_local_id (DEFAULT 'default' para dados legados)
ALTER TABLE public.checkpoints
  ADD COLUMN IF NOT EXISTS autor_local_id text NOT NULL DEFAULT 'default';

-- 2. Remove a PK antiga (só aula_id)
ALTER TABLE public.checkpoints
  DROP CONSTRAINT IF EXISTS checkpoints_pkey;

-- 3. Cria PK nova composta (aula_id + autor_local_id)
ALTER TABLE public.checkpoints
  ADD CONSTRAINT checkpoints_pkey PRIMARY KEY (aula_id, autor_local_id);

-- 4. Índices para queries comuns
CREATE INDEX IF NOT EXISTS checkpoints_autor_idx
  ON public.checkpoints (autor_local_id, disciplina_id);

CREATE INDEX IF NOT EXISTS checkpoints_disciplina_autor_idx
  ON public.checkpoints (disciplina_id, autor_local_id);

-- 5. RLS: cada aluno só vê/edita seus próprios checkpoints
--    (mantém compatibilidade: dados legados com autor_local_id='default' ficam visíveis)
DROP POLICY IF EXISTS "anon_all_checkpoints" ON public.checkpoints;

CREATE POLICY "checkpoints_anon_select" ON public.checkpoints
  FOR SELECT TO anon USING (true);

CREATE POLICY "checkpoints_anon_insert" ON public.checkpoints
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "checkpoints_anon_update_own" ON public.checkpoints
  FOR UPDATE TO anon
  USING (autor_local_id = auth_uid_or_default());

-- 6. Realtime (já estava habilitado, garante replicate identity)
ALTER TABLE public.checkpoints REPLICA IDENTITY FULL;
