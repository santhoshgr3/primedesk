import type { NextRequest } from "next/server";
import { z } from "zod";
import { withAuth, ok, fail, handleError } from "@/lib/api";
import { getSettings, setSetting, DEFAULT_SETTINGS } from "@/lib/settings";
import { writeAudit } from "@/lib/services/audit";

export async function GET() {
  const guard = await withAuth();
  if ("response" in guard) return guard.response;
  return ok(await getSettings());
}

const bodySchema = z.object({
  section: z.enum([
    "branding",
    "assignment",
    "sla",
    "workingHours",
    "pipelineStages",
    "leadSources",
  ]),
  value: z.unknown(),
});

export async function PUT(req: NextRequest) {
  const guard = await withAuth();
  if ("response" in guard) return guard.response;
  if (guard.user.role !== "ADMIN") return fail("Admins only", 403);

  try {
    const { section, value } = bodySchema.parse(await req.json());
    // Merge with defaults so partial updates keep required keys.
    const base = DEFAULT_SETTINGS[section] as unknown;
    const merged =
      section === "pipelineStages" || section === "leadSources"
        ? value
        : { ...(base as Record<string, unknown>), ...(value as Record<string, unknown>) };

    await setSetting(section, merged, guard.user.id);
    await writeAudit(guard.user.id, "setting.update", `setting:${section}`);
    return ok(await getSettings());
  } catch (err) {
    return handleError(err);
  }
}
