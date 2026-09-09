"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  Building2,
  FileText,
  KanbanSquare,
  CalendarDays,
  CheckSquare,
  MessagesSquare,
  BarChart3,
  Users,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
};

const NAV: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/enquiries", label: "Enquiries", icon: ClipboardList, badge: "newEnquiries" },
  { href: "/operators", label: "Operators & Spaces", icon: Building2 },
  { href: "/shortlists", label: "Shortlists", icon: FileText },
  { href: "/pipeline", label: "Pipeline", icon: KanbanSquare },
  { href: "/visits", label: "Site Visits", icon: CalendarDays },
  { href: "/tasks", label: "Tasks", icon: CheckSquare, badge: "overdueTasks" },
  { href: "/communications", label: "Communications", icon: MessagesSquare },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/team", label: "Team", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({
  badges,
}: {
  badges?: Partial<Record<string, number>>;
}) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 border-r bg-card lg:flex lg:flex-col">
      <div className="flex h-14 items-center gap-2 border-b px-5">
        <div className="flex size-7 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
          P
        </div>
        <span className="font-semibold">PrimeDesk</span>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV.map(({ href, label, icon: Icon, badge }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          const count = badge ? badges?.[badge] : undefined;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              <span className="flex-1">{label}</span>
              {count ? (
                <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                  {count}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-4 text-[11px] text-muted-foreground">
        PrimeDesk CRM · v0.1
      </div>
    </aside>
  );
}
