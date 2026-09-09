"use client";

import { signOut } from "next-auth/react";
import { LogOut, Search } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { titleCase } from "@/lib/utils";

export function Topbar({
  user,
}: {
  user: { name?: string | null; email?: string | null; role: string };
}) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b bg-card px-4 lg:px-6">
      <div className="relative hidden max-w-sm flex-1 md:block">
        <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
        <input
          placeholder="Search enquiries, companies, spaces…"
          className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
      <div className="ml-auto flex items-center gap-3">
        <div className="text-right leading-tight">
          <p className="text-sm font-medium">{user.name ?? "User"}</p>
          <p className="text-[11px] text-muted-foreground">
            {titleCase(user.role)}
          </p>
        </div>
        <Avatar name={user.name ?? user.email ?? "U"} />
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          title="Sign out"
          className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <LogOut className="size-4" />
        </button>
      </div>
    </header>
  );
}
