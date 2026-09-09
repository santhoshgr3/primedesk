"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { useAdvisors } from "@/hooks/use-enquiries";

export function AssignAdvisor({
  enquiryId,
  currentId,
}: {
  enquiryId: string;
  currentId: string | null;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { data: advisors } = useAdvisors();
  const [saving, setSaving] = useState(false);

  async function onChange(id: string) {
    if (!id || id === currentId) return;
    setSaving(true);
    const res = await fetch(`/api/enquiries/${enquiryId}/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignedToId: id }),
    });
    setSaving(false);
    if (!res.ok) {
      toast({ title: "Assignment failed", variant: "error" });
      return;
    }
    toast({ title: "Advisor assigned", variant: "success" });
    router.refresh();
  }

  return (
    <Select
      value={currentId ?? ""}
      disabled={saving}
      placeholder="Unassigned"
      onChange={(e) => onChange(e.target.value)}
      className="w-52"
    >
      {advisors?.map((a) => (
        <option key={a.id} value={a.id}>
          {a.name}
        </option>
      ))}
    </Select>
  );
}
