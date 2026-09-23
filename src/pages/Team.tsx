import { UserPlus } from "lucide-react";
import { useState } from "react";
import { DomainError } from "../api/db";
import { useInvite, useMembers, useRemoveMember, useUpdateRole } from "../api/hooks";
import { SEATS } from "../api/seed";
import type { Member, Role } from "../api/types";
import { usePrefs } from "../app/prefs";
import { Button } from "../components/ui/Button";
import { SelectField, TextField } from "../components/ui/Field";
import { ConfirmDialog } from "../components/ui/Overlays";
import { PageHeader } from "../components/ui/PageHeader";
import { Card, ErrorState, Loading } from "../components/ui/States";
import { useToast } from "../components/ui/Toast";
import { cn } from "../lib/cn";

const ROLES: Role[] = ["admin", "approver", "viewer"];

export default function Team() {
  const { t, relative } = usePrefs();
  const toast = useToast();
  const q = useMembers();
  const updateRole = useUpdateRole();
  const remove = useRemoveMember();
  const invite = useInvite();
  const [inviting, setInviting] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", role: "viewer" as Role });
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [removing, setRemoving] = useState<Member | null>(null);
  const members = q.data ?? [];

  const submitInvite = () => {
    const next = { name: form.name.trim() ? undefined : t("team.nameError"), email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) ? undefined : t("login.emailInvalid") };
    setErrors(next);
    if (next.name || next.email) return;
    invite.mutate(form, {
      onSuccess: (m) => { toast(t("team.invited", { email: m.email })); setInviting(false); setForm({ name: "", email: "", role: "viewer" }); },
      onError: (e) => (e instanceof DomainError && e.code === "emailTaken" ? setErrors({ email: t("team.emailTaken") }) : toast(t("app.errorBody"), "error")),
    });
  };

  return (
    <>
      <PageHeader title={t("team.title")} subtitle={q.data ? t("team.seats", { used: members.length, total: SEATS }) : "\u00a0"}
        actions={<Button variant="primary" onClick={() => { setInviting(true); setErrors({}); }} disabled={members.length >= SEATS}><UserPlus className="size-4" aria-hidden="true" />{t("team.invite")}</Button>} />
      <Card>
        {q.isError ? <ErrorState onRetry={() => q.refetch()} /> : !q.data ? <Loading rows={6} /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-sm">
              <caption className="sr-only">{t("team.title")}</caption>
              <thead><tr className="border-b border-border text-left text-xs text-fg-muted">
                <th scope="col" className="px-4 py-3 font-semibold">{t("team.name")}</th><th scope="col" className="px-4 py-3 font-semibold">{t("team.role")}</th>
                <th scope="col" className="px-4 py-3 font-semibold">{t("team.status")}</th><th scope="col" className="px-4 py-3 font-semibold">{t("team.lastActive")}</th>
                <th scope="col" className="px-4 py-3"><span className="sr-only">{t("docs.approve")}</span></th>
              </tr></thead>
              <tbody>
                {members.map((m) => {
                  const self = m.id === "m1";
                  return (
                    <tr key={m.id} className="border-b border-border last:border-0">
                      <td className="row-pad px-4"><p className="font-medium">{m.name}{self && <span className="text-fg-muted"> ({t("team.you")})</span>}</p><p className="text-xs text-fg-muted">{m.email}</p></td>
                      <td className="row-pad px-4">
                        <SelectField label={t("team.changeRole", { name: m.name })} hideLabel value={m.role} disabled={self || updateRole.isPending} className="w-44"
                          onChange={(e) => updateRole.mutate({ id: m.id, role: e.target.value as Role }, { onSuccess: () => toast(t("team.roleChanged", { name: m.name })) })}>
                          {ROLES.map((r) => <option key={r} value={r}>{t(`team.role.${r}`)}</option>)}
                        </SelectField>
                      </td>
                      <td className="row-pad px-4"><span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", m.status === "active" ? "bg-paid-soft text-paid" : "bg-surface-2 text-fg-muted")}>{t(m.status === "active" ? "team.active" : "team.invitedStatus")}</span></td>
                      <td className="row-pad px-4 text-fg-muted">{m.lastActiveAt ? relative(m.lastActiveAt) : t("team.never")}</td>
                      <td className="row-pad px-4 text-right">{!self && <Button size="sm" variant="ghost" onClick={() => setRemoving(m)} aria-label={t("team.remove", { name: m.name })}>{t("team.remove", { name: "" }).trim()}</Button>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <p className="mt-3 text-sm text-fg-muted">{t("team.roleHelp")}</p>

      <ConfirmDialog open={inviting} onOpenChange={setInviting} title={t("team.inviteTitle")} description={t("team.inviteBody")} confirmLabel={t("team.invite")} onConfirm={submitInvite} busy={invite.isPending}>
        <TextField label={t("team.name")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} autoFocus />
        <TextField label={t("team.email")} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={errors.email} />
        <SelectField label={t("team.role")} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })} hint={t("team.roleHelp")}>
          {ROLES.map((r) => <option key={r} value={r}>{t(`team.role.${r}`)}</option>)}
        </SelectField>
      </ConfirmDialog>
      <ConfirmDialog open={!!removing} onOpenChange={(o) => !o && setRemoving(null)} title={t("team.removeTitle", { name: removing?.name ?? "" })} description={t("team.removeBody")}
        confirmLabel={t("team.remove", { name: "" }).trim()} danger busy={remove.isPending}
        onConfirm={() => removing && remove.mutate(removing.id, { onSuccess: () => { toast(t("team.removed", { name: removing.name })); setRemoving(null); } })} />
    </>
  );
}
