"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { api } from "@/hooks/use-crm";

export function SpaceVerifyButton({ spaceId }: { spaceId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  async function verify() {
    setBusy(true);
    try {
      await api.jsonFetch(`/api/spaces/${spaceId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "active" }),
      });
      toast({ title: "Marked verified", variant: "success" });
      router.refresh();
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button size="sm" variant="outline" onClick={verify} disabled={busy}>
      <ShieldCheck className="size-4" /> {busy ? "…" : "Verify now"}
    </Button>
  );
}
