import type { NextRequest } from "next/server";
import { withAuth, ok, fail, handleError } from "@/lib/api";
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

export async function GET(req: NextRequest) {
  const guard = await withAuth();
  if ("response" in guard) return guard.response;

  try {
    const name = req.nextUrl.searchParams.get("report") ?? "dashboard";
    const fn = REPORTS[name];
    if (!fn) return fail(`Unknown report: ${name}`, 400);
    return ok({ report: name, data: await fn() });
  } catch (err) {
    return handleError(err);
  }
}
