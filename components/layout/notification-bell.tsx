"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { api } from "@/hooks/use-crm";
import { timeAgo } from "@/lib/utils";

type Notif = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  readAt: string | null;
  createdAt: string;
};

export function NotificationBell() {
  const router = useRouter();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: () =>
      api.jsonFetch<{ items: Notif[]; unread: number }>("/api/notifications"),
    refetchInterval: 30_000,
  });

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const unread = data?.unread ?? 0;

  async function markAll() {
    await api.jsonFetch("/api/notifications", {
      method: "POST",
      body: JSON.stringify({ all: true }),
    });
    qc.invalidateQueries({ queryKey: ["notifications"] });
  }

  async function openItem(n: Notif) {
    if (!n.readAt) {
      await api.jsonFetch("/api/notifications", {
        method: "POST",
        body: JSON.stringify({ ids: [n.id] }),
      });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    }
    setOpen(false);
    if (n.link) router.push(n.link);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
        aria-label="Notifications"
      >
        <Bell className="size-4" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-1 w-80 overflow-hidden rounded-lg border bg-popover shadow-lg">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <span className="text-sm font-medium">Notifications</span>
            {unread > 0 && (
              <button
                onClick={markAll}
                className="text-xs text-primary hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {(data?.items ?? []).length === 0 && (
              <p className="p-4 text-center text-sm text-muted-foreground">
                Nothing yet.
              </p>
            )}
            {data?.items.map((n) => (
              <button
                key={n.id}
                onClick={() => openItem(n)}
                className={`block w-full border-b px-3 py-2.5 text-left last:border-0 hover:bg-accent ${
                  n.readAt ? "" : "bg-primary/5"
                }`}
              >
                <div className="flex items-start gap-2">
                  {!n.readAt && (
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{n.title}</p>
                    {n.body && (
                      <p className="truncate text-xs text-muted-foreground">
                        {n.body}
                      </p>
                    )}
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {timeAgo(n.createdAt)}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
