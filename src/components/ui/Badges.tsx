import type { Band, Status } from "../../api/types";
import { usePrefs } from "../../app/prefs";
import { cn } from "../../lib/cn";

const STATUS: Record<Status, { symbol: string; cls: string }> = {
  paid: { symbol: "●", cls: "bg-paid-soft text-paid" },
  pending: { symbol: "◐", cls: "bg-pending-soft text-pending" },
  rejected: { symbol: "◆", cls: "bg-rejected-soft text-rejected" },
};
export function StatusBadge({ status }: { status: Status }) {
  const { t } = usePrefs();
  const s = STATUS[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap", s.cls)}>
      <span aria-hidden="true">{s.symbol}</span>
      {t(`status.${status}`)}
    </span>
  );
}

const BAND: Record<Band, string> = {
  ok: "text-fg-muted",
  d7: "border-l-4 border-warn-1 pl-2",
  d3: "border-l-4 border-warn-2 pl-2",
  today: "border-l-4 border-warn-3 pl-2 font-semibold",
  overdue: "border-l-4 border-warn-3 pl-2 font-bold",
};
export function DueDate({ iso, band }: { iso: string; band: Band | null }) {
  const { t, date } = usePrefs();
  return (
    <span className={cn("inline-flex flex-col leading-tight tabular", band ? BAND[band] : "text-fg-muted")}>
      <span>{band === "overdue" && <span aria-hidden="true">! </span>}{date(iso)}</span>
      {band && band !== "ok" && <span className="text-xs text-fg-muted">{t(`band.${band}`)}</span>}
    </span>
  );
}
