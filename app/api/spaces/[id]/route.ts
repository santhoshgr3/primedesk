import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, ok, fail, handleError } from "@/lib/api";
import { updateSpaceSchema } from "@/lib/validators/space";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const guard = await withAuth();
  if ("response" in guard) return guard.response;

  try {
    const space = await prisma.space.findUnique({
      where: { id: params.id },
      include: {
        operator: { include: { contacts: true } },
        _count: { select: { shortlistItems: true, visits: true, deals: true } },
      },
    });
    if (!space) return fail("Not found", 404);
    return ok(space);
  } catch (err) {
    return handleError(err);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const guard = await withAuth();
  if ("response" in guard) return guard.response;

  try {
    const data = updateSpaceSchema.parse(await req.json());
    const verifying = "availableSeats" in data || "status" in data;
    const space = await prisma.space.update({
      where: { id: params.id },
      data: {
        ...data,
        ...(verifying ? { lastVerifiedAt: new Date() } : {}),
      },
    });
    return ok(space);
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const guard = await withAuth();
  if ("response" in guard) return guard.response;
  if (!["ADMIN", "OPERATIONS"].includes(guard.user.role))
    return fail("Forbidden", 403);

  try {
    await prisma.space.update({
      where: { id: params.id },
      data: { isActive: false, status: "inactive" },
    });
    return ok({ deactivated: true });
  } catch (err) {
    return handleError(err);
  }
}
