import { render } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { AppProviders, makeQueryClient, routes } from "../App";
import type { Prefs } from "../app/prefs";

export function renderApp(path = "/", { signedIn = true, prefs = {} }: { signedIn?: boolean; prefs?: Partial<Prefs> } = {}) {
  if (signedIn) localStorage.setItem("verba:session", JSON.stringify({ email: "marina@semear.example" }));
  else localStorage.setItem("verba:signed-out", "1");
  localStorage.setItem("verba:prefs", JSON.stringify({ lang: "pt-BR", theme: "light", ...prefs }));
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  return { router, ...render(<AppProviders client={makeQueryClient(0)}><RouterProvider router={router} /></AppProviders>) };
}
