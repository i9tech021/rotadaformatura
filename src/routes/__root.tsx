import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
  useMatches,
} from "@tanstack/react-router";
import { type ReactNode, useEffect, useState, Suspense, lazy } from "react";
import { temIdentidade } from "@/lib/auth";
import { track } from "@/lib/metricas";
import { Toaster } from "@/components/ui/sonner";
import { iniciarPresenca, atualizarRotaPresenca } from "@/lib/presenca";

import appCss from "../styles.css?url";

// Lazy load heavy components that aren't needed on initial render
const MiniPlayerGlobal = lazy(() =>
  import("@/components/MiniPlayerGlobal").then((m) => ({ default: m.MiniPlayerGlobal }))
);
const PomodoroTimer = lazy(() =>
  import("@/components/PomodoroTimer").then((m) => ({ default: m.PomodoroTimer }))
);

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Rota da Formatura - CEDERJ | Organização de estudos para a graduação CEDERJ" },
      {
        name: "description",
        content:
          "Organize seus estudos da graduação CEDERJ. Cronograma, podcasts, simulados e calculadora de média em um só lugar. Gratuito para a turma.",
      },
      { name: "author", content: "Rota da Formatura - CEDERJ" },
      { name: "theme-color", content: "#0A3D52" },
      { property: "og:title", content: "Rota da Formatura" },
      {
        property: "og:description",
        content:
          "Organize seus estudos da graduação CEDERJ. Cronograma, podcasts, simulados e calculadora de média em um só lugar. Gratuito para a turma.",
      },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "pt_BR" },
      { property: "og:site_name", content: "Rota da Formatura" },
      {
        property: "og:image",
        content: "https://rotadaformatura.vercel.app/og-cover.png",
      },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "Rota da Formatura: organização de estudos para a graduação CEDERJ" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Rota da Formatura" },
      {
        name: "twitter:description",
        content:
          "Organize seus estudos da graduação CEDERJ. Cronograma, podcasts, simulados e calculadora de média em um só lugar.",
      },
      {
        name: "twitter:image",
        content: "https://rotadaformatura.vercel.app/og-cover.png",
      },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      // Resource hints for faster third-party connections
      { rel: "preconnect", href: "https://pboacygsibfjivrdejcp.supabase.co" },
      { rel: "preconnect", href: "https://openrouter.ai" },
      { rel: "dns-prefetch", href: "https://pboacygsibfjivrdejcp.supabase.co" },
      { rel: "dns-prefetch", href: "https://openrouter.ai" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('rdf:theme');
                  if (!theme) {
                    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  }
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const matches = useMatches();
  const [checked, setChecked] = useState(false);

  const pathname = matches[matches.length - 1]?.pathname ?? "/";
  // Rotas públicas (links compartilháveis abrem sem login)
  const isLoginPage = matches.some((m) => m.pathname === "/login");
  const isRotaPublica =
    pathname === "/landingpage" || pathname === "/podcasts" || /^\/disciplines\/[^/]+\/podcast$/.test(pathname);

  // Auth guard: redireciona para /login se não tiver identidade
  useEffect(() => {
    if (!isLoginPage && !isRotaPublica && !temIdentidade()) {
      window.location.href = "/login";
      return;
    }
    setChecked(true);
  }, [matches, isLoginPage, isRotaPublica]);

  // Telemetria: pageview a cada troca de rota (fire-and-forget)
  useEffect(() => {
    track("pageview", { rota: pathname });
    atualizarRotaPresenca(pathname);
  }, [pathname]);

  // Presença online (Realtime) — uma vez por sessão
  useEffect(() => {
    const parar = iniciarPresenca();
    return parar;
  }, []);

  // Aguarda verificação antes de renderizar
  if (!isLoginPage && !isRotaPublica && !checked) return null;

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
      {/* Avisos globais (toast) — sem isso nenhum toast aparece no app */}
      <Toaster position="top-center" richColors closeButton />
      {/* Player de áudio global — continua tocando entre páginas (lazy loaded) */}
      <Suspense fallback={null}>
        <MiniPlayerGlobal />
      </Suspense>
      {/* Timer Pomodoro — disponível em todas as páginas (lazy loaded) */}
      <Suspense fallback={null}>
        <PomodoroTimer />
      </Suspense>
    </QueryClientProvider>
  );
}
