import { describe, expect, it } from "vitest";
import { dueBand, filterDocs, overview, programDetail, queryDocs } from "./query";
import { PROGRAMS, seedDocs } from "./seed";

const NOW = new Date("2026-09-23T12:00:00Z");
const docs = seedDocs(NOW);

describe("seed", () => {
  it("is deterministic for the same date", () => expect(seedDocs(NOW)).toEqual(docs));
  it("creates 480 documents across all eight programs", () => {
    expect(docs).toHaveLength(480);
    expect(new Set(docs.map((d) => d.programId)).size).toBe(8);
  });
  it("gives every decided document a matching history event", () => {
    for (const d of docs.filter((x) => x.status !== "pending")) expect(d.history.at(-1)!.type).toBe(d.status === "paid" ? "approved" : "rejected");
  });
});

describe("queries", () => {
  it("searches number and supplier ignoring accents and case", () => {
    const hits = filterDocs(docs, { q: "grafica" });
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.every((d) => d.supplier === "Gráfica Horizonte")).toBe(true);
  });
  it("combines status, program and department filters", () => {
    const hits = filterDocs(docs, { status: ["rejected"], programId: "p3", department: "procurement" });
    expect(hits.every((d) => d.status === "rejected" && d.programId === "p3" && d.department === "procurement")).toBe(true);
  });
  it("sorts amounts both ways", () => {
    const asc = queryDocs(docs, PROGRAMS, { sort: "amount", dir: "asc", pageSize: 480 }).rows.map((d) => d.amount);
    expect(asc).toEqual([...asc].sort((a, b) => a - b));
    const desc = queryDocs(docs, PROGRAMS, { sort: "amount", dir: "desc", pageSize: 5 }).rows.map((d) => d.amount);
    expect(desc[0]).toBe(Math.max(...docs.map((d) => d.amount)));
  });
  it("sorts document numbers numerically, not as text", () => {
    const nums = queryDocs(docs, PROGRAMS, { sort: "number", dir: "asc", pageSize: 480, q: "NF" }).rows.map((d) => Number(d.number.split(" ")[1]));
    expect(nums).toEqual([...nums].sort((a, b) => a - b));
  });
  it("paginates and totals the whole filtered set, not just the page", () => {
    const pending = docs.filter((d) => d.status === "pending");
    const page = queryDocs(docs, PROGRAMS, { status: ["pending"], pageSize: 10, page: 2 });
    expect(page.rows).toHaveLength(10);
    expect(page.total).toBe(pending.length);
    expect(page.sum).toBe(pending.reduce((a, d) => a + d.amount, 0));
    expect(page.pages).toBe(Math.ceil(pending.length / 10));
  });
  it("clamps a page number past the end", () => expect(queryDocs(docs, PROGRAMS, { pageSize: 100, page: 99 }).page).toBe(5));
});

describe("deadline bands", () => {
  const at = (days: number) => new Date(NOW.getTime() + days * 86_400_000).toISOString();
  it.each([[-1, "overdue"], [0, "today"], [1, "d3"], [3, "d3"], [4, "d7"], [7, "d7"], [8, "ok"]])("%i days away is %s", (days, band) => expect(dueBand(at(days as number), NOW)).toBe(band));
});

describe("overview", () => {
  const o = overview(docs, PROGRAMS, NOW, 6);
  it("counts pending documents exactly", () => expect(o.pending.count).toBe(docs.filter((d) => d.status === "pending").length));
  it("returns one point per month, oldest first", () => {
    expect(o.series).toHaveLength(6);
    expect(new Date(o.series[5].month).getMonth()).toBe(NOW.getMonth());
  });
  it("lists only pending documents that are overdue or due within 7 days", () => {
    for (const d of o.dueSoon) { expect(d.status).toBe("pending"); expect(dueBand(d.dueAt, NOW)).not.toBe("ok"); }
  });
  it("keeps program spending consistent with the documents", () => {
    const p3 = o.byProgram.find((b) => b.id === "p3")!;
    expect(p3.spent).toBe(docs.filter((d) => d.programId === "p3" && d.status === "paid").reduce((a, d) => a + d.amount, 0));
    const detail = programDetail(docs, PROGRAMS[2], NOW);
    expect(detail.spent).toBe(p3.spent);
    expect(detail.suppliers.length).toBeLessThanOrEqual(5);
  });
});
