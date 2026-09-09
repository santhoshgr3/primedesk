import type { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { withAuth, ok, handleError } from "@/lib/api";

/**
 * Duplicate detection (PLAN Module 1) — match on last-10 phone digits or a
 * fuzzy company-name match. Used by the new-enquiry form.
 */
export async function GET(req: NextRequest) {
  const guard = await withAuth();
  if ("response" in guard) return guard.response;

  try {
    const sp = req.nextUrl.searchParams;
    const phone = sp.get("phone")?.replace(/\D/g, "").slice(-10);
    const company = sp.get("company")?.trim();

    const or: Prisma.EnquiryWhereInput[] = [];
    if (phone && phone.length >= 7)
      or.push({ contactPhone: { contains: phone } });
    if (company && company.length >= 3)
      or.push({ companyName: { contains: company, mode: "insensitive" } });
    if (!or.length) return ok({ matches: [] });

    const matches = await prisma.enquiry.findMany({
      where: { OR: or, isArchived: false },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        companyName: true,
        contactName: true,
        contactPhone: true,
        city: true,
        status: true,
        createdAt: true,
        assignedTo: { select: { name: true } },
      },
    });
    return ok({ matches });
  } catch (err) {
    return handleError(err);
  }
}
