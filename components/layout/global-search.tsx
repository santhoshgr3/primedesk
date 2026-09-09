"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/hooks/use-crm";
import { titleCase } from "@/lib/utils";

type Results = {
  enquiries: any[];
  operators: any[];
  spaces: any[];
};

export function GlobalSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [debounced, setDebounced] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 220);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const { data, isFetching } = useQuery({
    queryKey: ["search", debounced],
    enabled: debounced.trim().length >= 2,
    queryFn: () =>
      api.jsonFetch<Results>(`/api/search?q=${encodeURIComponent(debounced)}`),
  });

  const go = (href: string) => {
    setOpen(false);
    setQ("");
    router.push(href);
  };

  const empty =
    data &&
    !data.enquiries.length &&
    !data.operators.length &&
    !data.spaces.length;

  return (
    <div ref={boxRef} className="relative w-full max-w-sm">
      <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
      {isFetching && (
        <Loader2 className="absolute right-3 top-2.5 size-4 animate-spin text-muted-foreground" />
      )}
      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => q && setOpen(true)}
        placeholder="Search enquiries, operators, spaces…"
        className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-8 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />

      {open && debounced.trim().length >= 2 && (
        <div className="absolute z-50 mt-1 max-h-[70vh] w-[min(28rem,90vw)] overflow-y-auto rounded-lg border bg-popover p-1 shadow-lg">
          {empty && (
            <p className="p-3 text-sm text-muted-foreground">
              No matches for &ldquo;{debounced}&rdquo;.
            </p>
          )}

          {data?.enquiries.length ? (
            <Group label="Enquiries">
              {data.enquiries.map((e) => (
                <Row
                  key={e.id}
                  onClick={() => go(`/enquiries/${e.id}`)}
                  title={e.companyName}
                  sub={`${e.contactName} · ${e.city} · ${titleCase(e.status)}`}
                  dot={
                    e.priority === "hot"
                      ? "bg-red-500"
                      : e.priority === "cold"
                        ? "bg-sky-500"
                        : "bg-amber-500"
                  }
                />
              ))}
            </Group>
          ) : null}

          {data?.spaces.length ? (
            <Group label="Spaces">
              {data.spaces.map((s) => (
                <Row
                  key={s.id}
                  onClick={() => go(`/operators/${s.operatorId ?? ""}`)}
                  title={s.name}
                  sub={`${s.operator.name} · ${s.microMarket}, ${s.city} · ${s.availableSeats} seats`}
                />
              ))}
            </Group>
          ) : null}

          {data?.operators.length ? (
            <Group label="Operators">
              {data.operators.map((o) => (
                <Row
                  key={o.id}
                  onClick={() => go(`/operators/${o.id}`)}
                  title={o.name}
                  sub={titleCase(o.type)}
                />
              ))}
            </Group>
          ) : null}
        </div>
      )}
    </div>
  );
}

function Group({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="py-1">
      <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      {children}
    </div>
  );
}

function Row({
  title,
  sub,
  dot,
  onClick,
}: {
  title: string;
  sub: string;
  dot?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-accent"
    >
      {dot && <span className={`size-2 shrink-0 rounded-full ${dot}`} />}
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{title}</span>
        <span className="block truncate text-xs text-muted-foreground">
          {sub}
        </span>
      </span>
    </button>
  );
}
