import { NextResponse } from "next/server";
import { ZodError } from "zod";
import type { UserRole } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type ApiUser = {
  id: string;
  role: UserRole;
  name?: string | null;
  email?: string | null;
  city?: string | null;
};

/**
 * Guard for API route handlers.
 *  - `withAuth()` — any authenticated user
 *  - `withAuth(["ADMIN", "OPERATIONS"])` — also enforces role (403 otherwise)
 */
export async function withAuth(
  roles?: UserRole[],
): Promise<{ user: ApiUser } | { response: NextResponse }> {
  const session = await auth();
  if (!session?.user) {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  const user = session.user as ApiUser;

  // Reject tokens for users that have been deactivated or deleted since
  // the JWT was minted, and pick up role changes.
  const fresh = await prisma.user.findUnique({
    where: { id: user.id },
    select: { isActive: true, role: true },
  });
  if (!fresh || !fresh.isActive) {
    return {
      response: NextResponse.json(
        { error: "Account is inactive — sign in again" },
        { status: 401 },
      ),
    };
  }
  user.role = fresh.role;

  if (roles && !roles.includes(user.role)) {
    return {
      response: NextResponse.json(
        { error: "Forbidden — insufficient role" },
        { status: 403 },
      ),
    };
  }
  return { user };
}

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function handleError(err: unknown) {
  if (err instanceof ZodError) {
    return NextResponse.json(
      { error: "Validation failed", issues: err.flatten() },
      { status: 422 },
    );
  }
  // Prisma "record not found" on update/delete
  if (
    err &&
    typeof err === "object" &&
    "code" in err &&
    (err as { code?: string }).code === "P2025"
  ) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  console.error("[api] unhandled error:", err);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

/** Parse ?page=&pageSize= into skip/take. */
export function parsePagination(searchParams: URLSearchParams) {
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.min(
    100,
    Math.max(1, Number(searchParams.get("pageSize") ?? 25)),
  );
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}
