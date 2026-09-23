import * as store from "./db";
import { overview, programDetail, queryDocs, type DocQuery } from "./query";
import type { Profile, Role } from "./types";

export class NetworkError extends Error { constructor() { super("network"); } }

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const latency = () => (import.meta.env.MODE === "test" ? 0 : 160 + Math.random() * 320);
function failing() {
  try { return JSON.parse(localStorage.getItem("verba:prefs") || "{}").simulateErrors === true; } catch { return false; }
}
async function call<T>(fn: () => T): Promise<T> {
  await sleep(latency());
  if (failing()) throw new NetworkError();
  return structuredClone(fn());
}

export const api = {
  documents: (q: DocQuery) => call(() => { const s = store.db(); return queryDocs(s.docs, s.programs, q); }),
  document: (id: string) => call(() => { const d = store.db().docs.find((x) => x.id === id); if (!d) throw new store.DomainError("notFound"); return d; }),
  overview: (months: number) => call(() => { const s = store.db(); return overview(s.docs, s.programs, new Date(), months); }),
  programs: () => call(() => { const s = store.db(); return overview(s.docs, s.programs, new Date(), 1).byProgram.map((b) => ({ ...s.programs.find((p) => p.id === b.id)!, spent: b.spent, committed: b.committed })); }),
  program: (id: string) => call(() => { const s = store.db(); const p = s.programs.find((x) => x.id === id); if (!p) throw new store.DomainError("notFound"); return programDetail(s.docs, p, new Date()); }),
  members: () => call(() => store.db().members),
  profile: () => call(() => store.db().profile),
  setStatus: (ids: string[], status: "paid" | "rejected", note?: string) => call(() => store.setStatus(ids, status, store.db().profile.name, note)),
  invite: (input: { name: string; email: string; role: Role }) => call(() => store.invite(input)),
  updateRole: (id: string, role: Role) => call(() => store.updateRole(id, role)),
  removeMember: (id: string) => call(() => store.removeMember(id)),
  updateProfile: (p: Profile) => call(() => store.updateProfile(p)),
};
