import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { en } from "../i18n/en";
import { pt, type Key } from "../i18n/pt";

export type Lang = "pt-BR" | "en";
export type ThemeMode = "light" | "dark" | "system";
export type Density = "comfortable" | "compact";
export type Prefs = { lang: Lang; theme: ThemeMode; density: Density; simulateErrors: boolean };

const STORE = "verba:prefs";
const DEFAULTS: Prefs = { lang: "pt-BR", theme: "system", density: "comfortable", simulateErrors: false };

function load(): Prefs {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(STORE) || "{}") }; } catch { return DEFAULTS; }
}

type Ctx = Prefs & {
  set: (patch: Partial<Prefs>) => void;
  t: (key: Key, vars?: Record<string, string | number>) => string;
  money: (cents: number) => string;
  date: (iso: string, style?: "short" | "long") => string;
  month: (iso: string) => string;
  number: (n: number) => string;
  percent: (n: number) => string;
  relative: (iso: string, now?: Date) => string;
  isDark: boolean;
};
const PrefsContext = createContext<Ctx | null>(null);

export function PrefsProvider({ children, initial }: { children: ReactNode; initial?: Partial<Prefs> }) {
  const [prefs, setPrefs] = useState<Prefs>(() => ({ ...load(), ...initial }));
  const [systemDark, setSystemDark] = useState(() => typeof matchMedia === "function" && matchMedia("(prefers-color-scheme: dark)").matches);
  const set = useCallback((patch: Partial<Prefs>) => setPrefs((p) => ({ ...p, ...patch })), []);

  useEffect(() => { try { localStorage.setItem(STORE, JSON.stringify(prefs)); } catch {} }, [prefs]);
  useEffect(() => {
    if (typeof matchMedia !== "function") return;
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const on = () => setSystemDark(mq.matches);
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, []);
  const isDark = prefs.theme === "dark" || (prefs.theme === "system" && systemDark);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.lang = prefs.lang;
    document.documentElement.dataset.density = prefs.density;
  }, [isDark, prefs.lang, prefs.density]);

  const value = useMemo<Ctx>(() => {
    const dict = prefs.lang === "en" ? en : pt;
    const nf = new Intl.NumberFormat(prefs.lang);
    const cf = new Intl.NumberFormat(prefs.lang, { style: "currency", currency: "BRL" });
    const pf = new Intl.NumberFormat(prefs.lang, { style: "percent", maximumFractionDigits: 0 });
    const rf = new Intl.RelativeTimeFormat(prefs.lang, { numeric: "auto" });
    return {
      ...prefs,
      set,
      isDark,
      t: (key, vars) => {
        let s: string = dict[key] ?? key;
        if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
        return s;
      },
      money: (cents) => cf.format(cents / 100),
      date: (iso, style = "short") => new Intl.DateTimeFormat(prefs.lang, style === "short" ? { day: "2-digit", month: "short" } : { day: "numeric", month: "long", year: "numeric" }).format(new Date(iso)),
      month: (iso) => new Intl.DateTimeFormat(prefs.lang, { month: "short", year: "2-digit" }).format(new Date(iso)),
      number: (n) => nf.format(n),
      percent: (n) => pf.format(n),
      relative: (iso, now = new Date()) => {
        const days = Math.round((new Date(iso).getTime() - now.getTime()) / 86400000);
        if (Math.abs(days) < 1) {
          const hours = Math.round((new Date(iso).getTime() - now.getTime()) / 3600000);
          return rf.format(hours, "hour");
        }
        return rf.format(days, "day");
      },
    };
  }, [prefs, set, isDark]);

  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
}

export function usePrefs() {
  const ctx = useContext(PrefsContext);
  if (!ctx) throw new Error("usePrefs needs PrefsProvider");
  return ctx;
}
