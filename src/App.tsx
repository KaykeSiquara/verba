import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as Tooltip from "@radix-ui/react-tooltip";
import type React from "react";
import type { ReactNode } from "react";
import type { RouteObject } from "react-router";
import { AppShell } from "./app/AppShell";
import { AuthProvider, RequireAuth } from "./app/auth";
import { PrefsProvider, type Prefs } from "./app/prefs";
import { ToastProvider } from "./components/ui/Toast";

const page = (load: () => Promise<{ default: React.ComponentType }>) => async () => ({ Component: (await load()).default });

export const routes: RouteObject[] = [
  { path: "/login", lazy: page(() => import("./pages/Login")) },
  {
    element: <RequireAuth><AppShell /></RequireAuth>,
    children: [
      { index: true, lazy: page(() => import("./pages/Overview")) },
      { path: "documents", lazy: page(() => import("./pages/Documents")) },
      { path: "programs", lazy: async () => ({ Component: (await import("./pages/Programs")).ProgramsPage }) },
      { path: "programs/:id", lazy: async () => ({ Component: (await import("./pages/Programs")).ProgramPage }) },
      { path: "team", lazy: page(() => import("./pages/Team")) },
      { path: "settings", lazy: page(() => import("./pages/Settings")) },
      { path: "*", lazy: page(() => import("./pages/NotFound")) },
    ],
  },
];

export function makeQueryClient(retry = 1) {
  return new QueryClient({ defaultOptions: { queries: { retry, staleTime: 30_000, refetchOnWindowFocus: false } } });
}

export function AppProviders({ children, client, prefs }: { children: ReactNode; client: QueryClient; prefs?: Partial<Prefs> }) {
  return (
    <QueryClientProvider client={client}>
      <PrefsProvider initial={prefs}>
        <AuthProvider>
          <Tooltip.Provider delayDuration={300}>
            <ToastProvider>{children}</ToastProvider>
          </Tooltip.Provider>
        </AuthProvider>
      </PrefsProvider>
    </QueryClientProvider>
  );
}
