export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  const [newEnquiries, overdueTasks] = await Promise.all([
    prisma.enquiry.count({ where: { status: "NEW", isArchived: false } }),
    prisma.task.count({
      where: { status: "pending", dueDate: { lt: new Date() } },
    }),
  ]);

  const badges = { newEnquiries, overdueTasks };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar badges={badges} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          user={{ name: user.name, email: user.email, role: user.role }}
          badges={badges}
        />
        <main className="flex-1 overflow-y-auto bg-muted/30 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
