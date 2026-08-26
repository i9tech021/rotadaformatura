# Rota da Formatura

Planner acadêmico para alunos do **CEDERJ** (curso de Administração, semestre **2026-2**).
Organiza disciplinas, cronograma de avaliações, missões diárias (podcast/vídeo/leitura),
checklists de aulas, calendário e uma comunidade com salas de chat por disciplina.

Projeto gerado no [Lovable](https://lovable.dev) e conectado a este repositório GitHub.
O repositório é a fonte de verdade: tudo que entra no branch `main` (pelo Lovable ou por
edição local) sincroniza nos dois sentidos. Ver seção **Regras de sincronização**.

---

## Stack

| Camada | Tecnologia |
| --- | --- |
| Framework | **TanStack Start** (full-stack, roteamento + SSR via Nitro) |
| UI | React 19 + TypeScript |
| Roteamento | `@tanstack/react-router` (file-based em `src/routes`) |
| Estilo | Tailwind CSS v4 (`@tailwindcss/vite`) + tokens shadcn-style em `src/styles.css` |
| Componentes | Radix UI (shadcn-style) em `src/components/ui/*` |
| Dados | Mockados em `src/data/*` (sem backend/Supabase ainda) |
| Gráficos | Recharts |
| Animação | Framer Motion |
| Forms | React Hook Form + Zod |
| Query | `@tanstack/react-query` |
| Ícones | `lucide-react` |
| Gerenciador | **bun** (usado no deploy/local); `npm` também funciona |
| Config Lovable | `@lovable.dev/vite-tanstack-config` |

> Observação: há um aviso de runtime sobre o plugin `vite-tsconfig-paths` (já resolvido
> nativamente no Vite 8 via `resolve.tsconfigPaths`). Não é bloqueante.

---

## Como rodar

```sh
# instalar
bun install          # ou: npm install

# desenvolvimento (Vite/TanStack Start)
bun run dev          # abra a URL local exibida no terminal

# produção
bun run build
bun run preview
```

Scripts (`package.json`): `dev`, `build`, `build:dev`, `preview`, `lint` (eslint),
`format` (prettier).

---

## Estrutura de pastas

```
src/
  routes/            # rotas file-based (veja tabela abaixo)
    __root.tsx       # layout raiz, providers (React Query), 404/erro
    index.tsx        # Dashboard
    disciplines.tsx          # Biblioteca de disciplinas (lista)
    disciplines.$id.tsx      # Detalhe de uma disciplina (tabs)
    calendar.tsx     # Calendário acadêmico mensal
    materials.tsx    # Biblioteca de materiais (upload/exclusão simulados)
    community/index.tsx      # Comunidade (salas)
    community/chat.tsx       # Chat da sala (mock, só sessão)
    settings.tsx     # Perfil + notificações (persiste via localStorage)
  components/
    ui/              # biblioteca de componentes (shadcn/Radix)
    academic/AcademicChecklist.tsx   # checklist de aulas por disciplina
  data/              # camada de dados mockada (veja abaixo)
  lib/               # utils, funções server, error reporting Lovable
  hooks/             # useLocalStorage, use-mobile
  styles.css         # tema (tokens oklch) + Tailwind v4
  router.tsx, start.ts, server.ts
```

---

## Rotas

| Rota | Arquivo | Descrição |
| --- | --- | --- |
| `/` | `index.tsx` | Dashboard: saudação, resumo de disciplinas, próxima avaliação (countdown), missões do dia, grade de disciplinas |
| `/disciplines` | `disciplines.tsx` | Biblioteca: busca/filtro por período, cards de disciplina |
| `/disciplines/$id` | `disciplines.$id.tsx` | Detalhe: header com progresso, alerta de próxima prova, tabs (Guia, Cronograma, Podcasts, Resumos, Provas Antigas, Simulados), sidebar com "chance de aprovação", datas importantes e critérios de nota |
| `/calendar` | `calendar.tsx` | Calendário mensal navegável com eventos de `events.ts` |
| `/materials` | `materials.tsx` | Lista de materiais com busca/filtro (upload e exclusão são simulados) |
| `/community` | `community/index.tsx` | Salas de chat por disciplina |
| `/community/chat` | `community/chat.tsx` | Chat da sala — **mock**: mensagens só existem na sessão, não persistem nem são multiusuário |
| `/settings` | `settings.tsx` | Perfil (persiste em `localStorage`) e preferências de notificação |

---

## Camada de dados (`src/data/`)

Tudo é mockado localmente (sem banco). Arquivos principais:

- **`disciplines.ts`** — 7 disciplinas. 3 completas (`metodosDeterministicos`,
  `historiaPensamentoAdm`, `contabilidadeGeral`) e 4 pendentes
  (`fundamentosFinancas`, `teoriaGeralAdm`, `matematicaFinanceira`, `metodologiaTC`).
  Cada disciplina tem `aulas`, `avaliacoes`, `progresso` (0-100), `formulaNota`, `icone`.
  Exporta `disciplinas`, `disciplinasCompletas`, `disciplinasPendentes`.
- **`events.ts`** — ~30 eventos do semestre (AD1/AD2, AP1/AP2/AP3, inaugurais, ENADE…).
  Helpers: `getProximosEventos(dias)`, `getEventosUrgentes()`, `getEventosPorDisciplina/Tipo/Mes`.
- **`studyPlan.ts`** — rotina semanal do aluno (podcast no trânsito, vídeo no sábado,
  simulado no domingo) + semanas mapeadas. Helpers: `getTarefasPendentes()`, `getTarefasPorDia()`, `getProgressoSemana()`.
- **`materials.ts`** — `MATERIALS` (lista de arquivos por disciplina).
- **`chat.ts`** — `MOCK_CHAT_ROOMS` (salas + mensagens mockadas).
- **`calendar.ts`**, **`feed.ts`** — apoio de calendário/comunidade.

> Para integrar as 4 disciplinas pendentes faltam: cronograma 2026-2 (datas de ADs/APs),
> guia da disciplina (fórmula de nota) e caderno didático (sumário de aulas). Ver `src/data/README.md`.

---

## Paleta de cores

O projeto usa **dois sistemas de cor** (atenção ao editar — ver Pendências):

### 1. Cores de marca (hex hardcoded direto nos componentes)
| Nome | Hex | Uso |
| --- | --- | --- |
| Azul petróleo (primary) | `#0A3D52` | navbar, headers, texto principal |
| Âmbar (accent) | `#D4941E` | CTAs, destaques, barra de progresso |
| Verde (ok) | `#27AE60` | status normal / concluído |
| Vermelho (urgente) | `#E74C3C` | status urgente / alerta |
| Fundo claro | `#F5F7FA` | background de páginas internas |
| Branco | `#FFFFFF` | background do dashboard |
| Violeta | `#7C3AED` | tipo de missão "podcast" |
| Azul | `#2563EB` | tipo de missão "vídeo" |

### 2. Tokens de tema (shadcn-style, oklch) em `src/styles.css`
Mapeados via `@theme inline` para utilitários (`bg-background`, `text-foreground`,
`bg-primary`, `bg-secondary`, etc.). Valores em `:root` (light) e `.dark`.
Ex.: `--primary: oklch(0.32 0.05 240.5)` ≈ `#0A3D52`; `--secondary: oklch(0.68 0.15 75.5)` ≈ `#D4941E`.
Alguns arquivos base (`__root.tsx`) usam esses tokens; a maioria das telas usa o hex direto.

---

## Datas críticas (AP1 — semestre 2026-2)

Estas datas vêm de `events.ts` e alimentam o countdown do dashboard e os alertas:

| Data | Prova | Conteúdo |
| --- | --- | --- |
| **05/09 (sáb)** | AP1 Métodos Determinísticos I | Aulas 1-8 + pp.144-145 |
| **06/09 (dom)** | AP1 História do Pensamento Adm. II | Aulas 11-20 |
| **13/09 (dom)** | AP1 Contabilidade Geral I | Lições 1-5 (prática) |

> ⚠️ As datas em `events.ts` são fixas de 2026. Se o semestre mudar, atualize `events.ts`.

---

## Pendências / não implementado

1. **Sem backend / autenticação** — nenhum Supabase ou auth; tudo é mock/local.
2. **Chat da comunidade** — `MOCK_CHAT_ROOMS`; `handleSend` só adiciona à sessão (não persiste, não é real-time/multiusuário).
3. **"Probabilidade de aprovação" (65%)** — valor hardcoded em `disciplines.$id.tsx` (linha ~331); não é calculado.
4. **Progresso das disciplinas** — campo `progresso` hardcoded em `disciplines.ts`; não reflete conclusão real das aulas.
5. **Podcasts e Resumos** — telas em empty state, sem dados.
6. **Simulados** — botão "Iniciar Simulado" é placeholder (não abre nada).
7. **Materiais** — upload/exclusão são simulados (toast); não persistem arquivos.
8. **Missões do dia** — conclusão não persiste entre sessões (sugerido `useLocalStorage`, ainda não aplicado no dashboard).
9. **4 disciplinas pendentes** com dados incompletos (ver camada de dados).
10. **Duplo sistema de cores** (hex hardcoded vs tokens shadcn) — inconsistência a unificar.
11. **Aviso de `vite-tsconfig-paths`** — migrar para `resolve.tsconfigPaths` nativo do Vite 8.

---

## Regras de sincronização (Lovable ⇄ Git)

Este repo está **conectado ao Lovable**. Regras obrigatórias para não quebrar o histórico:

- ✅ Edição no Lovable → commit automático no `main` → `git pull` traz pra cá.
- ✅ Edição local → `git add` + `commit` + `push` → aparece no Lovable.
- ❌ **Nunca** `git push --force`, `rebase`, `amend` ou `squash` de commits já enviados.
- ⚠️ Não edite o mesmo arquivo nos dois lados ao mesmo tempo (risco de conflito).
- ⚠️ Mantenha o `main` em estado funcional (build ok) — o Lovable reflete o que está no branch.

Fluxo seguro recomendado: **`git pull` → editar → `git add / commit / push`**.

---

## Deploy

- **Pelo Lovable**: publica em `*.lovable.app` e aceita domínio próprio (plano pago).
  Como o repo é a fonte de verdade, qualquer push (Lovable ou local) reimplanta sozinho.
- **Alternativo (Netlify/Vercel)**: o TanStack Start roda com Nitro; basta apontar pro
  mesmo repo/branch `main`. Dois deploys acompanhando `main` ficam consistentes.

---

*Curso: Administração · Instituição: UFRRJ/CEDERJ · Semestre: 2026-2 · Gerado com Lovable.*
