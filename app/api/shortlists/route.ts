import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, ok, handleError } from "@/lib/api";
import { createShortlistSchema } from "@/lib/validators/shortlist";
import { logActivity } from "@/lib/services/enquiry";

export async function GET(req: NextRequest) {
  const guard = await withAuth();
  if ("response" in guard) return guard.response;

  try {
    const enquiryId = req.nextUrl.searchParams.get("enquiryId") ?? undefined;
    const shortlists = await prisma.shortlist.findMany({
      where: { enquiryId },
      orderBy: { createdAt: "desc" },
      include: {
        enquiry: { select: { id: true, companyName: true, city: true } },
        advisor: { select: { name: true } },
        items: { include: { space: { select: { name: true } } } },
      },
    });
    return ok(shortlists);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  const guard = await withAuth(['ADMIN','ADVISOR']);
  if ("response" in guard) return guard.response;

  try {
    const { enquiryId, items } = createShortlistSchema.parse(await req.json());

    const prev = await prisma.shortlist.count({ where: { enquiryId } });

    const shortlist = await prisma.shortlist.create({
      data: {
        enquiryId,
        advisorId: guard.user.id,
        version: prev + 1,
        items: {
          create: items.map((it) => ({
            spaceId: it.spaceId,
            advisorNote: it.advisorNote || null,
            rank: it.rank,
          })),
        },
      },
      include: { items: { include: { space: true } } },
    });

    await logActivity(
      enquiryId,
      "shortlist_sent",
      `Shortlist v${shortlist.version} built with ${items.length} spaces`,
      guard.user.id,
    );

    return ok(shortlist, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
