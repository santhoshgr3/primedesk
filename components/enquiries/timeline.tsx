"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Phone,
  MessageCircle,
  Mail,
  StickyNote,
  RefreshCw,
  FileText,
  CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { timeAgo } from "@/lib/utils";

type Activity = {
  id: string;
  type: string;
  description: string;
  outcome: string | null;
  createdAt: string;
};

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  call: Phone,
  whatsapp: MessageCircle,
  email: Mail,
  note: StickyNote,
  status_change: RefreshCw,
  shortlist_sent: FileText,
  visit_scheduled: CalendarDays,
};

export function Timeline({
  enquiryId,
  initial,
}: {
  enquiryId: string;
  initial: Activity[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [type, setType] = useState("note");
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  async function add() {
    if (!text.trim()) return;
    setSaving(true);
    const res = await fetch(`/api/enquiries/${enquiryId}/timeline`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, description: text }),
    });
    setSaving(false);
    if (res.ok) {
      setItems(await res.json());
      setText("");
      router.refresh();
    }
  }

  return (
    <div>
      <div className="mb-4 space-y-2 rounded-lg border p-3">
        <div className="flex gap-2">
          <Select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-36"
          >
            <option value="note">Note</option>
            <option value="call">Call log</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="email">Email</option>
          </Select>
          <Button onClick={add} disabled={saving || !text.trim()} size="sm">
            {saving ? "Adding…" : "Add"}
          </Button>
        </div>
        <Textarea
          placeholder="What happened? (outcome, next step…)"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
        />
      </div>

      <ol className="relative space-y-4 border-l pl-6">
        {items.length === 0 && (
          <li className="text-sm text-muted-foreground">No activity yet.</li>
        )}
        {items.map((a) => {
          const Icon = ICONS[a.type] ?? StickyNote;
          return (
            <li key={a.id} className="relative">
              <span className="absolute -left-[31px] flex size-5 items-center justify-center rounded-full border bg-background">
                <Icon className="size-3 text-muted-foreground" />
              </span>
              <p className="text-sm">{a.description}</p>
              <p className="text-xs text-muted-foreground">
                {timeAgo(a.createdAt)}
                {a.outcome ? ` · ${a.outcome}` : ""}
              </p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
