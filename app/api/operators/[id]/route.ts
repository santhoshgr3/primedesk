import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, ok, fail, handleError } from "@/lib/api";
import { updateOperatorSchema } from "@/lib/validators/operator";
import { serializeOperator } from "@/lib/serializers";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const guard = await withAuth();
  if ("response" in guard) return guard.response;

  try {
    const operator = await prisma.operator.findUnique({
      where: { id: params.id },
      include: {
        contacts: true,
        spaces: { orderBy: { createdAt: "desc" } },
        deals: {
          include: {
            enquiry: { select: { companyName: true } },
            space: { select: { name: true } },
          },
        },
      },
    });
    if (!operator) return fail("Not found", 404);
    return ok(serializeOperator(operator, guard.user.role));
  } catch (err) {
    return handleError(err);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const guard = await withAuth(['ADMIN','OPERATIONS']);
  if ("response" in guard) return guard.response;

  try {
    const data = updateOperatorSchema.parse(await req.json());
    const { contacts, ...fields } = data;

    const operator = await prisma.operator.update({
      where: { id: params.id },
      data: {
        ...fields,
        website: fields.website === "" ? null : fields.website,
      },
      include: { contacts: true },
    });

    if (contacts) {
      await prisma.operatorContact.deleteMany({
        where: { operatorId: params.id },
      });
      await prisma.operatorContact.createMany({
        data: contacts.map((c) => ({
          operatorId: params.id,
          name: c.name,
          phone: c.phone,
          designation: c.designation || null,
          email: c.email || null,
          isPrimary: c.isPrimary ?? false,
        })),
      });
    }

    return ok(operator);
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const guard = await withAuth(['ADMIN']);
  if ("response" in guard) return guard.response;
  if (guard.user.role !== "ADMIN") return fail("Forbidden", 403);

  try {
    await prisma.operator.update({
      where: { id: params.id },
      data: { isActive: false },
    });
    return ok({ deactivated: true });
  } catch (err) {
    return handleError(err);
  }
}
