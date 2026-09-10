import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api";
import { readUpload, deleteUpload, mimeFromName } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const guard = await withAuth();
  if ("response" in guard) return guard.response;

  const doc = await prisma.document.findUnique({ where: { id: params.id } });
  if (!doc) return new Response("Not found", { status: 404 });

  const buf = await readUpload(params.id);
  if (!buf) return new Response("File missing", { status: 404 });

  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": mimeFromName(doc.name),
      "Content-Disposition": `inline; filename="${doc.name.replace(/"/g, "")}"`,
    },
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const guard = await withAuth(["ADMIN", "ADVISOR", "OPERATIONS"]);
  if ("response" in guard) return guard.response;

  const doc = await prisma.document.findUnique({ where: { id: params.id } });
  if (!doc) return new Response("Not found", { status: 404 });

  await prisma.document.delete({ where: { id: params.id } });
  await deleteUpload(params.id);
  return Response.json({ deleted: true });
}
