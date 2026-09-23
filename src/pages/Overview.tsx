import { useState } from "react";
import { Link } from "react-router";
import { useOverview } from "../api/hooks";
import { dueBand } from "../api/query";
import { usePrefs } from "../app/prefs";
import { CashflowChart, ProgramBars } from "../components/Charts";
import { DueDate } from "../components/ui/Badges";
import { SelectField } from "../components/ui/Field";
import { PageHeader } from "../components/ui/PageHeader";
import { Card, ErrorState, Loading, Skeleton } from "../components/ui/States";

function Kpi({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-sm text-fg-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight tabular">{value}</p>
      <p className="mt-1 text-xs text-fg-muted">{sub}</p>
    </div>
  );
}

export default function Overview() {
  const { t, money, number, percent, relative } = usePrefs();
  const [months, setMonths] = useState(6);
  const q = useOverview(months);
  const now = new Date();
  const header = (
    <PageHeader title={t("overview.title")} actions={
      <SelectField label={t("overview.period")} value={months} onChange={(e) => setMonths(Number(e.target.value))} className="w-48">
        <option value={6}>{t("overview.last6")}</option><option value={12}>{t("overview.last12")}</option>
      </SelectField>
    } />
  );
  if (q.isError) return <>{header}<Card><ErrorState onRetry={() => q.refetch()} /></Card></>;
  if (!q.data) return <>{header}<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28" />)}</div><Card className="mt-4"><Loading rows={6} /></Card></>;
  const d = q.data;
  const prev = d.paidMonth.previous ?? 0;
  const delta = prev ? (d.paidMonth.value - prev) / prev : 0;
  const signed = `${delta >= 0 ? "↑" : "↓"} ${percent(Math.abs(delta))}`;
  return (
    <>
      {header}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label={t("overview.paidMonth")} value={money(d.paidMonth.value)} sub={t("overview.vsPrev", { delta: signed })} />
        <Kpi label={t("overview.pending")} value={money(d.pending.value)} sub={t("overview.docs", { n: number(d.pending.count) })} />
        <Kpi label={t("overview.rejected")} value={money(d.rejected30.value)} sub={t("overview.docs", { n: number(d.rejected30.count) })} />
        <Kpi label={t("overview.dueSoon")} value={money(d.due7.value)} sub={t("overview.docs", { n: number(d.due7.count) })} />
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Card title={t("overview.cashflow")} id="cashflow-title"><CashflowChart data={d.series} /></Card>
        <Card title={t("overview.byProgram")} id="byprogram-title" action={<Link to="/programs" className="text-sm font-semibold text-accent hover:underline">{t("overview.viewAll")}</Link>}>
          <ProgramBars data={d.byProgram} />
        </Card>
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Card title={t("overview.dueSoonTitle")} id="due-title" action={<Link to="/documents?status=pending&sort=dueAt&dir=asc" className="text-sm font-semibold text-accent hover:underline">{t("overview.viewAll")}</Link>}>
          {d.dueSoon.length ? (
            <ul className="divide-y divide-border">
              {d.dueSoon.map((doc) => (
                <li key={doc.id}>
                  <Link to={`/documents?doc=${doc.id}`} className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-surface-2">
                    <span className="min-w-0"><span className="block font-medium">{doc.number}</span><span className="block truncate text-sm text-fg-muted">{doc.supplier}</span></span>
                    <span className="flex items-center gap-4"><span className="tabular text-sm font-semibold">{money(doc.amount)}</span><DueDate iso={doc.dueAt} band={dueBand(doc.dueAt, now)} /></span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : <p className="px-4 py-8 text-center text-sm text-fg-muted">{t("overview.noDue")}</p>}
        </Card>
        <Card title={t("overview.activity")} id="activity-title">
          <ol className="divide-y divide-border">
            {d.activity.map((a) => (
              <li key={`${a.docId}-${a.at}-${a.type}`} className="flex items-baseline justify-between gap-4 px-4 py-3 text-sm">
                <span className="min-w-0"><span className="font-medium">{a.by}</span> {t(`activity.${a.type as "approved"}`)} <Link to={`/documents?doc=${a.docId}`} className="font-medium text-accent hover:underline">{a.number}</Link></span>
                <time dateTime={a.at} className="shrink-0 text-xs text-fg-muted">{relative(a.at, now)}</time>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </>
  );
}
