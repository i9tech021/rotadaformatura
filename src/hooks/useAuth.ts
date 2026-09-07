// src/hooks/useAuth.ts
// Hook para verificar identidade do aluno. Redireciona para /login se não tiver.
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { getIdentidade, type Identidade } from "@/lib/auth";

export function useAuth(requireAuth = true) {
  const navigate = useNavigate();
  const [identidade, setIdentidade] = useState<Identidade | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const ident = getIdentidade();
    setIdentidade(ident);
    setCarregando(false);

    if (requireAuth && !ident) {
      // Use navigate with fromRoute to avoid type issues
      window.location.href = "/login";
    }
  }, [navigate, requireAuth]);

  return { identidade, carregando, autenticado: identidade !== null };
}
