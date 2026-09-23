import { describe, expect, it } from "vitest";
import { db, DomainError, invite, reloadDb, removeMember, setStatus, updateProfile } from "./db";

const firstPending = () => db().docs.find((d) => d.status === "pending")!;

describe("database", () => {
  it("approves a pending document and records who did it", () => {
    const d = firstPending();
    setStatus([d.id], "paid", "Marina Duarte");
    const after = db().docs.find((x) => x.id === d.id)!;
    expect(after.status).toBe("paid");
    expect(after.history.at(-1)).toMatchObject({ type: "approved", by: "Marina Duarte" });
  });
  it("refuses to decide a document twice", () => {
    const d = firstPending();
    setStatus([d.id], "paid", "Marina Duarte");
    expect(() => setStatus([d.id], "rejected", "Marina Duarte", "Nota sem CNPJ do fornecedor")).toThrowError(DomainError);
  });
  it("requires a real reason to reject", () => {
    expect(() => setStatus([firstPending().id], "rejected", "Marina Duarte", "curto")).toThrowError(DomainError);
  });
  it("keeps changes across a reload", () => {
    const d = firstPending();
    setStatus([d.id], "rejected", "Marina Duarte", "Despesa fora do período do convênio.");
    reloadDb();
    expect(db().docs.find((x) => x.id === d.id)!.status).toBe("rejected");
  });
  it("rejects a duplicate invitation, whatever the case of the email", () => {
    expect(() => invite({ name: "Outra Rita", email: "RITA@semear.example", role: "viewer" })).toThrow(expect.objectContaining({ code: "emailTaken" }));
    expect(invite({ name: "Joana Reis", email: "joana@semear.example", role: "viewer" }).status).toBe("invited");
  });
  it("never removes the account owner", () => expect(() => removeMember("m1")).toThrowError(DomainError));
  it("validates the profile", () => {
    expect(() => updateProfile({ name: " ", email: "x@y.z", title: "" })).toThrowError(DomainError);
    expect(updateProfile({ name: " Marina D. ", email: "marina@semear.example", title: "Diretora" }).name).toBe("Marina D.");
  });
});
