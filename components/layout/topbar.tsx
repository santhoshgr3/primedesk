"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { titleCase } from "@/lib/utils";
import { GlobalSearch } from "@/components/layout/global-search";
import { MobileNav } from "@/components/layout/mobile-nav";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { CommandPalette } from "@/components/layout/command-palette";
import { NotificationBell } from "@/components/layout/notification-bell";

export function Topbar({
  user,
  badges,
}: {
  user: { name?: string | null; email?: string | null; role: string };
  badges?: Partial<Record<string, number>>;
}) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-card px-3 lg:gap-4 lg:px-6">
      <CommandPalette />
      <MobileNav badges={badges} />
      <div className="min-w-0 flex-1">
        <GlobalSearch />
      </div>
      <div className="flex items-center gap-1.5 lg:gap-2">
        <NotificationBell />
        <ThemeToggle />
        <div className="hidden text-right leading-tight sm:block">
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
