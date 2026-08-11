# 📚 Rota da Formatura - Dados Reais Integrados

Este pacote contém os dados reais das disciplinas do CEDERJ (Administração, 2026-2) 
prontos para integração no projeto **Rota da Formatura**.

---

## 📁 Arquivos Gerados

### 1. `disciplines.ts`
Contém a estrutura completa de todas as 7 disciplinas.

**Disciplinas completas (3):**
- `metodosDeterministicos` — Métodos Determinísticos I (15 aulas, ~13 EPs)
- `historiaPensamentoAdm` — História do Pensamento Administrativo II (20 aulas)
- `contabilidadeGeral` — Contabilidade Geral I (14 lições)

**Disciplinas pendentes (4):**
- `fundamentosFinancas` — Fundamentos de Finanças
- `teoriaGeralAdm` — Teoria Geral da Administração I
- `matematicaFinanceira` — Matemática Financeira
- `metodologiaTC` — Metodologia do Trabalho Científico

**Exportações:**
```ts
import { disciplinas, disciplinasCompletas, disciplinasPendentes } from './disciplines';
```

---

### 2. `events.ts`
Contém todos os eventos acadêmicos do semestre (30 eventos mapeados).

**Tipos de eventos:**
- AD1, AD2 (Avaliações a Distância)
- AP1, AP2, AP3 (Avaliações Presenciais)
- AULA_INAUGURAL, JORNADA, MANUTENCAO, ENADE

**Helpers disponíveis:**
```ts
import { getEventosPorDisciplina, getEventosPorTipo, getEventosPorMes, getProximosEventos, getEventosUrgentes } from './events';

// Próximos 30 dias
const proximos = getProximosEventos(30);

// Eventos urgentes (dentro do prazo de alerta)
const urgentes = getEventosUrgentes();
```

---

### 3. `studyPlan.ts`
Plano de estudos semanal integrado com a rotina do aluno.

**Rotina definida:**
- **Segunda a Sexta (trânsito):** Podcast/áudio (30 min)
- **Sábado:** Vídeo-resumo da semana + ADs (60-120 min)
- **Domingo:** Simulado ou Prova (90-180 min)

**Semanas mapeadas:**
- Semanas 1-5 (Agosto): Conteúdo novo + ADs
- Semanas 6-7 (Setembro): Revisão AP1 + AP1 Métodos, HPA e Contab

**Helpers:**
```ts
import { getTarefasPorDia, getTarefasPendentes, getProgressoSemana } from './studyPlan';
```

---

## 🎨 Cores por Disciplina (já definidas)

| Disciplina | Cor | Código |
|---|---|---|
| Métodos Determinísticos I | 🔵 Azul | `#2563EB` |
| História do Pensamento Adm. II | 🟣 Violeta | `#7C3AED` |
| Contabilidade Geral I | 🟢 Esmeralda | `#059669` |
| Fundamentos de Finanças | 🟠 Âmbar | `#D97706` |
| Teoria Geral da Administração I | 🔵 Índigo | `#4F46E5` |
| Matemática Financeira | 🔴 Vermelho | `#DC2626` |
| Metodologia do Trabalho Científico | 🔵 Ciano | `#0891B2` |

---

## ⚠️ O que falta para completar

Para integrar as 4 disciplinas pendentes, preciso que você envie do AVA:

1. **Cronograma 2026-2** (datas de ADs e APs)
2. **Guia da Disciplina** (fórmula de nota, critérios)
3. **Caderno Didático** (sumário com títulos das aulas)

Formato: copiar e colar o texto em TXT ou enviar PDF.

---

## 🚀 Como usar no Lovable

1. Crie os arquivos em `src/data/disciplines.ts`, `src/data/events.ts`, `src/data/studyPlan.ts`
2. Importe os dados nos componentes:
```tsx
import { disciplinas } from '../data/disciplines';
import { eventos, getProximosEventos } from '../data/events';
import { todasSemanas, getTarefasPendentes } from '../data/studyPlan';
```
3. Use `useLocalStorage` para persistir o estado de `concluida` das tarefas e aulas.

---

## 📅 Próximas datas críticas (AP1)

| Data | Prova | Conteúdo |
|---|---|---|
| **05/09 (sáb)** | AP1 Métodos Det. I | Aulas 1-8 + pp.144-145 |
| **06/09 (dom)** | AP1 HPA II | Aulas 11-20 |
| **13/09 (dom)** | AP1 Contab. Geral I | Lições 1-5 (prática) |

---

*Gerado em: 11/08/2026*
*Semestre: 2026-2 | Curso: Administração | Instituição: CEDERJ*
