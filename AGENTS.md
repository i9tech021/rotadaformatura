<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# Rota da Formatura — Guia para Assistentes (AGENTS.md)

App de planejamento acadêmico para alunos do **CEDERJ / Administração / 2026-2**.
Gerado no Lovable e conectado a este repo. Leia isto antes de mexer no código.

## Stack (resumo)
- **TanStack Start** (full-stack: roteamento file-based + SSR via Nitro) + React 19 + TS.
- Tailwind CSS v4 + tokens shadcn-style (oklch) em `src/styles.css`.
- Componentes Radix/shadcn em `src/components/ui/*`.
- Dados de referência em `src/data/*` (disciplinas/eventos reais 2026-2, sem inventar).
- **Supabase (opcional):** `src/lib/supabase.ts` + `supabase/schema.sql`. RLS permissiva (anon
  lê/escreve). `eventsService.ts` lê eventos do Supabase quando `VITE_SUPABASE_URL`/`ANON_KEY`
  estão set; senão cai no dado estático (fallback). `seed.ts` semeia disciplinas/eventos/checkpoints.
- **IA (Tutor):** `src/components/StudyAssistant.tsx` + `src/lib/academic.functions.ts`
  (server function `askAcademicAI`). Usa a **OpenRouter** (OpenAI-compatible) — `VITE_AI_BASE_URL`
  aponta para `https://openrouter.ai/api/v1`, funciona no deploy do Lovable. Modelo em
  `VITE_AI_MODEL` (free padrão: `nvidia/nemotron-3.5-lightning:free`). Chave `VITE_AI_API_KEY`
  é lida SÓ dentro da server function (nunca referencie em componentes de tela).
  Free models podem dar 429 (limite do pool) — o app mostra "tente novamente em instantes".
- Gerenciador: **bun** (`bun install`, `bun run dev`). npm também funciona.

## Estrutura que importa
- `src/routes/**` — telas (file-based). `__root.tsx` = layout/providers/404/erro.
- `src/data/disciplines.ts` (7 disciplinas, 3 completas + 4 pendentes), `events.ts`
  (~30 eventos, helpers de data), `studyPlan.ts` (rotina/tarefas), `materials.ts`,
  `chat.ts` (MOCK_CHAT_ROOMS), `calendar.ts`, `feed.ts`.
- `src/components/academic/AcademicChecklist.tsx` — checklist de aulas por disciplina.
- `src/hooks/useLocalStorage.ts` — persiste estado no navegador.
- `src/styles.css` — tema. `src/lib/utils.ts` — `cn()`.

## Rotas
`/` dashboard · `/disciplines` lista · `/disciplines/$id` detalhe (tabs) ·
`/calendar` · `/materials` · `/community` + `/community/chat` · `/settings`.

## Paleta (atenção: dois sistemas de cor)
1. **Hex hardcoded** nos componentes: `#0A3D52` (primary/petróleo), `#D4941E` (accent/âmbar),
   `#27AE60` (ok), `#E74C3C` (urgente), `#F5F7FA` (fundo claro), `#FFFFFF`,
   `#7C3AED` (podcast), `#2563EB` (vídeo).
2. **Tokens shadcn** (oklch) em `src/styles.css`: `bg-background`, `text-foreground`,
   `bg-primary` (≈#0A3D52), `bg-secondary` (≈#D4941E) etc. Usados em `__root.tsx`.
   Ao mudar cor de marca, atualize AMBOS os lugares (ou unifique num só sistema).

## Datas críticas (AP1 — fixas em 2026, vêm de `events.ts`)
05/09 Métodos Det. I · 06/09 HPA II · 13/09 Contab. Geral I.
Se o semestre mudar, edite `events.ts`.

## O que NÃO está implementado (não "invente" como se fosse real)
- **Sem auth/login.** Supabase usa RLS anon permissiva (app multiusuário sem conta).
- Chat comunitário (`community/chat.tsx`): `handleSend` só altera estado da sessão — não persiste,
  não é multiusuário, não tem servidor.
- "Probabilidade de aprovação" 65% é **hardcoded** em `disciplines.$id.tsx` (~linha 331).
- `progresso` das disciplinas é hardcoded em `disciplines.ts` (não reflete conclusão).
- Podcasts/Resumos: empty states. Simulados: botão placeholder. Materiais: upload/exclusão simulados.
- Missões do dia não persistem conclusão entre sessões.

## Regras de Git / Lovable (OBRIGATÓRIO)
- O repo está conectado ao Lovable; `main` é a fonte de verdade (sync bidirecional).
- ❌ Nunca `push --force`, `rebase`, `amend` ou `squash` de commits já enviados.
- ⚠️ Não edite o mesmo arquivo no Lovable e localmente ao mesmo tempo (conflito).
- ✅ Fluxo: `git pull` → editar → `git add/commit/push`. Mantenha `main` buildando.

## Ao implementar melhorias
- Para progresso real: usar `useLocalStorage` (já existe) ou criar backend.
- Para chat real: precisará de backend (Supabase Realtime / WebSocket).
- Para completar disciplinas pendentes: faltam cronograma 2026-2, guia e caderno didático.
- Ao adicionar cor de marca, prefira os tokens de `styles.css` para manter consistência.
