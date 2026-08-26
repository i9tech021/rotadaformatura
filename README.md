# Rota da Formatura

Dashboard acadêmico para alunos do **CEDERJ / UFRRJ – Administração (semestre 2026-2)**.
O objetivo é reunir em um só lugar cronograma, avaliações (ADs e APs), materiais de estudo,
checklists de progresso e comunidade — com estética institucional (não "tech/futurista"),
inspirada no AVA do CEDERJ, porém mais polida.

> Este documento é a fonte de verdade do projeto. Se você é uma IA/assistente de código
> lendo o repositório pela primeira vez, leia até o fim antes de alterar qualquer arquivo.

---

## 1. Stack

| Camada | Tecnologia |
|---|---|
| Framework | **TanStack Start v1** (React 19, SSR, Vite 7) |
| Roteamento | **TanStack Router** file-based (`src/routes/`, `routeTree.gen.ts` é gerado) |
| Estilo | **Tailwind CSS v4** via `src/styles.css` (tokens em `@theme`, sem `tailwind.config.js`) |
| Componentes | shadcn/ui (new-york) + Radix UI em `src/components/ui/` |
| Ícones | lucide-react |
| Datas | date-fns (+ locale `ptBR`) |
| Estado/persistência | `useState` + `localStorage` (hook `src/hooks/useLocalStorage.ts`) |
| Backend | **Nenhum ainda.** Planejado: Supabase externo (NÃO usar Lovable Cloud) |

Scripts: `npm run dev` (porta 8080), `npm run build`, `npm run lint`, `npm run format`.

### Regras técnicas obrigatórias
- Nunca instalar `react-router-dom` nem criar `src/pages` / `App.tsx`. O router é o TanStack.
- Nunca editar `src/routeTree.gen.ts` à mão.
- Toda rota pai precisa renderizar `<Outlet />`.
- Lógica de servidor, quando existir, usa `createServerFn` de `@tanstack/react-start`
  (ver exemplo em `src/lib/academic.functions.ts`, hoje só mocks).
- Cada rota de conteúdo tem seu próprio `head()` com title/description/og únicos.

---

## 2. Identidade visual

Cores usadas de forma literal (hex) nos componentes acadêmicos:

| Uso | Hex |
|---|---|
| Primária (azul petróleo) | `#0A3D52` |
| Destaque / alerta (âmbar) | `#D4941E` |
| Fundo | `#FFFFFF` |
| Cards / superfícies | `#F5F7FA` |
| Sucesso | `#27AE60` |
| Perigo / urgente | `#E74C3C` |

Cores por disciplina: Métodos `#2563EB`, HPA II `#7C3AED`, Contabilidade `#059669`,
Finanças `#D97706`, TGA I `#4F46E5`, Mat. Financeira `#DC2626`, MTC `#0891B2`.

Sem gradientes, sem glassmorphism, sem termos de "IA" expostos na interface.
Tipografia clean (Inter/sans). Tom institucional, títulos em `font-black uppercase tracking-widest`.

---

## 3. Estrutura de pastas

```
src/
  routes/
    __root.tsx            Shell HTML, QueryClientProvider, 404 e error boundary
    index.tsx             Dashboard principal ("/")
    calendar.tsx          Calendário acadêmico mensal
    disciplines.tsx       Biblioteca de disciplinas (lista + busca + filtros)
    disciplines.$id.tsx   Página da disciplina (abas, countdown, checklist)
    materials.tsx         Gerenciador de materiais/uploads (mock)
    settings.tsx          Perfil, notificações, exportar dados
    community/index.tsx   Feed social
    community/chat.tsx    Salas de estudo por disciplina
  data/                   Banco de dados estático tipado (ver seção 5)
  components/
    ui/                   shadcn/ui
    academic/AcademicChecklist.tsx
  hooks/useLocalStorage.ts, use-mobile.tsx
  lib/utils.ts (cn), academic.functions.ts (server fns mock)
  styles.css              Tailwind v4 + tokens
```

---

## 4. Rotas e o que cada tela faz

### `/` — Dashboard (`src/routes/index.tsx`)
- Navbar fixa azul petróleo: menu hambúrguer (`Sheet`) no mobile, links horizontais no desktop, avatar → `/settings`.
- Saudação dinâmica (bom dia / boa tarde / boa noite).
- 3 cards de resumo: nº de disciplinas, carga total, dias até a próxima avaliação.
- **Próxima Missão Prioritária**: primeiro evento de `getProximosEventos(60)`, com countdown
  em tempo real (`formatDistanceToNow`, atualiza a cada 60 s) e botão para o chat da turma.
- **Sua Rota Hoje**: tarefas de `getTarefasPendentes()` (podcast / vídeo / simulado) com botão de conclusão.
- **Grade de disciplinas**: progresso, status (`urgent` ≤7 dias, `warning` ≤14, senão `normal`) e próxima avaliação.
- Botão flutuante de chat com "Assistente Acadêmico" (respostas simuladas).

### `/disciplines` — Biblioteca
Lista as 7 disciplinas com busca por nome, filtro por período/status e barra de progresso.

