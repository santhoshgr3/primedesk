"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Circle } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { timeAgo, titleCase } from "@/lib/utils";

type Task = {
  id: string;
  type: string;
  title: string;
  priority: string;
  dueDate: string;
  status: string;
  assignedTo: { name: string } | null;
  enquiry: { id: string; companyName: string } | null;
};

const TABS = [
  { key: "overdue", label: "Overdue" },
  { key: "today", label: "Today" },
  { key: "open", label: "All open" },
  { key: "done", label: "Completed" },
] as const;

const PRIO: Record<string, string> = {
  URGENT: "bg-red-100 text-red-700",
  HIGH: "bg-orange-100 text-orange-700",
  MEDIUM: "bg-amber-100 text-amber-700",
  LOW: "bg-gray-100 text-gray-600",
};

export default function TasksPage() {
  const qc = useQueryClient();
  const [scope, setScope] = useState<(typeof TABS)[number]["key"]>("today");
  const [mine, setMine] = useState(true);

  const { data, isLoading } = useQuery({
    queryKey: ["tasks", scope, mine],
    queryFn: async (): Promise<Task[]> => {
      const res = await fetch(
        `/api/tasks?scope=${scope}${mine ? "&mine=1" : ""}`,
      );
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  async function complete(id: string) {
    await fetch(`/api/tasks/${id}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outcome: "done" }),
    });
    qc.invalidateQueries({ queryKey: ["tasks"] });
  }

  return (
    <div>
      <PageHeader
        title="Tasks"
        description="Every enquiry should always have a next action. Overdue tasks escalate to managers after 48h."
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setScope(t.key)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              scope === t.key
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:bg-accent"
            }`}
          >
            {t.label}
          </button>
        ))}
        <label className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={mine}
            onChange={(e) => setMine(e.target.checked)}
          />
          Only mine
        </label>
      </div>

      <Card>
        <CardContent className="divide-y p-0">
          {isLoading && (
            <p className="p-6 text-center text-sm text-muted-foreground">
              Loading…
            </p>
          )}
          {data?.length === 0 && !isLoading && (
            <p className="p-10 text-center text-sm text-muted-foreground">
              Nothing here. {scope === "overdue" ? "All caught up 🎉" : ""}
            </p>
          )}
          {data?.map((t) => (
            <div key={t.id} className="flex items-center gap-3 p-3">
              {t.status === "done" ? (
                <CheckCircle2 className="size-5 shrink-0 text-green-600" />
              ) : (
                <button
                  onClick={() => complete(t.id)}
                  className="shrink-0 text-muted-foreground hover:text-green-600"
                  title="Mark done"
                >
                  <Circle className="size-5" />
                </button>
              )}
              <div className="min-w-0 flex-1">
                <p
                  className={`truncate text-sm font-medium ${
                    t.status === "done" ? "text-muted-foreground line-through" : ""
                  }`}
                >
                  {t.title}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {titleCase(t.type)}
                  {t.enquiry ? (
                    <>
                      {" · "}
                      <Link
                        href={`/enquiries/${t.enquiry.id}`}
                        className="text-primary hover:underline"
                      >
                        {t.enquiry.companyName}
                      </Link>
                    </>
                  ) : null}
                  {t.assignedTo ? ` · ${t.assignedTo.name}` : ""}
                </p>
              </div>
              <Badge className={PRIO[t.priority]}>{titleCase(t.priority)}</Badge>
              <span
                className={`w-24 shrink-0 text-right text-xs ${
                  new Date(t.dueDate) < new Date() && t.status !== "done"
                    ? "font-medium text-destructive"
                    : "text-muted-foreground"
                }`}
              >
                {timeAgo(t.dueDate)}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
