import type { NextRequest } from "next/server";
import { withAuth, ok, fail, handleError } from "@/lib/api";
import { scoreEnquiry } from "@/lib/services/scoring";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const guard = await withAuth();
  if ("response" in guard) return guard.response;

  try {
    const result = await scoreEnquiry(params.id);
    if (!result) return fail("Enquiry not found", 404);
    return ok(result);
  } catch (err) {
    return handleError(err);
  }
}
