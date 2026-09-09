import type { NextRequest } from "next/server";
import { withAuth, ok, handleError } from "@/lib/api";
import { statusChangeSchema } from "@/lib/validators/enquiry";
import { changeStatus } from "@/lib/services/enquiry";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const guard = await withAuth(['ADMIN','ADVISOR','MARKETING','OPERATIONS']);
  if ("response" in guard) return guard.response;

  try {
    const { status, note } = statusChangeSchema.parse(await req.json());
    const enquiry = await changeStatus(
      params.id,
      status,
      guard.user.id,
      note,
    );
    return ok(enquiry);
  } catch (err) {
    return handleError(err);
  }
}
