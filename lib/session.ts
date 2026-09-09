import { auth } from "@/auth";
import { redirect } from "next/navigation";
import type { UserRole } from "@prisma/client";

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(roles: UserRole[]) {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect("/");
  return user;
}

export function can(role: UserRole | undefined, action: string): boolean {
  if (!role) return false;
  if (role === "ADMIN") return true;

  const matrix: Record<UserRole, string[]> = {
    ADMIN: ["*"],
    ADVISOR: [
      "enquiry:read",
      "enquiry:write",
      "shortlist:write",
      "visit:write",
      "deal:write",
      "task:write",
      "message:send",
    ],
    OPERATIONS: [
      "enquiry:read",
      "operator:write",
      "space:write",
      "visit:write",
      "task:write",
    ],
    MARKETING: ["enquiry:read", "enquiry:write", "report:read"],
  };

  return matrix[role]?.includes(action) ?? false;
}
