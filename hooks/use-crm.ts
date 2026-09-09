"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed (${res.status})`);
  }
  return res.json();
}

export const api = { jsonFetch };

/* ---------------- Operators & Spaces ---------------- */

export function useOperators(q = "") {
  return useQuery({
    queryKey: ["operators", q],
    queryFn: () =>
      jsonFetch<any[]>(`/api/operators${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  });
}

export function useSpaces(params: Record<string, string>) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v),
  ).toString();
  return useQuery({
    queryKey: ["spaces", params],
    queryFn: () =>
      jsonFetch<{ rows: any[]; total: number }>(`/api/spaces?${qs}`),
  });
}

export function useMatchedSpaces(enquiryId: string, enabled = true) {
  return useQuery({
    enabled: enabled && !!enquiryId,
    queryKey: ["spaces", "match", enquiryId],
    queryFn: () =>
      jsonFetch<any[]>(`/api/spaces/search?enquiryId=${enquiryId}&limit=30`),
  });
}

/* ---------------- Shortlists ---------------- */

export function useShortlists(enquiryId?: string) {
  return useQuery({
    queryKey: ["shortlists", enquiryId ?? "all"],
    queryFn: () =>
      jsonFetch<any[]>(
        `/api/shortlists${enquiryId ? `?enquiryId=${enquiryId}` : ""}`,
      ),
  });
}

/* ---------------- Visits ---------------- */

export function useVisits(params: Record<string, string>) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v),
  ).toString();
  return useQuery({
    queryKey: ["visits", params],
    queryFn: () => jsonFetch<any[]>(`/api/visits?${qs}`),
  });
}

/* ---------------- Deals ---------------- */

export function useDeals(params: Record<string, string> = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v),
  ).toString();
  return useQuery({
    queryKey: ["deals", params],
    queryFn: () => jsonFetch<any[]>(`/api/deals?${qs}`),
  });
}

/* ---------------- Messages ---------------- */

export function useThreads() {
  return useQuery({
    queryKey: ["threads"],
    queryFn: () => jsonFetch<any[]>(`/api/messages`),
  });
}

export function useThread(enquiryId: string) {
  return useQuery({
    enabled: !!enquiryId,
    queryKey: ["thread", enquiryId],
    queryFn: () => jsonFetch<any[]>(`/api/messages?enquiryId=${enquiryId}`),
  });
}

export function useTemplates() {
  return useQuery({
    queryKey: ["templates"],
    queryFn: () => jsonFetch<any[]>(`/api/messages/templates`),
  });
}

/* ---------------- Reports ---------------- */

export function useReport(name: string) {
  return useQuery({
    queryKey: ["report", name],
    queryFn: () =>
      jsonFetch<{ report: string; data: any }>(`/api/reports?report=${name}`),
  });
}

/* ---------------- Settings ---------------- */

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: () => jsonFetch<any>(`/api/settings`),
  });
}

/* ---------------- Team ---------------- */

export function useTeam() {
  return useQuery({
    queryKey: ["team"],
    queryFn: () => jsonFetch<any[]>(`/api/team`),
  });
}

/* ---------------- generic mutation ---------------- */

export function useApiMutation<TInput = unknown, TOut = unknown>(
  fn: (input: TInput) => Promise<TOut>,
  invalidate: string[][] = [],
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      invalidate.forEach((key) => qc.invalidateQueries({ queryKey: key }));
    },
  });
}
