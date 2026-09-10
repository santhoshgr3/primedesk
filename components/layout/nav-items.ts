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

export type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
};

export const NAV: NavItem[] = [
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