### `/disciplines/$id` — Página da disciplina
Countdown para a próxima avaliação, medidor circular de "Chance de Aprovação", calendário
da matéria e abas: **Guia, Cronograma, Podcasts, Resumos, Provas Antigas, Simulados**.

### `/calendar` — Calendário acadêmico
Mês atual por padrão (`new Date()`), marcações AD1/AD2/AP1/AP2/AP3, lista lateral de próximos
eventos e exportação para Google Calendar.

### `/materials` — Materiais
Upload simulado (drag & drop), organização por disciplina e categoria.

### `/settings` — Configurações
Perfil (nome, curso, período), toggles de notificação e botão "Baixar meus dados" (export JSON).

### `/community` e `/community/chat`
Feed de posts (dúvidas, conquistas, likes e comentários) e salas de chat por disciplina.
Tudo mock/local — sem realtime real ainda.

---

## 5. Camada de dados (`src/data/`)

Toda a informação acadêmica é **estática e tipada**, pronta para virar tabelas do Supabase.

### `disciplines.ts`
`Disciplina { id, nome, codigo, cor, icone, progresso, period?, ch?, aulas: Aula[], avaliacoes: Avaliacao[], guia, formulaNota }`

- Completas: `metodosDeterministicos`, `historiaPensamentoAdm`, `contabilidadeGeral`.
- Placeholders aguardando material do AVA (mantê-los!): `fundamentosFinancas`, `teoriaGeralAdm`,
  `matematicaFinanceira`, `metodologiaTC`.
- Exports: `disciplinas` (as 7), `disciplinasCompletas`, `disciplinasPendentes`.

### `events.ts`
`EventoAcademico { id, titulo, disciplinaId, disciplinaNome, disciplinaCodigo, disciplinaCor,
tipo: 'AD1'|'AD2'|'AP1'|'AP2'|'AP3'|'AULA_INAUGURAL'|'JORNADA'|'MANUTENCAO'|'ENADE'|'REVISAO',
dataInicio, dataFim?, horario?, local?, conteudo, peso?, observacoes?, alertaDias }`

Helpers: `getEventosPorDisciplina`, `getEventosPorTipo`, `getEventosPorMes`,
`getProximosEventos(dias)`, `getEventosUrgentes()`.
Campo canônico de data = **`dataInicio`** (ISO `YYYY-MM-DD`).

### `studyPlan.ts`
Rotina real do aluno: seg–sex podcast 30 min (trânsito), sábado vídeo-resumo + ADs,
domingo simulado/prova. Helpers `getTarefasPorDia`, `getTarefasPendentes`, `getProgressoSemana`.

### Outros
`calendar.ts` (`CALENDAR_EVENTS`, legado), `materials.ts`, `feed.ts`, `chat.ts` — mocks de UI.

### Convenção de nomes — atenção
Os dados reais usam **português** (`nome`, `icone`, `progresso`, `avaliacoes`, `dataInicio`).
Mocks antigos usavam inglês (`name`, `icon`, `progress`). Ao mexer em componentes, confira o
nome do campo — essa foi a maior fonte de bugs do projeto.

---

## 6. Datas críticas do semestre 2026-2

| Data | Evento |
|---|---|
| 16/08 | AD1 HPA II (prazo final) |
| 19/08 | AD1 Métodos Q1+Q2 |
| 23/08 | AD1 Contabilidade Geral I |
| 05/09 09:30 | **AP1 Métodos Determinísticos I** |
| 06/09 13:30 | **AP1 HPA II** |
| 13/09 09:30 | **AP1 Contabilidade Geral I** |
| 17/10 · 18/10 · 01/11 | AP2 Métodos · HPA II · Contabilidade |
| 21/11 · 22/11 | AP3 (recuperação) |
| 29/11 | ENADE 2026 |

Todos os prazos na UI são calculados em tempo real a partir de `new Date()` — nada hardcoded.

---

## 7. Estado atual e próximos passos

**Pronto:** todas as telas acima, navegação mobile/desktop, dados reais das 3 disciplinas,
contagens regressivas dinâmicas, exportação de dados, feed e chat mockados.

**Falta:**
1. Material do AVA das 4 disciplinas pendentes (cronograma, guia, sumário do caderno).
2. Backend **Supabase externo** (cliente próprio em `src/integrations/`, não Lovable Cloud):
   auth, tabelas `disciplinas`, `eventos`, `progresso`, `materiais`, `posts`, `mensagens` com RLS.
3. Realtime no feed e no chat.
4. Calculadora de notas usando `formulaNota` de cada disciplina.
5. Upload real de arquivos (Storage) e notificações.

---

## 8. Regras de produto (não quebrar)

- Sempre manter as **7 disciplinas** visíveis, mesmo as sem conteúdo ("Aguardando dados").
- Nada de linguagem de IA/robô na interface; o chat é "Assistente Acadêmico".
- Não migrar para Lovable Cloud — o backend será Supabase externo, definido pelo dono do projeto.
- Manter a paleta e o tom institucional descritos na seção 2.
