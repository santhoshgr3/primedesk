import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { ClientShortlist } from "@/components/public/client-shortlist";
import {
  resolveShareToken,
  SHARE_MESSAGES,
} from "@/lib/services/shortlist-access";

export const dynamic = "force-dynamic";

export default async function PublicShortlistPage({
  params,
}: {
  params: { token: string };
}) {
  const { state, shortlist } = await resolveShareToken(params.token);

  if (!shortlist) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-center">
        <div>
          <p className="text-2xl font-semibold text-slate-700">
            Link unavailable
          </p>
          <p className="mt-2 text-sm text-slate-500">
            {SHARE_MESSAGES[state as "not_found"]}
          </p>
        </div>
      </div>
    );
  }

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
