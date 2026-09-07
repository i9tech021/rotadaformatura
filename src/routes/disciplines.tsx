// src/routes/disciplines.tsx
// Layout da seção Disciplinas — apenas repassa para as rotas filhas
// (índice = lista, $id = detalhe da disciplina) via <Outlet />.
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/disciplines")({
  component: DisciplinesLayout,
});

function DisciplinesLayout() {
  return <Outlet />;
}
