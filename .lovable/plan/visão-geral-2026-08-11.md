## Visão Geral
Transformar a "Rota da Formatura" de um planner individual em uma plataforma social acadêmica colaborativa para alunos do CEDERJ.

## Funcionalidades Propostas

### 1. Comunidade & Social
- **Feed da Formatura**: Um mural de atualizações onde alunos podem postar dúvidas, conquistas (ex: "Passei na AP1 de Métodos!") e compartilhar materiais.
- **Chat por Disciplina**: Salas de chat em tempo real específicas para cada matéria, facilitando o estudo em grupo.
- **Ranking de Engajamento**: Gamificação com medalhas (ex: "Mentor de Métodos", "Explorador de Materiais") baseadas na ajuda dada a outros alunos.

### 2. Ferramentas de Produtividade
- **Calculadora de Notas Dinâmica**: Onde o aluno simula quanto precisa tirar na AP2 ou AP3 baseando-se na fórmula específica da matéria do CEDERJ.
- **Mural de Avisos do Polo**: Feed segmentado por polo regional do aluno.
- **Integração com Agenda Externa**: Botão para exportar cronograma completo para Google Calendar/Outlook em um clique.

### 3. Melhorias na Experiência (UX)
- **Modo Foco**: Interface minimalista com timer Pomodoro integrada à página da disciplina.
- **Dashboards Comparativos**: Ver a média de progresso da turma (anônima) comparada à sua.

## Implementação Técnica (Fase 1)
- Criar `src/routes/community/index.tsx` para o Feed.
- Criar `src/routes/community/chat.tsx` para as salas de aula virtuais.
- Simular dados em tempo real usando `localStorage` e eventos customizados.