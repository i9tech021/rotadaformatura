# Rota da Formatura — Deploy & Configuração

App de planejamento acadêmico CEDERJ/Administração 2026-2 (TanStack Start + React + Supabase + IA).
Este guia conecta o projeto ao **Lovable** com IA funcionando e dados em **tempo real** no Supabase.

## 1. Supabase (banco + realtime)

1. Crie um projeto em https://supabase.com.
2. No **SQL Editor**, cole e rode o conteúdo de `supabase/schema.sql` (cria tabelas
   `disciplinas`, `eventos`, `checkpoints`, habilita RLS anon permissiva e liga o Realtime).
3. Anote a **Project URL** e a **anon public key** (Settings → API).

> RLS é deliberadamente permissiva (anon lê/escreve) porque o app não tem login.
> Não exponha a `service_role` key no front-end.

## 2. OpenRouter (IA do Tutor)

1. Crie conta e gere uma chave em https://openrouter.ai/keys.
2. Modelo gratuito usado por padrão: `nvidia/nemotron-3.5-lightning:free`
   (outros testados: `google/gemma-4-26b-a4b-it:free`, `nvidia/nemotron-3-ultra-550b-a55b:free`).
   Modelos free podem dar `429` (limite do pool) — o app avisa "tente novamente em instantes".

## 3. Variáveis de ambiente (Lovable)

No Lovable: **Project → Settings → Environment Variables** do projeto conectado a este repo.
Defina (prefixo `VITE_` é obrigatório para chegar ao cliente):

| Var | Valor |
|-----|-------|
| `VITE_SUPABASE_URL` | URL do projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | anon public key do Supabase |
| `VITE_AI_API_KEY` | chave da OpenRouter (`sk-or-...`) |
| `VITE_AI_BASE_URL` | `https://openrouter.ai/api/v1` (já tem default no código) |
| `VITE_AI_MODEL` | `nvidia/nemotron-3.5-lightning:free` (opcional) |

Sem `VITE_AI_API_KEY` a IA avisa "não configurada"; sem Supabase o app usa dados estáticos.

## 4. Popular o banco (Seed)

No próprio app (dashboard), clique em **"Seed Database"** — semeia disciplinas, eventos e
checkpoints iniciais do semestre 2026-2. (Ou rode `src/lib/seed.ts` em ambiente Node.)

## 5. Realtime (ao vivo)

Já está ligado no `schema.sql` (`supabase_realtime` + `replica identity full`). O dashboard de
urgência e o detalhe de disciplina re-assinam `eventos`, `checkpoints` e `disciplinas` e
atualizam sozinhos a cada insert/update/delete no banco.

## 6. Deploy no link

O Lovable faz o build a partir deste repo. Para o app aparecer no link público pode ser
necessário **upgrade do plano** (política da plataforma). A IA roda 100% no cliente, então
funciona mesmo em deploy estático — não depende de server functions.

> **Marca d'água "Made with Lovable":** é da plataforma (planos free). Não existe no código;
> some com upgrade de plano ou toggle nas configurações do Lovable.

## Scripts locais

- `bun install` / `bun run dev` — ambiente de desenvolvimento (servidor em `:8080`).
- `bun run build` — build de produção (Nitro).
- `.env` local segue o `.env.example` (não versionado).
