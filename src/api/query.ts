import { DAY } from "./seed";
import type { Band, Department, Doc, HistoryEvent, Program, Status } from "./types";

export type SortKey = "number" | "supplier" | "program" | "department" | "amount" | "dueAt" | "status";
export type Dir = "asc" | "desc";
export type DocQuery = { q?: string; status?: Status[]; programId?: string; department?: Department; sort?: SortKey; dir?: Dir; page?: number; pageSize?: number };
export type DocPage = { rows: Doc[]; total: number; sum: number; page: number; pages: number };

const fold = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const STATUS_ORDER: Record<Status, number> = { pending: 0, rejected: 1, paid: 2 };

export function filterDocs(docs: Doc[], q: DocQuery): Doc[] {
  const term = q.q ? fold(q.q.trim()) : "";
  return docs.filter(
    (d) =>
      (!term || fold(d.number).includes(term) || fold(d.supplier).includes(term)) &&
      (!q.status?.length || q.status.includes(d.status)) &&
      (!q.programId || d.programId === q.programId) &&
      (!q.department || d.department === q.department),
  );
}

export function sortDocs(docs: Doc[], programs: Program[], sort: SortKey = "dueAt", dir: Dir = "asc"): Doc[] {
  const name = new Map(programs.map((p) => [p.id, p.name]));
  const key = (d: Doc): string | number => {
    switch (sort) {
      case "amount": return d.amount;
      case "dueAt": return new Date(d.dueAt).getTime();
      case "status": return STATUS_ORDER[d.status];
      case "program": return name.get(d.programId) ?? "";
      default: return d[sort];
    }
  };
  const sign = dir === "asc" ? 1 : -1;
  return [...docs].sort((a, b) => {
    const x = key(a), y = key(b);
    const c = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), "pt-BR", { numeric: true, sensitivity: "base" });
    return c !== 0 ? c * sign : a.id.localeCompare(b.id);
  });
}

export function queryDocs(docs: Doc[], programs: Program[], q: DocQuery): DocPage {
  const filtered = sortDocs(filterDocs(docs, q), programs, q.sort, q.dir);
  const pageSize = q.pageSize ?? 25;
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const page = Math.min(Math.max(1, q.page ?? 1), pages);
  return { rows: filtered.slice((page - 1) * pageSize, page * pageSize), total: filtered.length, sum: filtered.reduce((a, d) => a + d.amount, 0), page, pages };
}

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

export function dueBand(dueAt: string, now: Date): Band {
  const days = Math.round((startOfDay(new Date(dueAt)) - startOfDay(now)) / DAY);
  if (days < 0) return "overdue";
  if (days === 0) return "today";
  if (days <= 3) return "d3";
  if (days <= 7) return "d7";
  return "ok";
}

const decidedAt = (d: Doc, type: "approved" | "rejected") => d.history.find((h) => h.type === type)?.at;
const monthStart = (d: Date, offset = 0) => new Date(d.getFullYear(), d.getMonth() + offset, 1);
const sameMonth = (iso: string | undefined, m: Date) => !!iso && new Date(iso).getFullYear() === m.getFullYear() && new Date(iso).getMonth() === m.getMonth();

export type Kpi = { value: number; count: number; previous?: number };
export type Overview = {
  paidMonth: Kpi; pending: Kpi; rejected30: Kpi; due7: Kpi;
  series: { month: string; paid: number; pending: number }[];
  byProgram: { id: string; name: string; spent: number; committed: number; budget: number }[];
  dueSoon: Doc[];
  activity: (HistoryEvent & { docId: string; number: string })[];
};

export function overview(docs: Doc[], programs: Program[], now: Date, months = 6): Overview {
  const cur = monthStart(now), prev = monthStart(now, -1);
  const paidIn = (m: Date) => docs.filter((d) => d.status === "paid" && sameMonth(decidedAt(d, "approved"), m));
  const sum = (xs: Doc[]) => xs.reduce((a, d) => a + d.amount, 0);
  const pending = docs.filter((d) => d.status === "pending");
  const rejected = docs.filter((d) => d.status === "rejected" && now.getTime() - new Date(decidedAt(d, "rejected") ?? 0).getTime() <= 30 * DAY);
  const due7 = pending.filter((d) => { const b = dueBand(d.dueAt, now); return b === "today" || b === "d3" || b === "d7"; });
  const series = Array.from({ length: months }, (_, i) => {
    const m = monthStart(now, i - months + 1);
    const issued = docs.filter((d) => sameMonth(d.issuedAt, m));
    return { month: m.toISOString(), paid: sum(issued.filter((d) => d.status === "paid")), pending: sum(issued.filter((d) => d.status === "pending")) };
  });
  const byProgram = programs.map((p) => {
    const mine = docs.filter((d) => d.programId === p.id);
    return { id: p.id, name: p.name, budget: p.budget, spent: sum(mine.filter((d) => d.status === "paid")), committed: sum(mine.filter((d) => d.status === "pending")) };
  });
  const dueSoon = pending.filter((d) => dueBand(d.dueAt, now) !== "ok").sort((a, b) => a.dueAt.localeCompare(b.dueAt)).slice(0, 6);
  const activity = docs
    .flatMap((d) => d.history.filter((h) => h.type !== "created").map((h) => ({ ...h, docId: d.id, number: d.number })))
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 8);
  return {
    paidMonth: { value: sum(paidIn(cur)), count: paidIn(cur).length, previous: sum(paidIn(prev)) },
    pending: { value: sum(pending), count: pending.length },
    rejected30: { value: sum(rejected), count: rejected.length },
    due7: { value: sum(due7), count: due7.length },
    series, byProgram, dueSoon, activity,
  };
}

export type ProgramDetail = { program: Program; spent: number; committed: number; trend: { month: string; spent: number }[]; suppliers: { name: string; amount: number }[] };

export function programDetail(docs: Doc[], program: Program, now: Date): ProgramDetail {
  const mine = docs.filter((d) => d.programId === program.id);
  const paid = mine.filter((d) => d.status === "paid");
  const trend = Array.from({ length: 12 }, (_, i) => {
    const m = monthStart(now, i - 11);
    return { month: m.toISOString(), spent: paid.filter((d) => sameMonth(decidedAt(d, "approved"), m)).reduce((a, d) => a + d.amount, 0) };
  });
  const bySupplier = new Map<string, number>();
  for (const d of paid) bySupplier.set(d.supplier, (bySupplier.get(d.supplier) ?? 0) + d.amount);
  const suppliers = [...bySupplier].map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount).slice(0, 5);
  return { program, spent: paid.reduce((a, d) => a + d.amount, 0), committed: mine.filter((d) => d.status === "pending").reduce((a, d) => a + d.amount, 0), trend, suppliers };
}
