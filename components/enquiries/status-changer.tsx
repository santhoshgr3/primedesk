"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { ENQUIRY_STATUSES, ENQUIRY_STATUS_META } from "@/lib/constants";

export function StatusChanger({
  enquiryId,
  current,
}: {
  enquiryId: string;
  current: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  async function onChange(next: string) {
    if (!next || next === current) return;
    setSaving(true);
    const res = await fetch(`/api/enquiries/${enquiryId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setSaving(false);
    if (!res.ok) {
      toast({ title: "Status change failed", variant: "error" });
      return;
    }
    toast({
      title: `Moved to ${ENQUIRY_STATUS_META[next]?.label ?? next}`,
      description: "A follow-up task was auto-created.",
      variant: "success",
    });
    router.refresh();
  }

  return (
    <Select
      value={current}
      disabled={saving}
      onChange={(e) => onChange(e.target.value)}
      className="w-52"
    >
      {ENQUIRY_STATUSES.map((s) => (
        <option key={s} value={s}>
          {ENQUIRY_STATUS_META[s]?.label ?? s}
        </option>
      ))}
    </Select>
  );
}
