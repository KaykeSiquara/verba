import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderApp } from "./render";

const heading = (name: string | RegExp) => screen.findByRole("heading", { level: 1, name });

describe("sign in", () => {
  it("sends a signed-out visitor to the login page", async () => {
    renderApp("/documents", { signedIn: false });
    expect(await heading("Entrar no Verba")).toBeInTheDocument();
  });

  it("explains invalid fields next to them and focuses the first one", async () => {
    const user = userEvent.setup();
    renderApp("/login", { signedIn: false });
    await user.type(await screen.findByLabelText("E-mail"), "marina");
    await user.click(screen.getByRole("button", { name: "Entrar" }));
    const email = screen.getByLabelText("E-mail");
    expect(email).toHaveAttribute("aria-invalid", "true");
    expect(email).toHaveAccessibleDescription(/e-mail válido/);
    expect(email).toHaveFocus();
    expect(screen.getByLabelText("Senha")).toHaveAccessibleDescription(/6 caracteres/);
  });

  it("returns to the page the visitor asked for", async () => {
    const user = userEvent.setup();
    renderApp("/team", { signedIn: false });
    await user.click(await screen.findByRole("button", { name: "Usar conta de demonstração" }));
    expect(await heading("Equipe")).toBeInTheDocument();
  });
});

describe("overview", () => {
  it("shows the four indicators", async () => {
    renderApp("/");
    expect(await heading("Visão geral")).toBeInTheDocument();
    for (const label of ["Pago este mês", "Aguardando aprovação", "Glosado em 30 dias", "Vencem em 7 dias"]) expect(await screen.findByText(label)).toBeInTheDocument();
  });

  it("offers a retry when the network fails", async () => {
    renderApp("/", { prefs: { simulateErrors: true } });
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Não foi possível carregar");
    expect(within(alert).getByRole("button", { name: "Tentar de novo" })).toBeInTheDocument();
  });
});

describe("documents", () => {
  const table = async () => screen.findByRole("table", { name: /Documentos, ordenados/ });

  it("sorts by a column and says so with aria-sort", async () => {
    const user = userEvent.setup();
    renderApp("/documents");
    await table();
    const header = () => screen.getByRole("columnheader", { name: /Valor/ });
    expect(header()).not.toHaveAttribute("aria-sort");
    await user.click(within(header()).getByRole("button"));
    await waitFor(() => expect(header()).toHaveAttribute("aria-sort", "ascending"));
    await user.click(within(header()).getByRole("button"));
    await waitFor(() => expect(header()).toHaveAttribute("aria-sort", "descending"));
    expect(await table()).toHaveAccessibleName("Documentos, ordenados por Valor");
  });

  it("filters by state", async () => {
    const user = userEvent.setup();
    renderApp("/documents");
    await table();
    await user.click(screen.getByRole("button", { name: "Glosado", pressed: false }));
    await waitFor(() => {
      const states = within(screen.getByRole("table")).getAllByRole("row").slice(1).map((r) => r.lastElementChild?.textContent);
      expect(states.length).toBeGreaterThan(0);
      expect(states.every((s) => s?.includes("Glosado"))).toBe(true);
    });
  });

  it("approves selected documents after confirmation", async () => {
    const user = userEvent.setup();
    renderApp("/documents?status=pending");
    const t = await table();
    const [first] = within(t).getAllByRole("checkbox", { name: /^Selecionar (NF|REC|RPA) / });
    await user.click(first);
    const bar = screen.getByRole("region", { name: "1 selecionados" });
    await user.click(within(bar).getByRole("button", { name: "Aprovar" }));
    const dialog = await screen.findByRole("dialog", { name: "Aprovar 1 documento(s)?" });
    await user.click(within(dialog).getByRole("button", { name: "Aprovar" }));
    expect(await screen.findByText("1 documento(s) aprovado(s).")).toBeInTheDocument();
  });

  it("will not reject without a reason", async () => {
    const user = userEvent.setup();
    renderApp("/documents?status=pending");
    const t = await table();
    await user.click(within(t).getAllByRole("checkbox", { name: /^Selecionar (NF|REC|RPA) / })[0]);
    await user.click(within(screen.getByRole("region", { name: "1 selecionados" })).getByRole("button", { name: "Glosar" }));
    const dialog = await screen.findByRole("dialog", { name: "Glosar 1 documento(s)?" });
    await user.click(within(dialog).getByRole("button", { name: "Glosar" }));
    const reason = within(dialog).getByLabelText("Motivo da glosa");
    expect(reason).toHaveAccessibleDescription(/pelo menos 10 caracteres/);
    await user.type(reason, "Nota fiscal sem o CNPJ do fornecedor.");
    await user.click(within(dialog).getByRole("button", { name: "Glosar" }));
    expect(await screen.findByText("1 documento(s) glosado(s).")).toBeInTheDocument();
  });

  it("opens a document with its history", async () => {
    const user = userEvent.setup();
    renderApp("/documents");
    const t = await table();
    const open = within(t).getAllByRole("button", { name: /^Abrir / })[0];
    const number = open.textContent!;
    await user.click(open);
    const sheet = await screen.findByRole("dialog", { name: number });
    expect(within(sheet).getByRole("heading", { name: "Histórico" })).toBeInTheDocument();
  });
});

