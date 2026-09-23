import { ArrowLeft } from "lucide-react";
import { Link, useParams } from "react-router";
import { useProgram, usePrograms } from "../api/hooks";
import { usePrefs } from "../app/prefs";
import { TrendLine } from "../components/Charts";
import { buttonClass } from "../components/ui/Button";
import { PageHeader } from "../components/ui/PageHeader";
import { Card, ErrorState, Loading, Skeleton } from "../components/ui/States";
import { cn } from "../lib/cn";

function Budget({ spent, committed, budget }: { spent: number; committed: number; budget: number }) {
  const { t, percent } = usePrefs();
  const s = Math.min(1, spent / budget), c = Math.min(1 - s, committed / budget);
  const over = spent > budget;
  return (
    <div>
      <div className="flex h-2 overflow-hidden rounded-full bg-surface-2" aria-hidden="true">
        <div className={cn("h-full", over ? "bg-rejected" : "bg-accent")} style={{ width: `${s * 100}%` }} />
        <div className="h-full bg-warn-2" style={{ width: `${c * 100}%` }} />
      </div>
      <p className={cn("mt-2 text-xs", over ? "font-semibold text-rejected" : "text-fg-muted")}>{over ? `◆ ${t("programs.over")}, ` : ""}{t("programs.used", { pct: percent(spent / budget) })}</p>
    </div>
  );
}

export function ProgramsPage() {
  const { t, money } = usePrefs();
  const q = usePrograms();
  return (
    <>
      <PageHeader title={t("programs.title")} />
      {q.isError ? <Card><ErrorState onRetry={() => q.refetch()} /></Card> : !q.data ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-44" />)}</div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {q.data.map((p) => (
            <li key={p.id} className="relative flex flex-col gap-4 rounded-xl border border-border bg-surface p-4 hover:border-border-strong">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-semibold"><Link to={`/programs/${p.id}`} className="after:absolute after:inset-0 hover:underline">{p.name}</Link></h2>
                  <p className="text-sm text-fg-muted">{t("programs.manager")}: {p.manager}</p>
                </div>
                <span className="rounded-md bg-surface-2 px-2 py-0.5 font-mono text-xs text-fg-muted">{p.code}</span>
              </div>
              <Budget spent={p.spent} committed={p.committed} budget={p.budget} />
              <dl className="grid grid-cols-3 gap-2 text-xs">
                <div><dt className="text-fg-muted">{t("programs.spent")}</dt><dd className="font-semibold tabular">{money(p.spent)}</dd></div>
                <div><dt className="text-fg-muted">{t("programs.committed")}</dt><dd className="font-semibold tabular">{money(p.committed)}</dd></div>
                <div><dt className="text-fg-muted">{t("programs.budget")}</dt><dd className="font-semibold tabular">{money(p.budget)}</dd></div>
              </dl>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export function ProgramPage() {
  const { t, money } = usePrefs();
  const { id = "" } = useParams();
  const q = useProgram(id);
  const back = <Link to="/programs" className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline"><ArrowLeft className="size-4" aria-hidden="true" />{t("programs.back")}</Link>;
  if (q.isError) return <>{back}<Card><ErrorState onRetry={() => q.refetch()} /></Card></>;
  if (!q.data) return <>{back}<Skeleton className="mb-6 h-9 w-64" /><Card><Loading rows={6} /></Card></>;
  const { program, spent, committed, trend, suppliers } = q.data;
  const stats: [string, number][] = [[t("programs.budget"), program.budget], [t("programs.spent"), spent], [t("programs.committed"), committed], [t("programs.available"), program.budget - spent - committed]];
  return (
    <>
      {back}
      <PageHeader title={program.name} subtitle={`${t("programs.manager")}: ${program.manager}`} actions={<Link to={`/documents?program=${program.id}`} className={buttonClass("secondary")}>{t("programs.viewDocs")}</Link>} />
      <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(([label, v]) => (
          <div key={label} className="rounded-xl border border-border bg-surface p-4"><dt className="text-sm text-fg-muted">{label}</dt><dd className={cn("mt-1 text-2xl font-semibold tabular", v < 0 && "text-rejected")}>{money(v)}</dd></div>
        ))}
      </dl>
      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card title={t("programs.trend")} id="trend-title"><TrendLine data={trend} /></Card>
        <Card title={t("programs.suppliers")} id="suppliers-title">
          <ol className="divide-y divide-border">
            {suppliers.map((s, i) => (
              <li key={s.name} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <span className="flex min-w-0 items-center gap-3"><span className="w-4 text-fg-muted tabular">{i + 1}</span><span className="truncate">{s.name}</span></span>
                <span className="font-semibold tabular">{money(s.amount)}</span>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </>
  );
}
