import * as Dialog from "@radix-ui/react-dialog";
import { useQuery } from "@tanstack/react-query";
import { FileText, FolderKanban, LayoutDashboard, Languages, LogOut, Moon, Search, Settings, Users } from "lucide-react";
import { useEffect, useId, useMemo, useState, type KeyboardEvent, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { api } from "../api/client";
import { usePrograms } from "../api/hooks";
import type { Key } from "../i18n/pt";
import { cn } from "../lib/cn";
import { useAuth } from "./auth";
import { usePrefs } from "./prefs";

type Group = "pages" | "actions" | "programs" | "documents";
type Item = { id: string; group: Group; label: string; hint?: string; icon: ReactNode; run: () => void };
const fold = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const ico = "size-4 shrink-0 text-fg-muted";

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { t, set, lang, isDark, money } = usePrefs();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const listId = useId();
  const programs = usePrograms();
  const term = q.trim();
  const docs = useQuery({ queryKey: ["palette", term], queryFn: () => api.documents({ q: term, pageSize: 5 }), enabled: open && term.length >= 2 });

  const items = useMemo<Item[]>(() => {
    const pages: [Key, string, ReactNode][] = [
      ["nav.overview", "/", <LayoutDashboard className={ico} aria-hidden="true" />], ["nav.documents", "/documents", <FileText className={ico} aria-hidden="true" />],
      ["nav.programs", "/programs", <FolderKanban className={ico} aria-hidden="true" />], ["nav.team", "/team", <Users className={ico} aria-hidden="true" />],
      ["nav.settings", "/settings", <Settings className={ico} aria-hidden="true" />],
    ];
    const all: Item[] = [
      ...pages.map(([k, to, icon]) => ({ id: `page-${to}`, group: "pages" as const, label: t(k), icon, run: () => navigate(to) })),
      { id: "act-theme", group: "actions", label: t("palette.toggleTheme"), icon: <Moon className={ico} aria-hidden="true" />, run: () => set({ theme: isDark ? "light" : "dark" }) },
      { id: "act-lang", group: "actions", label: t("palette.switchLanguage"), icon: <Languages className={ico} aria-hidden="true" />, run: () => set({ lang: lang === "en" ? "pt-BR" : "en" }) },
      { id: "act-out", group: "actions", label: t("app.signOut"), icon: <LogOut className={ico} aria-hidden="true" />, run: () => { signOut(); navigate("/login"); } },
      ...(programs.data ?? []).map((p) => ({ id: `prog-${p.id}`, group: "programs" as const, label: p.name, hint: p.manager, icon: <FolderKanban className={ico} aria-hidden="true" />, run: () => navigate(`/programs/${p.id}`) })),
    ];
    const f = fold(term);
    const local = f ? all.filter((i) => fold(i.label).includes(f)) : all.filter((i) => i.group !== "programs");
    const found = term.length >= 2 ? (docs.data?.rows ?? []).map((d) => ({ id: `doc-${d.id}`, group: "documents" as const, label: d.number, hint: `${d.supplier} · ${money(d.amount)}`, icon: <FileText className={ico} aria-hidden="true" />, run: () => navigate(`/documents?doc=${d.id}`) })) : [];
    return [...local, ...found];
  }, [t, navigate, set, isDark, lang, signOut, programs.data, docs.data, term, money]);

  useEffect(() => setActive(0), [term]);
  useEffect(() => { if (!open) setQ(""); }, [open]);
  const current = items[Math.min(active, items.length - 1)];
  const optId = (i: Item) => `${listId}-${i.id}`;
  useEffect(() => { if (current) document.getElementById(optId(current))?.scrollIntoView?.({ block: "nearest" }); });

  const run = (i: Item) => { onOpenChange(false); i.run(); };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    const last = items.length - 1;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, last)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === "Home" && items.length) { e.preventDefault(); setActive(0); }
    else if (e.key === "End" && items.length) { e.preventDefault(); setActive(last); }
    else if (e.key === "Enter" && current) { e.preventDefault(); run(current); }
  };
  const groups: Group[] = ["pages", "actions", "programs", "documents"];

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="overlay fixed inset-0 z-40 bg-black/40" />
        <Dialog.Content aria-describedby={`${listId}-hint`} className="dialog-content fixed top-[12vh] left-1/2 z-50 w-[min(94vw,36rem)] -translate-x-1/2 overflow-hidden rounded-xl border border-border bg-surface shadow-2xl">
          <Dialog.Title className="sr-only">{t("palette.label")}</Dialog.Title>
          <div className="flex items-center gap-2 border-b border-border px-4">
            <Search className="size-4 text-fg-muted" aria-hidden="true" />
            <input
              role="combobox" aria-expanded="true" aria-controls={listId} aria-autocomplete="list" aria-label={t("palette.label")}
              aria-activedescendant={current ? optId(current) : undefined} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey}
              placeholder={t("palette.placeholder")} className="h-12 w-full bg-transparent outline-none placeholder:text-fg-muted" autoFocus
            />
          </div>
          <ul role="listbox" id={listId} aria-label={t("palette.label")} className="max-h-[50vh] overflow-y-auto p-2">
            {groups.map((g) => {
              const inGroup = items.filter((i) => i.group === g);
              if (!inGroup.length) return null;
              return (
                <li key={g} role="presentation">
                  <p id={`${listId}-${g}`} className="px-2 pt-2 pb-1 text-xs font-semibold text-fg-muted">{t(`palette.${g}`)}</p>
                  <ul role="group" aria-labelledby={`${listId}-${g}`}>
                    {inGroup.map((i) => (
                      <li key={i.id} id={optId(i)} role="option" aria-selected={i === current} onMouseMove={() => setActive(items.indexOf(i))} onClick={() => run(i)}
                        className={cn("flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm", i === current && "bg-accent-soft")}>
                        {i.icon}<span className="min-w-0 flex-1 truncate">{i.label}</span>{i.hint && <span className="truncate text-xs text-fg-muted">{i.hint}</span>}
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
            {!items.length && <li role="presentation" className="px-3 py-6 text-center text-sm text-fg-muted">{t("palette.empty", { q: term })}</li>}
          </ul>
          <p id={`${listId}-hint`} className="border-t border-border px-4 py-2 text-xs text-fg-muted">{t("palette.hint")}</p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
