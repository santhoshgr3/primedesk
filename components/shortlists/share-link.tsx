"use client";

import { useState } from "react";
import { Link2, Check, Copy, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm";
import { api } from "@/hooks/use-crm";

export function ShareLinkButton({
  shortlistId,
  existingToken,
  revoked,
  variant = "outline",
}: {
  shortlistId: string;
  existingToken?: string | null;
  revoked?: boolean;
  variant?: "outline" | "default";
}) {
  const { toast } = useToast();
  const confirm = useConfirm();
  const [url, setUrl] = useState(
    existingToken && !revoked
      ? `${typeof window !== "undefined" ? window.location.origin : ""}/s/${existingToken}`
      : "",
  );
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  async function generate() {
    setBusy(true);
    try {
      const res = await api.jsonFetch<{ url: string; token: string }>(
        `/api/shortlists/${shortlistId}/share`,
        { method: "POST" },
      );
      const full =
        res.url && res.url.startsWith("http")
          ? res.url
          : `${window.location.origin}/s/${res.token}`;
      setUrl(full);
      await copy(full);
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "error" });
    } finally {
      setBusy(false);
    }
  }

  async function revoke() {
    const ok = await confirm({
      title: "Revoke client link?",
      body: "The client won't be able to open it anymore. You can generate a new one later.",
      confirmText: "Revoke",
      destructive: true,
    });
    if (!ok) return;
    setBusy(true);
    try {
      await api.jsonFetch(`/api/shortlists/${shortlistId}/share`, {
        method: "DELETE",
      });
      setUrl("");
      toast({ title: "Client link revoked", variant: "success" });
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "error" });
    } finally {
      setBusy(false);
    }
  }

  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast({ title: "Client link copied", variant: "success" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Copy failed — select the link manually", variant: "error" });
    }
  }

  if (url) {
    return (
      <div className="flex items-center gap-2">
        <input
          readOnly
          value={url}
          onFocus={(e) => e.currentTarget.select()}
          className="h-9 w-52 rounded-md border border-input bg-muted px-2 text-xs"
        />
        <Button size="sm" variant="outline" onClick={() => copy(url)}>
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={revoke}
          disabled={busy}
          title="Revoke link"
        >
          <Ban className="size-4" />
        </Button>
      </div>
    );
  }

  return (
    <Button size="sm" variant={variant} onClick={generate} disabled={busy}>
      <Link2 className="size-4" />
      {busy ? "Generating…" : revoked ? "New client link" : "Client link"}
    </Button>
  );
}
