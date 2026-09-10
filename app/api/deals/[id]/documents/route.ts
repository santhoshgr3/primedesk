import type { NextRequest } from "next/server";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { withAuth, ok, fail, handleError } from "@/lib/api";
import { saveUpload } from "@/lib/storage";
import { logActivity } from "@/lib/services/enquiry";

export const runtime = "nodejs";

const MAX_BYTES = 10 * 1024 * 1024;
const DOC_TYPES = ["loi", "lease_agreement", "company_kyc", "brochure", "other"];

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const guard = await withAuth();
  if ("response" in guard) return guard.response;
  const docs = await prisma.document.findMany({
    where: { dealId: params.id },
    orderBy: { createdAt: "desc" },
  });
  return ok(docs);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const guard = await withAuth(["ADMIN", "ADVISOR", "OPERATIONS"]);
  if ("response" in guard) return guard.response;

  try {
    const deal = await prisma.deal.findUnique({
      where: { id: params.id },
      select: { id: true, enquiryId: true },
    });
    if (!deal) return fail("Deal not found", 404);

    const form = await req.formData();
    const file = form.get("file");
    const type = String(form.get("type") ?? "other");
    if (!(file instanceof File)) return fail("No file", 400);
    if (file.size > MAX_BYTES) return fail("File exceeds 10 MB", 413);
    if (!DOC_TYPES.includes(type)) return fail("Invalid document type", 400);

    const docId = crypto.randomBytes(12).toString("hex");
    await saveUpload(docId, Buffer.from(await file.arrayBuffer()));

    const doc = await prisma.document.create({
      data: {
        id: docId,
        name: file.name || `${type}.bin`,
        type,
        url: `/api/documents/${docId}`,
        dealId: deal.id,
        uploadedBy: guard.user.id,
      },
    });

    await logActivity(
      deal.enquiryId,
      "deal_update",
      `Document uploaded: ${doc.name} (${type.replace(/_/g, " ")})`,
      guard.user.id,
    );

    return ok(doc, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
