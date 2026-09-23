export type Status = "paid" | "pending" | "rejected";
export type Department = "payroll" | "hr" | "procurement" | "reporting";
export type DocKind = "invoice" | "receipt" | "payroll";
export type EventType = "created" | "submitted" | "approved" | "rejected";
export type HistoryEvent = { at: string; type: EventType; by: string; note?: string };
export type Doc = {
  id: string; number: string; kind: DocKind; supplier: string; programId: string; department: Department;
  amount: number; issuedAt: string; dueAt: string; status: Status; history: HistoryEvent[];
};
export type Program = { id: string; code: string; name: string; budget: number; manager: string; hue: number };
export type Role = "admin" | "approver" | "viewer";
export type Member = { id: string; name: string; email: string; role: Role; status: "active" | "invited"; lastActiveAt: string | null };
export type Profile = { name: string; email: string; title: string };
export type Band = "overdue" | "today" | "d3" | "d7" | "ok";
