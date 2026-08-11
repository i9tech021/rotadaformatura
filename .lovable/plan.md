# Rota da Formatura - Expansão Completa

## Objetivo
Expandir o dashboard acadêmico para uma plataforma completa com todas as seções principais, preparada para backend Supabase externo, sem dependências de banco de dados no código, com interface premium inspirada no CEDERJ.

## Estrutura de Rotas

```
src/routes/
  index.tsx              -> Dashboard principal (já existe)
  disciplines.tsx        -> Biblioteca de disciplinas
  disciplines.$id.tsx    -> Página individual de disciplina
  settings.tsx           -> Configurações de perfil
  calendar.tsx           -> Calendário acadêmico
  materials.tsx          -> Gerenciador de materiais
```

## Seções Principais

### 1. Dashboard (/)
- ✅ Existente, manter como está

### 2. Biblioteca de Disciplinas (/disciplines)
- Grid de todas as disciplinas do curso
- Cards com nome, carga horária, período, ícone
- Filtros: período, status, busca por nome
- Link para página individual

### 3. Página da Disciplina (/disciplines/$id)
- Header com nome, ícone, info básica
- **Calendário visual** com eventos (AD1, AD2, AP1, AP2, AP3)
- **Abas navegáveis**:
  - Guia (ementa, objetivos)
  - Cronograma (aulas, tópicos)
  - Podcasts (lista de episódios)
  - Resumos (documentos de revisão)
  - Provas Antigas (banco de questões)
  - Simulados (testes interativos)
- Checklist de aulas/atividades
- Barra de "Chance de Aprovação"
- Contagem regressiva para próxima avaliação

### 4. Configurações (/settings)
- Editar perfil (nome, curso, período)
- Gerenciar uploads de materiais (PDFs, arquivos)
- Configurar notificações (email, push)
- Botão "Baixar meus dados" (export JSON/CSV)
- Preferências de tema/idioma

### 5. Gerenciador de Materiais (/materials)
- Upload de PDFs e arquivos
- Organização por disciplina
- Preview de documentos
- Remoção e download

## Otimizações & Funcionalidades Premium

1. **Efeitos visuais**:
   - Animações suaves (Framer Motion)
   - Cards com hover effects
   - Skeleton loaders
   - Transições entre abas

2. **Interatividade**:
   - Drag-and-drop para materiais
   - Busca em tempo real
   - Filtros avançados
   - Ordenação customizável

3. **Funcionalidades**:
   - Dark mode toggle
   - Notificações toast
   - Progresso persistente em localStorage
   - Export de dados em múltiplos formatos
   - Calendário integrado

4. **UX**:
   - Breadcrumbs de navegação
   - Sidebar colapsável
   - Mobile-first responsive
   - Indicadores de progresso
   - Tooltips informativos

## Mock Data Structure (sem banco de dados)

Usar `localStorage` para persistência temporária e arquivo de configuração para dados iniciais:
- `src/data/disciplines.ts` - disciplinas e metadados
- `src/data/calendar.ts` - eventos e avaliações
- `src/data/materials.ts` - materiais educacionais mock
- `hooks/useLocalStorage.ts` - persistência local

## Estética

- Cores: Azul Petróleo (#0A3D52), Âmbar (#D4941E), Branco, Cinza Claro
- Tipografia: Inter (body), clean e legível
- Componentes: Shadcn/ui com customizações
- Visual: Premium mas acadêmico, sem futurismo excessivo

## Preparação para Backend

Todas as funcionalidades estruturadas para receber dados do Supabase:
- Server functions prontas (comentadas, não implementadas)
- Tipos TypeScript definidos
- Interface clara de dados
- Sem lógica de transformação acoplada
