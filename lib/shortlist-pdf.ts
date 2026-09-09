import type { AppSettings } from "@/lib/settings";

type SpaceRow = {
  name: string;
  city: string;
  microMarket: string;
  address: string;
  workspaceType: string;
  availableSeats: number;
  pricePerSeat: number;
  lockInMonths: number | null;
  depositMonths: number | null;
  amenities: string[];
  moveInReady: string;
  images: string[];
  operator: { name: string };
  advisorNote?: string | null;
};

type Data = {
  shortlistId: string;
  version: number;
  createdAt: Date;
  enquiry: {
    companyName: string;
    contactName: string;
    seatsNeeded: string;
    city: string;
    workspaceType: string;
  };
  advisor: { name: string; email: string | null; phone: string | null };
  spaces: SpaceRow[];
};

const esc = (s: unknown) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );

const money = (n: number) => "₹" + n.toLocaleString("en-IN");
const pretty = (s: string) =>
  s.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/** Branded, print-to-PDF ready HTML shortlist (PLAN Module 3). */
export function renderShortlistHTML(data: Data, settings: AppSettings): string {
  const b = settings.branding;
  const rows = data.spaces
    .map(
      (s, i) => `
    <div class="space">
      <div class="space-head">
        <div>
          <span class="rank">${i + 1}</span>
          <span class="space-name">${esc(s.name)}</span>
          <span class="operator">by ${esc(s.operator.name)}</span>
        </div>
        <div class="price">${money(s.pricePerSeat)}<small>/seat/mo</small></div>
      </div>
      <div class="meta">
        ${esc(s.microMarket)}, ${esc(s.city)} · ${esc(pretty(s.workspaceType))} ·
        ${s.availableSeats} seats available · Move-in: ${esc(pretty(s.moveInReady))}
      </div>
      <div class="meta">${esc(s.address)}</div>
      <div class="terms">
        <span>Lock-in: ${s.lockInMonths ?? "—"} mo</span>
        <span>Deposit: ${s.depositMonths ?? "—"} mo</span>
      </div>
      ${
        s.amenities.length
          ? `<div class="amenities">${s.amenities
              .map((a) => `<span>${esc(a)}</span>`)
              .join("")}</div>`
          : ""
      }
      ${
        s.advisorNote
          ? `<div class="note"><strong>Advisor note:</strong> ${esc(
              s.advisorNote,
            )}</div>`
          : ""
      }
    </div>`,
    )
    .join("");

  return `<!doctype html>
<html><head><meta charset="utf-8">
<title>Shortlist — ${esc(data.enquiry.companyName)}</title>
<style>
  * { box-sizing: border-box; }
  body { font: 14px/1.5 -apple-system, Segoe UI, Roboto, sans-serif; color: #0f172a; margin: 0; padding: 40px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid ${esc(
    b.primaryColor,
  )}; padding-bottom: 16px; margin-bottom: 24px; }
  .brand { font-size: 22px; font-weight: 700; color: ${esc(b.primaryColor)}; }
  .brand small { display:block; font-weight: 400; font-size: 12px; color: #64748b; }
  .summary { background: #f1f5f9; border-radius: 10px; padding: 16px; margin-bottom: 24px; }
  .summary h1 { font-size: 16px; margin: 0 0 6px; }
  .summary p { margin: 2px 0; color: #475569; font-size: 13px; }
  .space { border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin-bottom: 14px; page-break-inside: avoid; }
  .space-head { display: flex; justify-content: space-between; align-items: baseline; }
  .rank { display:inline-flex; width: 22px; height: 22px; align-items:center; justify-content:center; background:${esc(
    b.primaryColor,
  )}; color:#fff; border-radius:50%; font-size:12px; font-weight:700; margin-right: 8px; }
  .space-name { font-weight: 700; font-size: 15px; }
  .operator { color: #64748b; font-size: 12px; margin-left: 6px; }
  .price { font-weight: 700; font-size: 16px; color: ${esc(b.primaryColor)}; }
  .price small { font-weight: 400; font-size: 11px; color:#64748b; }
  .meta { color: #475569; font-size: 12px; margin-top: 6px; }
  .terms { display:flex; gap: 16px; font-size: 12px; margin-top: 8px; color:#334155; }
  .amenities { display:flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
  .amenities span { background:#eef2ff; color:#3730a3; border-radius: 999px; padding: 2px 8px; font-size: 11px; }
  .note { margin-top: 10px; font-size: 12px; background:#fefce8; border-left: 3px solid #eab308; padding: 6px 10px; }
  .footer { margin-top: 28px; border-top: 1px solid #e2e8f0; padding-top: 14px; font-size: 12px; color: #64748b; }
  @media print { body { padding: 20px; } }
</style></head>
<body>
  <div class="header">
    <div class="brand">${esc(b.companyName)}<small>${esc(b.website)}</small></div>
    <div style="text-align:right;font-size:12px;color:#64748b">
      Shortlist v${data.version}<br>${new Date(data.createdAt).toLocaleDateString("en-IN")}
    </div>
  </div>

  <div class="summary">
    <h1>Curated for ${esc(data.enquiry.companyName)}</h1>
    <p>Contact: ${esc(data.enquiry.contactName)}</p>
    <p>Requirement: ${esc(data.enquiry.seatsNeeded)} seats · ${esc(
      data.enquiry.city,
    )} · ${esc(pretty(data.enquiry.workspaceType))}</p>
    <p>Advisor: ${esc(data.advisor.name)} · ${esc(
      data.advisor.phone ?? b.phone,
    )} · ${esc(data.advisor.email ?? b.email)}</p>
  </div>

  ${rows}

  <div class="footer">
    ${esc(b.companyName)} — zero brokerage to clients. Prices are indicative and
    subject to final negotiation. Availability last verified at time of sending.
    <br>Questions? Call ${esc(b.phone)} or email ${esc(b.email)}.
  </div>
</body></html>`;
}
