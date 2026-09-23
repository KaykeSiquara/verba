import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";
import { AppProviders, makeQueryClient, routes } from "./App";
import "./styles.css";

const router = createBrowserRouter(routes);
const client = makeQueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppProviders client={client}><RouterProvider router={router} /></AppProviders>
  </StrictMode>,
);
