"use client";

import { useState } from "react";
import Link from "next/link";
import { Send, Megaphone } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import {
  api,
  useThreads,
  useThread,
  useTemplates,
} from "@/hooks/use-crm";
import { useQueryClient } from "@tanstack/react-query";
import { timeAgo } from "@/lib/utils";
import { CITIES } from "@/lib/constants";

export default function CommunicationsPage() {
  const { data: threads, isLoading } = useThreads();
  const [active, setActive] = useState<any>(null);
  const [bulkOpen, setBulkOpen] = useState(false);

  return (
    <div>
      <PageHeader
        title="Communications"
        description="WhatsApp & email threads per enquiry. Sends are logged to the timeline."
        action={
          <Button variant="outline" onClick={() => setBulkOpen(true)}>
            <Megaphone className="size-4" /> Bulk WhatsApp
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <Card className="overflow-hidden">
          <div className="border-b p-3 text-sm font-medium">Threads</div>
          <div className="max-h-[70vh] divide-y overflow-y-auto">
            {isLoading && (
              <p className="p-4 text-sm text-muted-foreground">Loading…</p>
            )}
            {threads?.length === 0 && !isLoading && (
              <p className="p-4 text-sm text-muted-foreground">
                No messages yet.
              </p>
            )}
            {threads?.map((t: any) => (
              <button
                key={t.id}
                onClick={() => setActive(t.enquiry)}
                className={`block w-full p-3 text-left text-sm hover:bg-accent ${
                  active?.id === t.enquiry.id ? "bg-accent" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{t.enquiry.companyName}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {timeAgo(t.sentAt)}
                  </span>
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {t.direction === "inbound" ? "↩ " : "→ "}
                  {t.content}
                </p>
              </button>
            ))}
          </div>
        </Card>

        {active ? (
          <Conversation enquiry={active} />
        ) : (
          <Card>
            <CardContent className="flex h-full min-h-[300px] items-center justify-center text-sm text-muted-foreground">
              Select a thread to view the conversation.
            </CardContent>
          </Card>
        )}
      </div>

      <BulkDialog open={bulkOpen} onClose={() => setBulkOpen(false)} />
    </div>
  );
}

function Conversation({ enquiry }: { enquiry: any }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: messages } = useThread(enquiry.id);
  const { data: templates } = useTemplates();
  const [channel, setChannel] = useState("whatsapp");
  const [templateKey, setTemplateKey] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  async function send() {
    setBusy(true);
    try {
      await api.jsonFetch("/api/messages", {
        method: "POST",
        body: JSON.stringify({
          enquiryId: enquiry.id,
          channel,
          templateKey: templateKey || undefined,
          body: templateKey ? undefined : body,
        }),
      });
      setBody("");
      setTemplateKey("");
      qc.invalidateQueries({ queryKey: ["thread", enquiry.id] });
      qc.invalidateQueries({ queryKey: ["threads"] });
      toast({ title: "Sent", variant: "success" });
    } catch (err: any) {
      toast({ title: "Send failed", description: err.message, variant: "error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="flex flex-col">
      <div className="flex items-center justify-between border-b p-3">
        <div>
          <p className="font-medium">{enquiry.companyName}</p>
          <p className="text-xs text-muted-foreground">
            {enquiry.contactName} · {enquiry.contactPhone}
          </p>
        </div>
        <Link
          href={`/enquiries/${enquiry.id}`}
          className="text-xs font-medium text-primary hover:underline"
        >
          Open enquiry →
        </Link>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-4" style={{ maxHeight: "48vh" }}>
        {messages?.map((m: any) => (
          <div
            key={m.id}
            className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
              m.direction === "outbound"
                ? "ml-auto bg-primary text-primary-foreground"
                : "bg-muted"
            }`}
          >
            <p>{m.content}</p>
            <p className="mt-1 text-[10px] opacity-70">
              {m.channel} · {timeAgo(m.sentAt)}
            </p>
          </div>
        ))}
        {messages?.length === 0 && (
          <p className="text-sm text-muted-foreground">No messages in this thread.</p>
        )}
      </div>

      <div className="space-y-2 border-t p-3">
        <div className="flex gap-2">
          <Select value={channel} onChange={(e) => setChannel(e.target.value)} className="w-32">
            <option value="whatsapp">WhatsApp</option>
            <option value="email">Email</option>
          </Select>
          <Select
            value={templateKey}
            onChange={(e) => setTemplateKey(e.target.value)}
            placeholder="Free text"
            className="flex-1"
          >
            {templates?.map((t: any) => (
              <option key={t.key} value={t.key}>
                {t.name}
              </option>
            ))}
          </Select>
        </div>
        {!templateKey && (
          <Textarea
            rows={2}
            placeholder="Type a message…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        )}
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={send}
            disabled={busy || (!templateKey && !body.trim())}
          >
            <Send className="size-4" /> Send
          </Button>
        </div>
      </div>
    </Card>
  );
}

function BulkDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const { data: templates } = useTemplates();
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await api.jsonFetch<any>("/api/messages/bulk", {
        method: "POST",
        body: JSON.stringify({
          templateKey: fd.get("templateKey"),
          filter: {
            city: fd.get("city") || undefined,
            status: fd.get("status") || undefined,
            shortlistOlderThanDays: fd.get("days")
              ? Number(fd.get("days"))
              : undefined,
            noResponse: fd.get("noResponse") === "on",
          },
          limit: 200,
        }),
      });
      toast({
        title: `Sent to ${res.sent} enquiries`,
        description: `${res.matched} matched the filter`,
        variant: "success",
      });
      onClose();
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Bulk WhatsApp"
      description="Send an approved template to a filtered list of enquiries."
    >
      <form onSubmit={submit} className="space-y-3">
        <div className="space-y-1.5">
          <Label>Template *</Label>
          <Select name="templateKey" required placeholder="Select template">
            {templates?.map((t: any) => (
              <option key={t.key} value={t.key}>
                {t.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>City</Label>
            <Select name="city" placeholder="Any">
              {CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select name="status" placeholder="Any">
              <option value="SHORTLIST_SENT">Shortlist Sent</option>
              <option value="VISIT_DONE">Visit Done</option>
              <option value="NEGOTIATION">Negotiation</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Shortlist older than (days)</Label>
            <Input name="days" type="number" min={0} placeholder="e.g. 3" />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="noResponse" />
          Only where client hasn&apos;t responded
        </label>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? "Sending…" : "Send bulk"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
