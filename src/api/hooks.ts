import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";
import type { DocQuery } from "./query";
import type { Profile, Role } from "./types";

export const keys = {
  documents: (q: DocQuery) => ["documents", q] as const,
  document: (id: string) => ["document", id] as const,
  overview: (months: number) => ["overview", months] as const,
  programs: ["programs"] as const,
  program: (id: string) => ["program", id] as const,
  members: ["members"] as const,
  profile: ["profile"] as const,
};

export const useDocuments = (q: DocQuery) => useQuery({ queryKey: keys.documents(q), queryFn: () => api.documents(q), placeholderData: keepPreviousData });
export const useDocument = (id: string | null) => useQuery({ queryKey: keys.document(id ?? ""), queryFn: () => api.document(id!), enabled: !!id });
export const useOverview = (months: number) => useQuery({ queryKey: keys.overview(months), queryFn: () => api.overview(months) });
export const usePrograms = () => useQuery({ queryKey: keys.programs, queryFn: api.programs });
export const useProgram = (id: string) => useQuery({ queryKey: keys.program(id), queryFn: () => api.program(id) });
export const useMembers = () => useQuery({ queryKey: keys.members, queryFn: api.members });
export const useProfile = () => useQuery({ queryKey: keys.profile, queryFn: api.profile });

export function useSetStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { ids: string[]; status: "paid" | "rejected"; note?: string }) => api.setStatus(v.ids, v.status, v.note),
    onSuccess: () => qc.invalidateQueries({ predicate: (q) => ["documents", "document", "overview", "programs", "program"].includes(String(q.queryKey[0])) }),
  });
}
export function useInvite() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.invite, onSuccess: () => qc.invalidateQueries({ queryKey: keys.members }) });
}
export function useUpdateRole() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (v: { id: string; role: Role }) => api.updateRole(v.id, v.role), onSuccess: () => qc.invalidateQueries({ queryKey: keys.members }) });
}
export function useRemoveMember() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.removeMember, onSuccess: () => qc.invalidateQueries({ queryKey: keys.members }) });
}
export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (p: Profile) => api.updateProfile(p), onSuccess: (p) => qc.setQueryData(keys.profile, p) });
}
