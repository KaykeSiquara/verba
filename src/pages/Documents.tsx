import { ArrowDown, ArrowUp, ArrowUpDown, Download } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { api } from "../api/client";
import { useDocument, useDocuments, usePrograms, useSetStatus } from "../api/hooks";
import { dueBand, type Dir, type DocQuery, type SortKey } from "../api/query";
import type { Department, Doc, Status } from "../api/types";
import { usePrefs } from "../app/prefs";
import { DueDate, StatusBadge } from "../components/ui/Badges";
import { Button } from "../components/ui/Button";
import { SelectField, TextArea, TextField } from "../components/ui/Field";
import { ConfirmDialog, Sheet } from "../components/ui/Overlays";
import { PageHeader } from "../components/ui/PageHeader";
import { Card, EmptyState, ErrorState, Loading } from "../components/ui/States";
import { useToast } from "../components/ui/Toast";
import type { Key } from "../i18n/pt";
import { download, toCsv } from "../lib/csv";
import { cn } from "../lib/cn";

const STATUSES: Status[] = ["pending", "paid", "rejected"];
const DEPTS: Department[] = ["payroll", "hr", "procurement", "reporting"];
const COLS: { key: SortKey; label: Key; num?: boolean }[] = [
  { key: "number", label: "docs.colNumber" }, { key: "supplier", label: "docs.colSupplier" }, { key: "program", label: "docs.colProgram" },
  { key: "department", label: "docs.colDepartment" }, { key: "amount", label: "docs.colAmount", num: true }, { key: "dueAt", label: "docs.colDue" }, { key: "status", label: "docs.colStatus" },
];

function useQueryState() {
  const [params, setParams] = useSearchParams();
  const query: DocQuery = {
    q: params.get("q") ?? "", status: (params.get("status")?.split(",").filter(Boolean) ?? []) as Status[], programId: params.get("program") ?? "",
    department: (params.get("dept") ?? "") as Department, sort: (params.get("sort") as SortKey) ?? "dueAt", dir: (params.get("dir") as Dir) ?? "asc", page: Number(params.get("page") ?? 1), pageSize: 20,
  };
  const update = (patch: Record<string, string | null>, resetPage = true) => setParams((p) => {
    const n = new URLSearchParams(p);
    for (const [k, v] of Object.entries(patch)) (v ? n.set(k, v) : n.delete(k));
    if (resetPage && !("page" in patch)) n.delete("page");
    return n;
  }, { replace: true });
  return { query, update, docId: params.get("doc") };
}

