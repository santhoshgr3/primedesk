import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/auth";

export type ApiUser = {
  id: string;
  role: string;
  name?: string | null;
  email?: string | null;
  city?: string | null;
};

/** Guard for API route handlers — returns the user or a 401 response. */
export async function withAuth(): Promise<
  { user: ApiUser } | { response: NextResponse }
> {
  const session = await auth();
  if (!session?.user) {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { user: session.user as ApiUser };
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
