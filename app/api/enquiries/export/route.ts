import type { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api";

const COLUMNS = [
  "id",
  "companyName",
  "industry",
  "contactName",
  "contactPhone",
  "contactEmail",
  "seatsNeeded",
  "city",
  "microMarket",
  "workspaceType",
  "budgetPerSeat",
  "moveInTimeline",
  "source",
  "status",
  "priority",
  "assignedTo",
  "createdAt",
] as const;

function csvCell(v: unknown) {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(req: NextRequest) {
  const guard = await withAuth();
  if ("response" in guard) return guard.response;

  const sp = req.nextUrl.searchParams;
  const where: Prisma.EnquiryWhereInput = { isArchived: false };
  for (const key of ["city", "status", "priority", "workspaceType"] as const) {
    const v = sp.get(key);
    if (v) (where as Record<string, unknown>)[key] = v;
  }

  const rows = await prisma.enquiry.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { assignedTo: { select: { name: true } } },
    take: 5000,
  });

  const lines = [
    COLUMNS.join(","),
    ...rows.map((r) =>
      COLUMNS.map((c) => {
        if (c === "assignedTo") return csvCell(r.assignedTo?.name ?? "");
        if (c === "createdAt") return csvCell(r.createdAt.toISOString());
        return csvCell((r as Record<string, unknown>)[c]);
      }).join(","),
    ),
  ];

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="enquiries-${
        new Date().toISOString().slice(0, 10)
      }.csv"`,
    },
  });
}
