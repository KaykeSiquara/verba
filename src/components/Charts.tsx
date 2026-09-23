import { useEffect, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { usePrefs } from "../app/prefs";

function useVars(names: string[]) {
  const { isDark } = usePrefs();
  const read = () => names.map((n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim() || "#888");
  const [vals, setVals] = useState(read);
  useEffect(() => setVals(read()), [isDark]);
  return vals;
}

function SrTable({ caption, head, rows }: { caption: string; head: string[]; rows: string[][] }) {
  return (
    <table className="sr-only">
      <caption>{caption}</caption>
      <thead><tr>{head.map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>
      <tbody>{rows.map((r) => <tr key={r[0]}>{r.map((c, i) => (i === 0 ? <th key={i} scope="row">{c}</th> : <td key={i}>{c}</td>))}</tr>)}</tbody>
    </table>
  );
}

const compact = (lang: string) => new Intl.NumberFormat(lang, { notation: "compact", style: "currency", currency: "BRL", maximumFractionDigits: 1 });

export function CashflowChart({ data }: { data: { month: string; paid: number; pending: number }[] }) {
  const { t, month, money, lang } = usePrefs();
  const [c1, c2, grid, muted] = useVars(["--chart-1", "--chart-2", "--border", "--fg-muted"]);
  const rows = data.map((d) => ({ ...d, label: month(d.month), paidR: d.paid / 100, pendingR: d.pending / 100 }));
  const c = compact(lang);
  return (
    <figure className="m-0 p-4">
      <figcaption className="sr-only">{t("overview.cashflowSummary")}</figcaption>
      <div className="h-64" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={rows} margin={{ left: 4, right: 8, top: 8 }} accessibilityLayer={false}>
            <CartesianGrid stroke={grid} vertical={false} />
            <XAxis dataKey="label" tick={{ fill: muted, fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={(v: number) => c.format(v)} tick={{ fill: muted, fontSize: 12 }} axisLine={false} tickLine={false} width={72} />
            <Tooltip formatter={(v) => money(Number(v) * 100)} contentStyle={{ borderRadius: 8 }} />
            <Area type="monotone" dataKey="paidR" name={t("status.paid")} stroke={c1} fill={c1} fillOpacity={0.18} strokeWidth={2} />
            <Area type="monotone" dataKey="pendingR" name={t("status.pending")} stroke={c2} fill={c2} fillOpacity={0.16} strokeWidth={2} strokeDasharray="5 4" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-2 flex gap-4 text-xs text-fg-muted" aria-hidden="true">
        <li className="flex items-center gap-1.5"><span className="h-0.5 w-4" style={{ background: c1 }} />{t("status.paid")}</li>
        <li className="flex items-center gap-1.5"><span className="h-0.5 w-4 border-t-2 border-dashed" style={{ borderColor: c2 }} />{t("status.pending")}</li>
      </ul>
      <SrTable caption={t("overview.cashflow")} head={[t("overview.month"), t("status.paid"), t("status.pending")]} rows={data.map((d) => [month(d.month), money(d.paid), money(d.pending)])} />
    </figure>
  );
}

export function ProgramBars({ data }: { data: { name: string; spent: number; budget: number }[] }) {
  const { t, money, lang } = usePrefs();
  const [c1, grid, muted] = useVars(["--chart-1", "--border", "--fg-muted"]);
  const rows = data.map((d) => ({ name: d.name, spent: d.spent / 100 }));
  const c = compact(lang);
  return (
    <figure className="m-0 p-4">
      <figcaption className="sr-only">{t("overview.byProgramSummary")}</figcaption>
      <div className="h-72" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 16 }} accessibilityLayer={false}>
            <CartesianGrid stroke={grid} horizontal={false} />
            <XAxis type="number" tickFormatter={(v: number) => c.format(v)} tick={{ fill: muted, fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" width={124} tick={{ fill: muted, fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v) => money(Number(v) * 100)} contentStyle={{ borderRadius: 8 }} />
            <Bar dataKey="spent" name={t("programs.spent")} fill={c1} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <SrTable caption={t("overview.byProgram")} head={[t("docs.program"), t("programs.spent"), t("programs.budget")]} rows={data.map((d) => [d.name, money(d.spent), money(d.budget)])} />
    </figure>
  );
}

export function TrendLine({ data }: { data: { month: string; spent: number }[] }) {
  const { t, month, money, lang } = usePrefs();
  const [c1, grid, muted] = useVars(["--chart-1", "--border", "--fg-muted"]);
  const rows = data.map((d) => ({ label: month(d.month), spent: d.spent / 100 }));
  const c = compact(lang);
  return (
    <figure className="m-0 p-4">
      <figcaption className="sr-only">{t("programs.trendSummary")}</figcaption>
      <div className="h-60" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ left: 4, right: 12, top: 8 }} accessibilityLayer={false}>
            <CartesianGrid stroke={grid} vertical={false} />
            <XAxis dataKey="label" tick={{ fill: muted, fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={(v: number) => c.format(v)} tick={{ fill: muted, fontSize: 12 }} axisLine={false} tickLine={false} width={72} />
            <Tooltip formatter={(v) => money(Number(v) * 100)} contentStyle={{ borderRadius: 8 }} />
            <Line type="monotone" dataKey="spent" name={t("programs.spent")} stroke={c1} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <SrTable caption={t("programs.trend")} head={[t("overview.month"), t("programs.spent")]} rows={data.map((d) => [month(d.month), money(d.spent)])} />
    </figure>
  );
}
