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

# Instruções para assistentes de código

Leia o `README.md` primeiro: ele documenta o produto, as rotas, a camada de dados e as
regras de negócio do **Rota da Formatura** (dashboard acadêmico CEDERJ, semestre 2026-2).

## Regras rápidas

1. **Stack fixa**: TanStack Start v1 + TanStack Router file-based + Tailwind v4 + shadcn/ui.
   Não instalar `react-router-dom`, não criar `src/pages`, `App.tsx` ou `entry-*.tsx`.
2. **Não editar** `src/routeTree.gen.ts` (gerado).
3. **Dados** ficam em `src/data/*.ts`, tipados em português (`nome`, `icone`, `progresso`,
   `avaliacoes`, `dataInicio`). Confira o nome do campo antes de usar no componente.
4. **Manter as 7 disciplinas**, inclusive os placeholders "Aguardando dados".
5. **Datas sempre dinâmicas** com `date-fns` a partir de `new Date()`; nunca strings fixas
   tipo "5 dias".
6. **Backend**: será **Supabase externo**. Não habilitar Lovable Cloud, não criar migrações
   aqui sem o dono pedir.
7. **Visual**: azul petróleo `#0A3D52`, âmbar `#D4941E`, fundo branco, cards `#F5F7FA`.
   Sem gradientes, sem estética futurista, sem menções a IA na interface.
8. Cada rota de conteúdo mantém seu próprio `head()` com title/description/og únicos.
9. Idioma da interface e dos textos: **português do Brasil**.

## Comandos

```sh
npm run dev     # dev server (porta 8080)
npm run build
npm run lint
npm run format
```
