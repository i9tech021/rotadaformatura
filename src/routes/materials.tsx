// src/routes/materials.tsx
// Layout da seção Materiais — repassa para rotas filhas via <Outlet />.
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/materials")({
  component: MaterialsLayout,
});

function MaterialsLayout() {
  return <Outlet />;
}
