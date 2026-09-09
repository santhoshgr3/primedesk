"use client";

import { useQuery } from "@tanstack/react-query";

export type EnquiryRow = {
  id: string;
  companyName: string;
  contactName: string;
  contactPhone: string;
  seatsNeeded: string;
  city: string;
  microMarket: string | null;
  workspaceType: string;
  status: string;
  priority: string;
  source: string;
  createdAt: string;
  lastActivityAt: string | null;
  assignedTo: { id: string; name: string } | null;
  _count: { shortlists: number; visits: number; tasks: number };
};

export function useEnquiries(params: Record<string, string>) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v),
  ).toString();

  return useQuery({
    queryKey: ["enquiries", params],
    queryFn: async (): Promise<{
      rows: EnquiryRow[];
      total: number;
      page: number;
      pageSize: number;
    }> => {
      const res = await fetch(`/api/enquiries?${qs}`);
      if (!res.ok) throw new Error("Failed to load enquiries");
      return res.json();
    },
  });
}

export function useAdvisors() {
  return useQuery({
    queryKey: ["users", "advisors"],
    queryFn: async (): Promise<
      { id: string; name: string; role: string; city: string | null }[]
    > => {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("Failed to load users");
      return res.json();
    },
  });
}
