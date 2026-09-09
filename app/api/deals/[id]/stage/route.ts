import type { NextRequest } from "next/server";
import { withAuth, ok, handleError } from "@/lib/api";
import { moveStageSchema } from "@/lib/validators/deal";
import { moveDealStage } from "@/lib/services/deal";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const guard = await withAuth();
  if ("response" in guard) return guard.response;

  try {
    const { stage, lostReason } = moveStageSchema.parse(await req.json());
    const deal = await moveDealStage(
      params.id,
      stage,
      guard.user.id,
      lostReason,
    );
    return ok(deal);
  } catch (err) {
    return handleError(err);
  }
}
