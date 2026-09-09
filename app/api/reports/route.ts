import type { NextRequest } from "next/server";
import { withAuth, ok, fail, handleError } from "@/lib/api";
import { cached } from "@/lib/cache";
import {
  dashboardSnapshot,
  leadSourceReport,
  advisorReport,
  funnelReport,
  pipelineReport,
  operatorReport,
  revenueReport,
  workspaceDemandReport,
  lostDealReport,
} from "@/lib/services/reports";

const REPORTS: Record<string, () => Promise<unknown>> = {
  dashboard: dashboardSnapshot,
  sources: leadSourceReport,
  advisors: advisorReport,
  funnel: funnelReport,
  pipeline: pipelineReport,
  operators: operatorReport,
  revenue: revenueReport,
  demand: workspaceDemandReport,
  lost: lostDealReport,
};

// Reports tolerate ~60s staleness; dashboard refreshes faster.
const TTL: Record<string, number> = { dashboard: 20_000 };

export async function GET(req: NextRequest) {
  const guard = await withAuth();
  if ("response" in guard) return guard.response;

  // Revenue + operator commission reports are management-only.
  const name = req.nextUrl.searchParams.get("report") ?? "dashboard";
  if (
    ["revenue", "operators"].includes(name) &&
    !["ADMIN", "OPERATIONS"].includes(guard.user.role)
  ) {
    return fail("Forbidden — management report", 403);
  }

  try {
    const fn = REPORTS[name];
    if (!fn) return fail(`Unknown report: ${name}`, 400);
    const data = await cached(`report:${name}`, TTL[name] ?? 60_000, fn);
    return ok({ report: name, data });
  } catch (err) {
    return handleError(err);
  }
}
