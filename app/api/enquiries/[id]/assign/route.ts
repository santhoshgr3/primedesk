import type { NextRequest } from "next/server";
import { withAuth, ok, handleError } from "@/lib/api";
import { assignSchema } from "@/lib/validators/enquiry";
import { assignAdvisor } from "@/lib/services/enquiry";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const guard = await withAuth(['ADMIN','ADVISOR','OPERATIONS']);
  if ("response" in guard) return guard.response;

  try {
    const { assignedToId } = assignSchema.parse(await req.json());
    const enquiry = await assignAdvisor(params.id, assignedToId, guard.user.id);
    return ok(enquiry);
  } catch (err) {
    return handleError(err);
  }
}
