import * as Dialog from "@radix-ui/react-dialog";
import * as Menu from "@radix-ui/react-dropdown-menu";
import * as Popover from "@radix-ui/react-popover";
import { Bell, Check, FileText, FolderKanban, LayoutDashboard, Menu as MenuIcon, Monitor, Moon, Search, Settings, Sun, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router";
import { useOverview, useProfile } from "../api/hooks";
import { dueBand } from "../api/query";
import { ORG } from "../api/seed";
import { DueDate } from "../components/ui/Badges";
import { Button } from "../components/ui/Button";
import { cn } from "../lib/cn";
import { useAuth } from "./auth";
import { CommandPalette } from "./CommandPalette";
import { usePrefs, type ThemeMode } from "./prefs";

const menuItem = "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-surface-2";
const menuPanel = "z-50 min-w-44 rounded-lg border border-border bg-surface p-1 shadow-lg";

function Logo() {
  return <svg viewBox="0 0 32 32" className="size-7" aria-hidden="true"><rect width="32" height="32" rx="8" className="fill-accent" /><path d="M9 10l7 13 7-13" fill="none" className="stroke-accent-fg" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function Sidebar() {
  const { t } = usePrefs();
  const links = [
    { to: "/", label: t("nav.overview"), icon: LayoutDashboard, end: true },
    { to: "/documents", label: t("nav.documents"), icon: FileText },
    { to: "/programs", label: t("nav.programs"), icon: FolderKanban },
    { to: "/team", label: t("nav.team"), icon: Users },
    { to: "/settings", label: t("nav.settings"), icon: Settings },
  ];
  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <Link to="/" className="flex items-center gap-2.5 rounded-lg px-2 py-1">
        <Logo />
        <span className="leading-tight"><span className="block font-semibold">Verba</span><span className="block text-xs text-fg-muted">{ORG}</span></span>
      </Link>
      <nav aria-label={t("app.mainNav")}>
        <ul className="flex flex-col gap-1">
          {links.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink to={to} end={end} className={({ isActive }) => cn("flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium", isActive ? "bg-accent-soft text-fg" : "text-fg-muted hover:bg-surface-2 hover:text-fg")}>
                <Icon className="size-4" aria-hidden="true" />{label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <p className="mt-auto rounded-lg bg-surface-2 p-3 text-xs text-fg-muted">{t("app.demo")}</p>
    </div>
  );
}

function Notifications() {
  const { t } = usePrefs();
  const { data } = useOverview(6);
  const due = data?.dueSoon ?? [];
  const now = new Date();
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <Button variant="ghost" size="sm" aria-label={t("notify.open", { n: due.length })} className="relative">
          <Bell className="size-4" aria-hidden="true" />
          {due.length > 0 && <span aria-hidden="true" className="absolute -top-0.5 -right-0.5 grid min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] leading-4 text-accent-fg">{due.length}</span>}
        </Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content align="end" sideOffset={8} className="z-50 w-80 rounded-xl border border-border bg-surface p-2 shadow-xl">
          <p className="px-2 py-1.5 text-sm font-semibold">{t("notify.title")}</p>
          {due.length ? (
            <ul>{due.map((d) => (
              <li key={d.id}><Popover.Close asChild><Link to={`/documents?doc=${d.id}`} className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 text-sm hover:bg-surface-2">
                <span className="min-w-0"><span className="block font-medium">{d.number}</span><span className="block truncate text-xs text-fg-muted">{d.supplier}</span></span>
                <DueDate iso={d.dueAt} band={dueBand(d.dueAt, now)} />
              </Link></Popover.Close></li>
            ))}</ul>
          ) : <p className="px-2 py-4 text-sm text-fg-muted">{t("notify.empty")}</p>}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function Topbar({ onMenu, onSearch }: { onMenu: () => void; onSearch: () => void }) {
  const { t, theme, set, lang, isDark } = usePrefs();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const profile = useProfile();
  const name = profile.data?.name ?? "";
  const initials = name.split(" ").map((p) => p[0]).slice(0, 2).join("");
  const mac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
  const themes: [ThemeMode, string, typeof Sun][] = [["light", t("app.light"), Sun], ["dark", t("app.dark"), Moon], ["system", t("app.system"), Monitor]];
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-bg/85 px-3 backdrop-blur sm:px-6">
      <Button variant="ghost" size="sm" className="lg:hidden" aria-label={t("app.openMenu")} onClick={onMenu}><MenuIcon className="size-5" aria-hidden="true" /></Button>
      <button type="button" onClick={onSearch} className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm text-fg-muted hover:border-border-strong sm:max-w-sm">
        <Search className="size-4 shrink-0" aria-hidden="true" /><span className="truncate">{t("app.search")}</span>
        <kbd className="ml-auto hidden rounded border border-border px-1.5 font-mono text-[11px] sm:inline" aria-label={mac ? "Command K" : "Control K"}>{mac ? "⌘K" : "Ctrl K"}</kbd>
      </button>
      <div className="ml-auto flex items-center gap-1">
        <Notifications />
        <Button variant="ghost" size="sm" onClick={() => set({ lang: lang === "en" ? "pt-BR" : "en" })} aria-label={t("palette.switchLanguage")} lang={lang === "en" ? "pt-BR" : "en"}>{lang === "en" ? "PT" : "EN"}</Button>
        <Menu.Root>
          <Menu.Trigger asChild><Button variant="ghost" size="sm" aria-label={t("app.theme")}>{isDark ? <Moon className="size-4" aria-hidden="true" /> : <Sun className="size-4" aria-hidden="true" />}</Button></Menu.Trigger>
          <Menu.Portal><Menu.Content align="end" sideOffset={8} className={menuPanel}>
            <Menu.RadioGroup value={theme} onValueChange={(v) => set({ theme: v as ThemeMode })}>
              {themes.map(([v, label, Icon]) => (
                <Menu.RadioItem key={v} value={v} className={menuItem}><Icon className="size-4" aria-hidden="true" />{label}<Menu.ItemIndicator className="ml-auto"><Check className="size-4" aria-hidden="true" /></Menu.ItemIndicator></Menu.RadioItem>
              ))}
            </Menu.RadioGroup>
          </Menu.Content></Menu.Portal>
        </Menu.Root>
        <Menu.Root>
          <Menu.Trigger asChild>
            <button type="button" aria-label={t("app.account", { name })} className="ml-1 grid size-8 place-items-center rounded-full bg-accent text-xs font-semibold text-accent-fg">{initials}</button>
          </Menu.Trigger>
          <Menu.Portal><Menu.Content align="end" sideOffset={8} className={menuPanel}>
            <Menu.Label className="px-2 py-1.5 text-xs text-fg-muted">{profile.data?.email}</Menu.Label>
            <Menu.Item className={menuItem} onSelect={() => navigate("/settings")}><Settings className="size-4" aria-hidden="true" />{t("nav.settings")}</Menu.Item>
            <Menu.Separator className="my-1 h-px bg-border" />
            <Menu.Item className={menuItem} onSelect={() => { signOut(); navigate("/login"); }}>{t("app.signOut")}</Menu.Item>
          </Menu.Content></Menu.Portal>
        </Menu.Root>
      </div>
    </header>
  );
}

export function AppShell() {
  const { t } = usePrefs();
  const location = useLocation();
  const [navOpen, setNavOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    setNavOpen(false);
    requestAnimationFrame(() => document.querySelector<HTMLElement>("#main h1")?.focus());
  }, [location.pathname]);
  useEffect(() => {
    const on = (e: globalThis.KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPaletteOpen((o) => !o); } };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, []);

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[15rem_minmax(0,1fr)]">
      <a href="#main" className="sr-only z-50 rounded-lg bg-accent px-4 py-2 text-accent-fg focus:not-sr-only focus:fixed focus:top-2 focus:left-2">{t("app.skip")}</a>
      <aside className="sticky top-0 hidden h-dvh border-r border-border bg-surface lg:block"><Sidebar /></aside>
      <Dialog.Root open={navOpen} onOpenChange={setNavOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="overlay fixed inset-0 z-40 bg-black/40 lg:hidden" />
          <Dialog.Content className="sheet-content fixed inset-y-0 left-0 z-50 w-72 border-r border-border bg-surface lg:hidden" aria-describedby={undefined}>
            <Dialog.Title className="sr-only">{t("app.mainNav")}</Dialog.Title>
            <Sidebar />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <div className="flex min-w-0 flex-col">
        <Topbar onMenu={() => setNavOpen(true)} onSearch={() => setPaletteOpen(true)} />
        <main id="main" tabIndex={-1} className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 outline-none sm:px-6 lg:px-8"><Outlet /></main>
      </div>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}
