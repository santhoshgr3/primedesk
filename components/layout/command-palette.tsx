"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Search, CornerDownLeft } from "lucide-react";
import { api } from "@/hooks/use-crm";
import { NAV } from "@/components/layout/nav-items";
import { titleCase } from "@/lib/utils";

type Row = { label: string; sub?: string; href: string; group: string };

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
    else {
      setQ("");
      setActive(0);
    }
  }, [open]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 180);
    return () => clearTimeout(t);
  }, [q]);

  const { data } = useQuery({
    queryKey: ["cmdk", debounced],
    enabled: open && debounced.trim().length >= 2,
    queryFn: () =>
      api.jsonFetch<any>(`/api/search?q=${encodeURIComponent(debounced)}`),
  });

  const navRows: Row[] = NAV.filter((n) =>
    n.label.toLowerCase().includes(q.toLowerCase()),
  ).map((n) => ({ label: n.label, href: n.href, group: "Navigate" }));

  const resultRows: Row[] = [
    ...(data?.enquiries ?? []).map((e: any) => ({
      label: e.companyName,
      sub: `${e.contactName} · ${titleCase(e.status)}`,
      href: `/enquiries/${e.id}`,
      group: "Enquiries",
    })),
    ...(data?.spaces ?? []).map((s: any) => ({
      label: s.name,
      sub: `${s.operator.name} · ${s.microMarket}`,
      href: `/operators/${s.operatorId}`,
      group: "Spaces",
    })),
    ...(data?.operators ?? []).map((o: any) => ({
      label: o.name,
      sub: titleCase(o.type),
      href: `/operators/${o.id}`,
      group: "Operators",
    })),
  ];

  const rows = [...navRows, ...resultRows];

  function go(row?: Row) {
    const r = row ?? rows[active];
    if (!r) return;
    setOpen(false);
    router.push(r.href);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center bg-black/40 p-4 pt-[12vh]"
      onMouseDown={() => setOpen(false)}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-xl border bg-popover shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b px-3">
          <Search className="size-4 text-muted-foreground" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown")
                setActive((a) => Math.min(a + 1, rows.length - 1));
              if (e.key === "ArrowUp") setActive((a) => Math.max(a - 1, 0));
              if (e.key === "Enter") go();
            }}
            placeholder="Search or jump to…"
            className="h-11 flex-1 bg-transparent text-sm outline-none"
          />
          <kbd className="rounded border px-1.5 text-[10px] text-muted-foreground">
            ESC
          </kbd>
        </div>

        <div className="max-h-[50vh] overflow-y-auto p-1">
          {rows.length === 0 && (
            <p className="p-4 text-sm text-muted-foreground">
              {debounced.length >= 2 ? "No matches." : "Type to search…"}
            </p>
          )}
          {rows.map((r, i) => (
            <button
              key={`${r.href}-${i}`}
              onMouseEnter={() => setActive(i)}
              onClick={() => go(r)}
              className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm ${
                i === active ? "bg-accent" : ""
              }`}
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{r.label}</span>
                {r.sub && (
                  <span className="block truncate text-xs text-muted-foreground">
                    {r.sub}
                  </span>
                )}
              </span>
              <span className="text-[10px] uppercase text-muted-foreground">
                {r.group}
              </span>
              {i === active && (
                <CornerDownLeft className="size-3 text-muted-foreground" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
