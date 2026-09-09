import PDFDocument from "pdfkit";
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
  operator: { name: string };
  advisorNote?: string | null;
};

type Data = {
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

const pretty = (s: string) =>
  s.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
// Helvetica has no ₹ glyph — use "Rs." in the PDF.
const money = (n: number) => "Rs. " + Math.round(n).toLocaleString("en-IN");

/** Render a branded shortlist as a real PDF (Buffer). */
export function renderShortlistPDF(
  data: Data,
  settings: AppSettings,
): Promise<Buffer> {
  const b = settings.branding;
  const accent = hexToRgb(b.primaryColor) ?? [37, 99, 235];

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 48 });
      const chunks: Buffer[] = [];
      doc.on("data", (c) => chunks.push(c as Buffer));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const W = doc.page.width - 96; // content width

      // ── Header ──
      doc
        .fillColor(accent)
        .fontSize(20)
        .font("Helvetica-Bold")
        .text(b.companyName, { continued: false });
      doc
        .fillColor("#64748b")
        .fontSize(10)
        .font("Helvetica")
        .text(b.website);
      doc
        .moveDown(0.3)
        .fillColor("#94a3b8")
        .fontSize(9)
        .text(
          `Shortlist v${data.version}  ·  ${new Date(
            data.createdAt,
          ).toLocaleDateString("en-IN")}`,
        );
      doc
        .moveTo(48, doc.y + 6)
        .lineTo(doc.page.width - 48, doc.y + 6)
        .lineWidth(2)
        .strokeColor(accent)
        .stroke();
      doc.moveDown(1.2);

      // ── Summary ──
      doc
        .fillColor("#0f172a")
        .fontSize(14)
        .font("Helvetica-Bold")
        .text(`Curated for ${data.enquiry.companyName}`);
      doc
        .fillColor("#475569")
        .fontSize(10)
        .font("Helvetica")
        .text(`Contact: ${data.enquiry.contactName}`)
        .text(
          `Requirement: ${data.enquiry.seatsNeeded} seats  ·  ${
            data.enquiry.city
          }  ·  ${pretty(data.enquiry.workspaceType)}`,
        )
        .text(
          `Advisor: ${data.advisor.name}  ·  ${
            data.advisor.phone ?? b.phone
          }  ·  ${data.advisor.email ?? b.email}`,
        );
      doc.moveDown(1);

      // ── Space cards ──
      data.spaces.forEach((s, i) => {
        if (doc.y > doc.page.height - 160) doc.addPage();
        const top = doc.y;

        doc
          .roundedRect(48, top, W, 4, 2)
          .fill(accent); // top accent bar

        doc.moveDown(0.4);
        doc
          .fillColor("#0f172a")
          .fontSize(12)
          .font("Helvetica-Bold")
          .text(`${i + 1}. ${s.name}`, 56, doc.y, { continued: true })
          .fillColor("#64748b")
          .font("Helvetica")
          .fontSize(9)
          .text(`   by ${s.operator.name}`);

        doc
          .fillColor(accent)
          .font("Helvetica-Bold")
          .fontSize(11)
          .text(`${money(s.pricePerSeat)} / seat / month`, 56);

        doc
          .fillColor("#475569")
          .font("Helvetica")
          .fontSize(9)
          .text(
            `${s.microMarket}, ${s.city}  ·  ${pretty(s.workspaceType)}  ·  ${
              s.availableSeats
            } seats available  ·  Move-in: ${pretty(s.moveInReady)}`,
            56,
          )
          .text(s.address, 56)
          .text(
            `Lock-in: ${s.lockInMonths ?? "—"} mo    Deposit: ${
              s.depositMonths ?? "—"
            } mo`,
            56,
          );

        if (s.amenities.length) {
          doc
            .fillColor("#3730a3")
            .fontSize(8)
            .text(s.amenities.slice(0, 10).join("  ·  "), 56);
        }
        if (s.advisorNote) {
          doc
            .fillColor("#92400e")
            .fontSize(9)
            .font("Helvetica-Oblique")
            .text(`Advisor note: ${s.advisorNote}`, 56, doc.y, { width: W - 16 })
            .font("Helvetica");
        }
        doc.moveDown(1);
        doc
          .moveTo(48, doc.y)
          .lineTo(doc.page.width - 48, doc.y)
          .lineWidth(0.5)
          .strokeColor("#e2e8f0")
          .stroke();
        doc.moveDown(0.6);
      });

      // ── Footer ──
      doc.moveDown(0.5);
      doc
        .fillColor("#94a3b8")
        .fontSize(8)
        .font("Helvetica")
        .text(
          `${b.companyName} — zero brokerage to clients. Prices are indicative and subject to final negotiation. ` +
            `Availability last verified at time of sending. Questions? Call ${b.phone} or email ${b.email}.`,
          48,
          undefined,
          { width: W },
        );

      doc.end();
    } catch (err) {
      reject(err as Error);
    }
  });
}

function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!m) return null;
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}
