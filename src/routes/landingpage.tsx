import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "@/components/LandingPage";

export const Route = createFileRoute("/landingpage")({
  component: LandingPage,
  head: () => ({
    title: "Rota da Formatura | Landing Page",
    meta: [
      {
        name: "description",
        content:
          "Dashboard acadêmico gratuito para alunos do CEDERJ. Cronograma, simulados com IA, podcasts, calculadora de média e ranking.",
      },
      { property: "og:title", content: "Rota da Formatura - CEDERJ" },
      {
        property: "og:description",
        content:
          "Dashboard acadêmico gratuito para alunos do CEDERJ. Cronograma, simulados com IA, podcasts, calculadora de média e ranking.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});
