import { MEMBERS, PROFILE, PROGRAMS, seedDocs } from "./seed";
import type { Doc, HistoryEvent, Member, Profile, Program, Role, Status } from "./types";

type Store = { docs: Doc[]; programs: Program[]; members: Member[]; profile: Profile; changed: Set<string> };
type Saved = { patches: Record<string, { status: Status; history: HistoryEvent[] }>; members: Member[]; profile: Profile };

const KEY = "verba:db:v1";
let store: Store | null = null;

export class DomainError extends Error {
  constructor(public code: "emailTaken" | "notPending" | "notFound" | "invalid") { super(code); }
}

function read(): Saved | null {
  try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch { return null; }
}
function persist(s: Store) {
  const patches: Saved["patches"] = {};
  for (const d of s.docs) if (s.changed.has(d.id)) patches[d.id] = { status: d.status, history: d.history };
  try { localStorage.setItem(KEY, JSON.stringify({ patches, members: s.members, profile: s.profile } satisfies Saved)); } catch {}
}

export function db(now = new Date()): Store {
  if (store) return store;
  const saved = read();
  const docs = seedDocs(now);
  const changed = new Set<string>();
  if (saved) for (const d of docs) { const p = saved.patches[d.id]; if (p) { d.status = p.status; d.history = p.history; changed.add(d.id); } }
  const members = saved?.members ?? MEMBERS.map((m, i) => ({ ...m, lastActiveAt: m.status === "active" ? new Date(now.getTime() - (i * 7 + 1) * 3_600_000).toISOString() : null }));
  store = { docs, programs: PROGRAMS, members, profile: saved?.profile ?? PROFILE, changed };
  return store;
}

export function reloadDb() { store = null; }

export function resetDb() {
  store = null;
  try { localStorage.removeItem(KEY); } catch {}
}

export function setStatus(ids: string[], status: "paid" | "rejected", by: string, note?: string, now = new Date()): Doc[] {
  const s = db();
  const targets = ids.map((id) => s.docs.find((d) => d.id === id));
  if (targets.some((d) => !d)) throw new DomainError("notFound");
  if (targets.some((d) => d!.status !== "pending")) throw new DomainError("notPending");
  if (status === "rejected" && (!note || note.trim().length < 10)) throw new DomainError("invalid");
  for (const d of targets as Doc[]) {
    d.status = status;
    d.history = [...d.history, { at: now.toISOString(), type: status === "paid" ? "approved" : "rejected", by, ...(note ? { note: note.trim() } : {}) }];
    s.changed.add(d.id);
  }
  persist(s);
  return targets as Doc[];
}

export function invite(input: { name: string; email: string; role: Role }): Member {
  const s = db();
  const email = input.email.trim().toLowerCase();
  if (!input.name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new DomainError("invalid");
  if (s.members.some((m) => m.email.toLowerCase() === email)) throw new DomainError("emailTaken");
  const member: Member = { id: `m${Date.now().toString(36)}`, name: input.name.trim(), email, role: input.role, status: "invited", lastActiveAt: null };
  s.members = [...s.members, member];
  persist(s);
  return member;
}

export function updateRole(id: string, role: Role): Member {
  const s = db();
  const m = s.members.find((x) => x.id === id);
  if (!m) throw new DomainError("notFound");
  s.members = s.members.map((x) => (x.id === id ? { ...x, role } : x));
  persist(s);
  return { ...m, role };
}

export function removeMember(id: string) {
  const s = db();
  if (id === "m1") throw new DomainError("invalid");
  s.members = s.members.filter((m) => m.id !== id);
  persist(s);
}

export function updateProfile(p: Profile): Profile {
  const s = db();
  if (!p.name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email.trim())) throw new DomainError("invalid");
  s.profile = { name: p.name.trim(), email: p.email.trim(), title: p.title.trim() };
  persist(s);
  return s.profile;
}
