"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { titleCase } from "@/lib/utils";
import { GlobalSearch } from "@/components/layout/global-search";

export function Topbar({
  user,
}: {
  user: { name?: string | null; email?: string | null; role: string };
}) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b bg-card px-4 lg:px-6">
      <div className="hidden flex-1 md:block">
        <GlobalSearch />
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
