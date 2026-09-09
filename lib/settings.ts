import { prisma } from "@/lib/prisma";

export type AppSettings = {
  branding: {
    companyName: string;
    primaryColor: string;
    logoUrl: string;
    phone: string;
    email: string;
    website: string;
  };
  assignment: {
    mode: "manual" | "round_robin" | "city_based";
    autoAssignInbound: boolean;
  };
  sla: {
    firstCallHours: number;
    shortlistHours: number;
    followUpHours: number;
    overdueEscalationHours: number;
  };
  workingHours: {
    start: string; // "09:00"
    end: string; // "19:00"
    days: number[]; // 1=Mon … 7=Sun
  };
  pipelineStages: { key: string; label: string }[];
  leadSources: string[];
};

export const DEFAULT_SETTINGS: AppSettings = {
  branding: {
    companyName: "PrimeDesk",
    primaryColor: "#2563eb",
    logoUrl: "",
    phone: process.env.NEXT_PUBLIC_COMPANY_PHONE ?? "+91 7993726302",
    email: process.env.NEXT_PUBLIC_COMPANY_EMAIL ?? "info@primedesk.co.in",
    website: "primedesk.co.in",
  },
  assignment: { mode: "round_robin", autoAssignInbound: true },
  sla: {
    firstCallHours: 2,
    shortlistHours: 24,
    followUpHours: 24,
    overdueEscalationHours: 48,
  },
  workingHours: { start: "09:00", end: "19:00", days: [1, 2, 3, 4, 5, 6] },
  pipelineStages: [
    { key: "REQUIREMENT_QUALIFIED", label: "Requirement Qualified" },
    { key: "SHORTLIST_ACCEPTED", label: "Shortlist Accepted" },
    { key: "VISIT_DONE", label: "Visit Done" },
    { key: "NEGOTIATING_TERMS", label: "Negotiating Terms" },
    { key: "DOCUMENTATION", label: "Documentation" },
    { key: "LEASE_SIGNED", label: "Lease Signed" },
    { key: "MOVED_IN", label: "Moved In" },
    { key: "LOST", label: "Lost" },
  ],
  leadSources: [
    "WEBSITE_FORM",
    "WHATSAPP_INBOUND",
    "LINKEDIN",
    "FACEBOOK_ADS",
    "INSTAGRAM_ADS",
    "GOOGLE_ADS",
    "REFERRAL",
    "COLD_CALL",
    "DIRECT_CALL",
    "WALK_IN",
    "OTHER",
  ],
};

export async function getSettings(): Promise<AppSettings> {
  const rows = await prisma.setting.findMany();
  const map = new Map(rows.map((r) => [r.key, r.value]));
  return {
    branding: { ...DEFAULT_SETTINGS.branding, ...(map.get("branding") as object) },
    assignment: {
      ...DEFAULT_SETTINGS.assignment,
      ...(map.get("assignment") as object),
    },
    sla: { ...DEFAULT_SETTINGS.sla, ...(map.get("sla") as object) },
    workingHours: {
      ...DEFAULT_SETTINGS.workingHours,
      ...(map.get("workingHours") as object),
    },
    pipelineStages:
      (map.get("pipelineStages") as AppSettings["pipelineStages"]) ??
      DEFAULT_SETTINGS.pipelineStages,
    leadSources:
      (map.get("leadSources") as string[]) ?? DEFAULT_SETTINGS.leadSources,
  };
}

export async function setSetting(key: string, value: unknown, userId?: string) {
  return prisma.setting.upsert({
    where: { key },
    create: { key, value: value as never, updatedBy: userId },
    update: { value: value as never, updatedBy: userId },
  });
}