export default function Documents() {
  const { t, money, number, lang } = usePrefs();
  const toast = useToast();
  const { query, update, docId } = useQueryState();
  const list = useDocuments(query);
  const programs = usePrograms();
  const programName = useMemo(() => new Map((programs.data ?? []).map((p) => [p.id, p.name])), [programs.data]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [action, setAction] = useState<{ kind: "approve" | "reject"; ids: string[] } | null>(null);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string | null>(null);
  const setStatus = useSetStatus();
  const now = new Date();
  const rows = list.data?.rows ?? [];
  const pendingOnPage = rows.filter((d) => d.status === "pending").map((d) => d.id);
  const filtersOn = !!(query.q || query.status?.length || query.programId || query.department);

  useEffect(() => setSelected(new Set()), [list.data?.page, query.q, query.status?.join(), query.programId, query.department]);

  const sortBy = (key: SortKey) => update({ sort: key, dir: query.sort === key && query.dir === "asc" ? "desc" : "asc" });
  const toggleStatus = (s: Status) => {
    const cur = new Set(query.status);
    cur.has(s) ? cur.delete(s) : cur.add(s);
    update({ status: [...cur].join(",") || null });
  };
  const confirm = () => {
    if (!action) return;
    if (action.kind === "reject" && reason.trim().length < 10) { setReasonError(t("docs.reasonError")); return; }
    setStatus.mutate({ ids: action.ids, status: action.kind === "approve" ? "paid" : "rejected", note: action.kind === "reject" ? reason : undefined }, {
      onSuccess: (docs) => { toast(t(action.kind === "approve" ? "docs.approved" : "docs.rejectedToast", { n: docs.length })); setAction(null); setSelected(new Set()); setReason(""); },
      onError: () => toast(t("app.errorBody"), "error"),
    });
  };
  const exportCsv = async () => {
    const all = await api.documents({ ...query, page: 1, pageSize: 100000 });
    const head = COLS.map((c) => t(c.label));
    const body = all.rows.map((d) => [d.number, d.supplier, programName.get(d.programId) ?? "", t(`dept.${d.department}`), d.amount / 100, d.dueAt.slice(0, 10), t(`status.${d.status}`)]);
    download(`verba-${new Date().toISOString().slice(0, 10)}.csv`, toCsv([head, ...body], lang));
    toast(t("docs.exported", { n: all.rows.length }));
  };
  const sortedLabel = t(COLS.find((c) => c.key === query.sort)?.label ?? "docs.colDue");

  return (
    <>
      <PageHeader title={t("docs.title")} subtitle={list.data ? t("docs.count", { n: number(list.data.total), sum: money(list.data.sum) }) : "\u00a0"}
        actions={<Button onClick={exportCsv} disabled={!list.data?.total}><Download className="size-4" aria-hidden="true" />{t("docs.export")}</Button>} />

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <TextField label={t("docs.search")} value={query.q} onChange={(e) => update({ q: e.target.value || null })} type="search" className="w-full sm:w-72" />
        <fieldset className="flex flex-col gap-1.5">
          <legend className="mb-1.5 text-sm font-semibold">{t("docs.status")}</legend>
          <div className="flex gap-1">
            {STATUSES.map((s) => (
              <Button key={s} size="sm" aria-pressed={!!query.status?.includes(s)} onClick={() => toggleStatus(s)} className={cn("h-10", query.status?.includes(s) && "border-accent bg-accent-soft")}>{t(`status.${s}`)}</Button>
            ))}
          </div>
        </fieldset>
        <SelectField label={t("docs.program")} value={query.programId} onChange={(e) => update({ program: e.target.value || null })} className="w-full sm:w-52">
          <option value="">{t("docs.allPrograms")}</option>{(programs.data ?? []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </SelectField>
        <SelectField label={t("docs.department")} value={query.department} onChange={(e) => update({ dept: e.target.value || null })} className="w-full sm:w-52">
          <option value="">{t("docs.allDepartments")}</option>{DEPTS.map((d) => <option key={d} value={d}>{t(`dept.${d}`)}</option>)}
        </SelectField>
        {filtersOn && <Button variant="ghost" onClick={() => update({ q: null, status: null, program: null, dept: null })}>{t("app.clearFilters")}</Button>}
      </div>

      {selected.size > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-3 rounded-xl border border-accent bg-accent-soft px-4 py-2.5" role="region" aria-label={t("docs.selected", { n: selected.size })}>
          <p className="text-sm font-semibold">{t("docs.selected", { n: selected.size })}</p>
          <div className="ml-auto flex gap-2">
            <Button size="sm" variant="primary" onClick={() => setAction({ kind: "approve", ids: [...selected] })}>{t("docs.approve")}</Button>
            <Button size="sm" onClick={() => { setAction({ kind: "reject", ids: [...selected] }); setReason(""); setReasonError(null); }}>{t("docs.reject")}</Button>
          </div>
        </div>
      )}

      <Card>
        {list.isError ? <ErrorState onRetry={() => list.refetch()} /> : !list.data ? <Loading rows={8} /> : !rows.length ? (
          <EmptyState action={filtersOn && <Button onClick={() => update({ q: null, status: null, program: null, dept: null })}>{t("app.clearFilters")}</Button>}>{t("docs.empty")}</EmptyState>
        ) : (
          <div className="@container">
            <div className="hidden overflow-x-auto @2xl:block">
              <table className="w-full text-sm">
                <caption className="sr-only">{t("docs.table", { col: sortedLabel })}</caption>
                <thead>
                  <tr className="border-b border-border text-left text-xs text-fg-muted">
                    <th scope="col" className="w-10 px-4 py-3">
                      <input type="checkbox" aria-label={t("docs.selectAll")} disabled={!pendingOnPage.length}
                        checked={pendingOnPage.length > 0 && pendingOnPage.every((id) => selected.has(id))}
                        onChange={(e) => setSelected(e.target.checked ? new Set(pendingOnPage) : new Set())} className="size-4 accent-accent" />
                    </th>
                    {COLS.map((c) => {
                      const on = query.sort === c.key;
                      const Icon = on ? (query.dir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
                      return (
                        <th key={c.key} scope="col" aria-sort={on ? (query.dir === "asc" ? "ascending" : "descending") : undefined} className={cn("px-4 py-2 font-semibold whitespace-nowrap", c.num && "text-right")}>
                          <button type="button" onClick={() => sortBy(c.key)} className={cn("inline-flex items-center gap-1 rounded px-1 py-1 hover:text-fg", on && "text-fg")}>
                            {t(c.label)}<Icon className="size-3.5" aria-hidden="true" />
                          </button>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((d) => <Row key={d.id} d={d} program={programName.get(d.programId) ?? ""} now={now} checked={selected.has(d.id)} onCheck={(on) => setSelected((s) => { const n = new Set(s); on ? n.add(d.id) : n.delete(d.id); return n; })} onOpen={() => update({ doc: d.id }, false)} />)}
                </tbody>
              </table>
            </div>
            <ul className="divide-y divide-border @2xl:hidden">
              {rows.map((d) => (
                <li key={d.id} className="flex items-start gap-3 px-4 py-3">
                  {d.status === "pending" && <input type="checkbox" aria-label={t("docs.selectRow", { doc: d.number })} checked={selected.has(d.id)} onChange={(e) => setSelected((s) => { const n = new Set(s); e.target.checked ? n.add(d.id) : n.delete(d.id); return n; })} className="mt-1 size-4 accent-accent" />}
                  <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1">
                    <button type="button" onClick={() => update({ doc: d.id }, false)} className="justify-self-start font-semibold text-accent hover:underline">{d.number}</button>
                    <span className="text-right font-semibold tabular">{money(d.amount)}</span>
                    <span className="truncate text-sm text-fg-muted">{d.supplier}</span>
                    <span className="justify-self-end"><StatusBadge status={d.status} /></span>
                    <span className="text-sm text-fg-muted">{programName.get(d.programId)}</span>
                    <span className="justify-self-end text-sm"><DueDate iso={d.dueAt} band={d.status === "pending" ? dueBand(d.dueAt, now) : null} /></span>
                  </div>
                </li>
              ))}
            </ul>
            <nav aria-label={t("app.page", { page: list.data.page, pages: list.data.pages })} className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm">
              <p className="text-fg-muted">{t("app.page", { page: list.data.page, pages: list.data.pages })}</p>
              <div className="flex gap-2">
                <Button size="sm" disabled={list.data.page <= 1} onClick={() => update({ page: String(list.data!.page - 1) }, false)}>{t("app.previous")}</Button>
                <Button size="sm" disabled={list.data.page >= list.data.pages} onClick={() => update({ page: String(list.data!.page + 1) }, false)}>{t("app.next")}</Button>
              </div>
            </nav>
          </div>
        )}
      </Card>

      <DocumentSheet id={docId} programName={programName} onClose={() => update({ doc: null }, false)} onAction={(kind, id) => { setAction({ kind, ids: [id] }); setReason(""); setReasonError(null); }} />

      <ConfirmDialog open={action?.kind === "approve"} onOpenChange={(o) => !o && setAction(null)} title={t("docs.approveTitle", { n: action?.ids.length ?? 0 })} description={t("docs.approveBody")} confirmLabel={t("docs.approve")} onConfirm={confirm} busy={setStatus.isPending} />
      <ConfirmDialog open={action?.kind === "reject"} onOpenChange={(o) => !o && setAction(null)} title={t("docs.rejectTitle", { n: action?.ids.length ?? 0 })} description={t("docs.rejectBody")} confirmLabel={t("docs.reject")} onConfirm={confirm} busy={setStatus.isPending} danger>
        <TextArea label={t("docs.reason")} value={reason} onChange={(e) => { setReason(e.target.value); setReasonError(null); }} error={reasonError} autoFocus />
      </ConfirmDialog>
    </>
  );
}

function Row({ d, program, now, checked, onCheck, onOpen }: { d: Doc; program: string; now: Date; checked: boolean; onCheck: (on: boolean) => void; onOpen: () => void }) {
  const { t, money } = usePrefs();
  return (
    <tr className={cn("border-b border-border last:border-0 hover:bg-surface-2", checked && "bg-accent-soft/60")}>
      <td className="row-pad px-4">{d.status === "pending" && <input type="checkbox" aria-label={t("docs.selectRow", { doc: d.number })} checked={checked} onChange={(e) => onCheck(e.target.checked)} className="size-4 accent-accent" />}</td>
      <td className="row-pad px-4 whitespace-nowrap"><button type="button" onClick={onOpen} className="font-semibold text-accent hover:underline" aria-label={t("docs.open", { doc: d.number })}>{d.number}</button></td>
      <td className="row-pad max-w-56 truncate px-4">{d.supplier}</td>
      <td className="row-pad px-4 whitespace-nowrap">{program}</td>
      <td className="row-pad px-4 whitespace-nowrap text-fg-muted">{t(`dept.${d.department}`)}</td>
      <td className="row-pad px-4 text-right font-semibold whitespace-nowrap tabular">{money(d.amount)}</td>
      <td className="row-pad px-4 whitespace-nowrap"><DueDate iso={d.dueAt} band={d.status === "pending" ? dueBand(d.dueAt, now) : null} /></td>
      <td className="row-pad px-4"><StatusBadge status={d.status} /></td>
    </tr>
  );
}

function DocumentSheet({ id, programName, onClose, onAction }: { id: string | null; programName: Map<string, string>; onClose: () => void; onAction: (k: "approve" | "reject", id: string) => void }) {
  const { t, money, date } = usePrefs();
  const q = useDocument(id);
  const d = q.data;
  const now = new Date();
  return (
    <Sheet open={!!id} onOpenChange={(o) => !o && onClose()} title={d?.number ?? "…"} description={d?.supplier}>
      {q.isError ? <ErrorState onRetry={() => q.refetch()} /> : !d ? <Loading rows={5} /> : (
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between gap-3"><StatusBadge status={d.status} /><p className="text-2xl font-semibold tabular">{money(d.amount)}</p></div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <div><dt className="text-fg-muted">{t("docs.program")}</dt><dd className="font-medium">{programName.get(d.programId)}</dd></div>
            <div><dt className="text-fg-muted">{t("docs.department")}</dt><dd className="font-medium">{t(`dept.${d.department}`)}</dd></div>
            <div><dt className="text-fg-muted">{t("docs.kind")}</dt><dd className="font-medium">{t(`kind.${d.kind}`)}</dd></div>
            <div><dt className="text-fg-muted">{t("docs.issued")}</dt><dd className="font-medium">{date(d.issuedAt, "long")}</dd></div>
            <div className="col-span-2"><dt className="text-fg-muted">{t("docs.due")}</dt><dd className="font-medium"><DueDate iso={d.dueAt} band={d.status === "pending" ? dueBand(d.dueAt, now) : null} /></dd></div>
          </dl>
          {d.status === "pending" && (
            <div className="flex gap-2"><Button variant="primary" onClick={() => onAction("approve", d.id)}>{t("docs.approve")}</Button><Button onClick={() => onAction("reject", d.id)}>{t("docs.reject")}</Button></div>
          )}
          <section aria-labelledby="history-title">
            <h3 id="history-title" className="mb-3 text-sm font-semibold">{t("docs.history")}</h3>
            <ol className="relative flex flex-col gap-4 border-l border-border pl-4">
              {[...d.history].reverse().map((h) => (
                <li key={h.at + h.type} className="text-sm">
                  <p><span className="font-medium">{h.by}</span> {t(`activity.${h.type}`)}</p>
                  {h.note && <p className="mt-1 rounded-md bg-rejected-soft px-2 py-1 text-rejected">{h.note}</p>}
                  <time dateTime={h.at} className="text-xs text-fg-muted">{date(h.at, "long")}</time>
                </li>
              ))}
            </ol>
          </section>
        </div>
      )}
    </Sheet>
  );
}