describe("command palette", () => {
  it("opens with Ctrl+K, keeps focus in the field and navigates on Enter", async () => {
    const user = userEvent.setup();
    renderApp("/");
    await heading("Visão geral");
    await user.keyboard("{Control>}k{/Control}");
    const box = await screen.findByRole("combobox", { name: "Buscar ou ir para" });
    expect(box).toHaveFocus();
    await user.type(box, "equi");
    const option = screen.getByRole("option", { name: /Equipe/ });
    expect(box).toHaveAttribute("aria-activedescendant", option.id);
    await user.keyboard("{ArrowDown}");
    expect(box).toHaveFocus();
    await user.keyboard("{Home}{Enter}");
    expect(await heading("Equipe")).toBeInTheDocument();
  });
});

describe("preferences", () => {
  it("switches the whole interface to English", async () => {
    const user = userEvent.setup();
    renderApp("/");
    await heading("Visão geral");
    await user.click(screen.getByRole("button", { name: "Switch to English" }));
    expect(await heading("Overview")).toBeInTheDocument();
    expect(document.documentElement.lang).toBe("en");
  });

  it("saves the profile and announces it", async () => {
    const user = userEvent.setup();
    renderApp("/settings");
    const name = await screen.findByLabelText("Nome");
    await user.clear(name);
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));
    expect(name).toHaveAccessibleDescription("O nome não pode ficar vazio.");
    await user.type(name, "Marina Duarte Silva");
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));
    expect(await screen.findByText("Alterações salvas.")).toBeInTheDocument();
  });
});

describe("team", () => {
  it("validates an invitation and catches a duplicate email", async () => {
    const user = userEvent.setup();
    renderApp("/team");
    await user.click(await screen.findByRole("button", { name: "Convidar pessoa" }));
    const dialog = await screen.findByRole("dialog", { name: "Convidar para a equipe" });
    await user.click(within(dialog).getByRole("button", { name: "Convidar pessoa" }));
    expect(within(dialog).getByLabelText("Nome")).toHaveAccessibleDescription("Digite o nome da pessoa.");
    await user.type(within(dialog).getByLabelText("Nome"), "Rita Almeida");
    await user.type(within(dialog).getByLabelText("E-mail"), "rita@semear.example");
    await user.click(within(dialog).getByRole("button", { name: "Convidar pessoa" }));
    expect(await within(dialog).findByText("Já existe alguém na equipe com esse e-mail.")).toBeInTheDocument();
    await user.clear(within(dialog).getByLabelText("E-mail"));
    await user.type(within(dialog).getByLabelText("E-mail"), "rita.nova@semear.example");
    await user.click(within(dialog).getByRole("button", { name: "Convidar pessoa" }));
    expect(await screen.findByText("Convite enviado para rita.nova@semear.example.")).toBeInTheDocument();
  });
});
