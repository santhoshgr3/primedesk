"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { api } from "@/hooks/use-crm";

export function ShortlistResponseForm({
  shortlistId,
  spaces,
}: {
  shortlistId: string;
  spaces: { id: string; name: string }[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [response, setResponse] = useState("wants_visit");
  const [clientNote, setClientNote] = useState("");
  const [preferred, setPreferred] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      await api.jsonFetch(`/api/shortlists/${shortlistId}/response`, {
        method: "PATCH",
        body: JSON.stringify({
          response,
          clientNote,
          preferredSpaceIds: preferred,
        }),
      });
      toast({ title: "Response recorded", variant: "success" });
      router.refresh();
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <Select value={response} onChange={(e) => setResponse(e.target.value)}>
        <option value="wants_visit">Wants to visit</option>
        <option value="interested_in_X">Interested in specific space(s)</option>
        <option value="not_suitable">Not suitable</option>
        <option value="no_response">No response</option>
      </Select>

      {response === "interested_in_X" && (
        <div className="space-y-1">
          {spaces.map((s) => (
            <label key={s.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={preferred.includes(s.id)}
                onChange={(e) =>
                  setPreferred((p) =>
                    e.target.checked
                      ? [...p, s.id]
                      : p.filter((x) => x !== s.id),
                  )
                }
              />
              {s.name}
            </label>
          ))}
        </div>
      )}

      <Textarea
        rows={2}
        placeholder="Client's words / next step…"
        value={clientNote}
        onChange={(e) => setClientNote(e.target.value)}
      />
      <Button className="w-full" onClick={submit} disabled={busy}>
        {busy ? "Saving…" : "Record response"}
      </Button>
    </div>
  );
}
