import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { ClientShortlist } from "@/components/public/client-shortlist";

export const dynamic = "force-dynamic";

export default async function PublicShortlistPage({
  params,
}: {
  params: { token: string };
}) {
  const shortlist = await prisma.shortlist.findUnique({
    where: { shareToken: params.token },
    include: {
      enquiry: { select: { companyName: true, contactName: true, city: true } },
      advisor: { select: { name: true, phone: true, email: true } },
      items: {
        orderBy: { rank: "asc" },
        include: { space: { include: { operator: { select: { name: true } } } } },
      },
    },
  });

  if (!shortlist) notFound();

  if (!shortlist.viewedAt) {
    await prisma.shortlist.update({
      where: { id: shortlist.id },
      data: { viewedAt: new Date() },
    });
    await prisma.activity
      .create({
        data: {
          enquiryId: shortlist.enquiryId,
          type: "note",
          description: `Client opened the shared shortlist (v${shortlist.version})`,
          performedBy: "system",
        },
      })
      .catch(() => {});
  }

  const settings = await getSettings();

  return (
    <ClientShortlist
      token={params.token}
      branding={settings.branding}
      data={JSON.parse(JSON.stringify(shortlist))}
    />
  );
}
