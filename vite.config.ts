// O pacote @lovable.dev/vite-tanstack-config já inclui — NÃO adicionar manualmente
// ou o app quebra com plugins duplicados:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            // Split vendor code into separate chunks for better caching
            if (id.includes("node_modules")) {
              // React core - rarely changes
              if (id.includes("react-dom") || id.includes("react/")) {
                return "vendor-react";
              }
              // TanStack Router - large but shared across routes
              if (id.includes("@tanstack/react-router") || id.includes("@tanstack/router")) {
                return "vendor-router";
              }
              // Supabase - only needed when DB is configured
              if (id.includes("@supabase")) {
                return "vendor-supabase";
              }
              // UI components (Radix)
              if (id.includes("@radix-ui")) {
                return "vendor-ui";
              }
              // date-fns - heavy date library
              if (id.includes("date-fns")) {
                return "vendor-dates";
              }
            }
          },
        },
      },
    },
  },
});
