import * as Tabs from "@radix-ui/react-tabs";
import { useEffect, useState, type FormEvent } from "react";
import { useMembers, useOverview, useProfile, useUpdateProfile } from "../api/hooks";
import { SEATS } from "../api/seed";
import type { Profile } from "../api/types";
import { usePrefs, type Density, type Lang, type ThemeMode } from "../app/prefs";
import { Button } from "../components/ui/Button";
import { SelectField, TextField } from "../components/ui/Field";
import { PageHeader } from "../components/ui/PageHeader";
import { Card, ErrorState, Loading } from "../components/ui/States";
import { useToast } from "../components/ui/Toast";

const tab = "rounded-md px-3 py-1.5 text-sm font-semibold text-fg-muted data-[state=active]:bg-surface data-[state=active]:text-fg data-[state=active]:shadow-sm";

function ProfileForm() {
  const { t } = usePrefs();
  const toast = useToast();
  const q = useProfile();
  const save = useUpdateProfile();
  const [form, setForm] = useState<Profile | null>(null);
  const [error, setError] = useState<{ name?: string; email?: string }>({});
  useEffect(() => { if (q.data && !form) setForm(q.data); }, [q.data, form]);
  if (q.isError) return <ErrorState onRetry={() => q.refetch()} />;
  if (!form) return <Loading rows={3} />;
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next = { name: form.name.trim() ? undefined : t("settings.nameError"), email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) ? undefined : t("login.emailInvalid") };
    setError(next);
    if (next.name || next.email) return;
    save.mutate(form, { onSuccess: () => toast(t("app.saved")), onError: () => toast(t("app.errorBody"), "error") });
  };
  return (
    <form noValidate onSubmit={submit} className="flex max-w-lg flex-col gap-4 p-5">
      <TextField label={t("settings.name")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={error.name} autoComplete="name" />
      <TextField label={t("settings.email")} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={error.email} autoComplete="email" />
      <TextField label={t("settings.jobTitle")} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} autoComplete="organization-title" />
      <Button type="submit" variant="primary" busy={save.isPending} className="self-start">{t("app.save")}</Button>
    </form>
  );
}

function Preferences() {
  const { t, lang, theme, density, simulateErrors, set } = usePrefs();
  return (
    <div className="flex max-w-lg flex-col gap-5 p-5">
      <SelectField label={t("app.language")} value={lang} onChange={(e) => set({ lang: e.target.value as Lang })}>
        <option value="pt-BR">Português (Brasil)</option><option value="en">English</option>
      </SelectField>
      <SelectField label={t("app.theme")} value={theme} onChange={(e) => set({ theme: e.target.value as ThemeMode })}>
        <option value="light">{t("app.light")}</option><option value="dark">{t("app.dark")}</option><option value="system">{t("app.system")}</option>
      </SelectField>
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">{t("settings.density")}</legend>
        <div className="flex gap-4">
          {(["comfortable", "compact"] as Density[]).map((d) => (
            <label key={d} className="flex items-center gap-2 text-sm"><input type="radio" name="density" value={d} checked={density === d} onChange={() => set({ density: d })} className="size-4 accent-accent" />{t(`settings.${d}`)}</label>
          ))}
        </div>
      </fieldset>
      <div className="flex items-start gap-3">
        <input id="simulate" type="checkbox" checked={simulateErrors} onChange={(e) => set({ simulateErrors: e.target.checked })} aria-describedby="simulate-help" className="mt-1 size-4 accent-accent" />
        <div><label htmlFor="simulate" className="text-sm font-semibold">{t("settings.simulate")}</label><p id="simulate-help" className="text-xs text-fg-muted">{t("settings.simulateHelp")}</p></div>
      </div>
    </div>
  );
}

function Usage({ label, used, total }: { label: string; used: number; total: number }) {
  const { number } = usePrefs();
  return (
    <div>
      <div className="flex justify-between text-sm"><span>{label}</span><span className="font-semibold tabular">{number(used)} / {number(total)}</span></div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2" aria-hidden="true"><div className="h-full bg-accent" style={{ width: `${Math.min(100, (used / total) * 100)}%` }} /></div>
    </div>
  );
}

function Billing() {
  const { t, money, date } = usePrefs();
  const o = useOverview(6);
  const m = useMembers();
  const renew = new Date(); renew.setMonth(renew.getMonth() + 1, 1);
  const processed = (o.data?.paidMonth.count ?? 0) + (o.data?.pending.count ?? 0);
  return (
    <div className="grid max-w-3xl gap-4 p-5 md:grid-cols-2">
      <div className="rounded-xl border border-accent bg-accent-soft p-4">
        <p className="text-sm text-fg-muted">{t("settings.currentPlan")}</p>
        <p className="mt-1 text-xl font-semibold">{t("settings.plan.team")}</p>
        <p className="text-sm">{t("settings.perMonth", { price: money(29900) })}</p>
        <p className="mt-3 text-xs text-fg-muted">{t("settings.renews", { date: date(renew.toISOString(), "long") })}</p>
      </div>
      <div className="flex flex-col gap-4 rounded-xl border border-border p-4">
        <p className="text-sm font-semibold">{t("settings.usage")}</p>
        <Usage label={t("settings.docsUsage")} used={processed} total={1000} />
        <Usage label={t("settings.seatsUsage")} used={m.data?.length ?? 0} total={SEATS} />
      </div>
      <p className="text-xs text-fg-muted md:col-span-2">{t("settings.billingNote")}</p>
    </div>
  );
}

export default function Settings() {
  const { t } = usePrefs();
  return (
    <>
      <PageHeader title={t("settings.title")} />
      <Tabs.Root defaultValue="profile">
        <Tabs.List aria-label={t("settings.title")} className="mb-4 inline-flex gap-1 rounded-lg bg-surface-2 p-1">
          <Tabs.Trigger value="profile" className={tab}>{t("settings.profile")}</Tabs.Trigger>
          <Tabs.Trigger value="preferences" className={tab}>{t("settings.preferences")}</Tabs.Trigger>
          <Tabs.Trigger value="billing" className={tab}>{t("settings.billing")}</Tabs.Trigger>
        </Tabs.List>
        <Card>
          <Tabs.Content value="profile"><ProfileForm /></Tabs.Content>
          <Tabs.Content value="preferences"><Preferences /></Tabs.Content>
          <Tabs.Content value="billing"><Billing /></Tabs.Content>
        </Card>
      </Tabs.Root>
    </>
  );
}
