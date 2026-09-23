import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router";
import { useAuth } from "../app/auth";
import { usePrefs } from "../app/prefs";
import { Button } from "../components/ui/Button";
import { TextField } from "../components/ui/Field";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const { t, lang, set } = usePrefs();
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from ?? "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const submit = (e: FormEvent, values = { email, password }) => {
    e.preventDefault();
    const next = { email: EMAIL.test(values.email.trim()) ? undefined : t("login.emailInvalid"), password: values.password.length >= 6 ? undefined : t("login.passwordShort") };
    setErrors(next);
    if (next.email) return document.getElementById("login-email")?.focus();
    if (next.password) return document.getElementById("login-password")?.focus();
    signIn(values.email.trim());
    navigate(from, { replace: true });
  };

  return (
    <main className="grid min-h-dvh place-items-center bg-bg px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center justify-between">
          <span className="flex items-center gap-2.5 font-semibold">
            <svg viewBox="0 0 32 32" className="size-8" aria-hidden="true"><rect width="32" height="32" rx="8" className="fill-accent" /><path d="M9 10l7 13 7-13" fill="none" className="stroke-accent-fg" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Verba
          </span>
          <Button variant="ghost" size="sm" onClick={() => set({ lang: lang === "en" ? "pt-BR" : "en" })} lang={lang === "en" ? "pt-BR" : "en"}>{lang === "en" ? "Português" : "English"}</Button>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("login.title")}</h1>
        <p className="mt-1 text-sm text-fg-muted">{t("login.subtitle")}</p>
        <form noValidate onSubmit={submit} className="mt-8 flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">
          <TextField id="login-email" label={t("login.email")} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
          <TextField id="login-password" label={t("login.password")} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} />
          <Button type="submit" variant="primary">{t("login.submit")}</Button>
          <Button onClick={(e) => { const demo = { email: "marina@semear.example", password: "demonstracao" }; setEmail(demo.email); setPassword(demo.password); submit(e, demo); }}>{t("login.demo")}</Button>
        </form>
        <p className="mt-4 text-center text-xs text-fg-muted">{t("app.demo")}</p>
      </div>
    </main>
  );
}
