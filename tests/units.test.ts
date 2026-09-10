import { describe, it, expect } from "vitest";
import { computeCommission } from "@/lib/services/deal";
import { parseCSV, toCSV } from "@/lib/csv";
import { renderTemplate } from "@/lib/services/messaging";
import { formatINR, ageLabel, escapeHtml, titleCase, initials } from "@/lib/utils";
import { verifyMetaSignature } from "@/lib/webhook-verify";
import { rateLimit } from "@/lib/rate-limit";
import crypto from "node:crypto";

describe("computeCommission", () => {
  it("is rate% of first month value, rounded", () => {
    expect(computeCommission(450000, 8)).toBe(36000);
    expect(computeCommission(100000, 8.5)).toBe(8500);
  });
  it("is 0 without a rate", () => {
    expect(computeCommission(450000, null)).toBe(0);
    expect(computeCommission(450000, 0)).toBe(0);
  });
});

describe("parseCSV", () => {
  it("parses headers + rows, honouring quotes", () => {
    const rows = parseCSV(
      'a,b,c\n1,"two, still two",3\n"line\nbreak",y,z',
    );
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({ a: "1", b: "two, still two", c: "3" });
    expect(rows[1].a).toBe("line\nbreak");
  });
  it("returns [] for header-only input", () => {
    expect(parseCSV("a,b,c")).toEqual([]);
  });
  it("round-trips with toCSV", () => {
    const csv = toCSV(["x", "y"], [["a,b", "c"]]);
    expect(parseCSV(csv)).toEqual([{ x: "a,b", y: "c" }]);
  });
});

describe("renderTemplate", () => {
  it("fills known vars, leaves unknown", () => {
    expect(renderTemplate("Hi {{name}}, {{n}} spaces", { name: "Riya", n: 3 })).toBe(
      "Hi Riya, 3 spaces",
    );
    expect(renderTemplate("Hi {{missing}}", {})).toBe("Hi {{missing}}");
  });
});

describe("utils", () => {
  it("formatINR", () => {
    expect(formatINR(null)).toBe("—");
    expect(formatINR(1234567, { short: true })).toBe("₹12.35L");
    expect(formatINR(2_50_00_000, { short: true })).toBe("₹2.50Cr");
  });
  it("ageLabel", () => {
    expect(ageLabel(new Date(Date.now() - 3 * 3600_000))).toBe("3h");
    expect(ageLabel(new Date(Date.now() - 5 * 86400_000))).toBe("5d");
  });
  it("escapeHtml / titleCase / initials", () => {
    expect(escapeHtml('<a href="x">')).toBe("&lt;a href=&quot;x&quot;&gt;");
    expect(titleCase("MANAGED_OFFICE")).toBe("Managed Office");
    expect(initials("Kavya Nair")).toBe("KN");
  });
});

describe("verifyMetaSignature", () => {
  const secret = "shhh";
  const body = '{"hello":"world"}';
  const sig =
    "sha256=" +
    crypto.createHmac("sha256", secret).update(body).digest("hex");

  it("accepts a valid signature", () => {
    expect(verifyMetaSignature(body, sig, secret)).toBe(true);
  });
  it("rejects a bad signature", () => {
    expect(verifyMetaSignature(body, "sha256=deadbeef", secret)).toBe(false);
    expect(verifyMetaSignature(body, null, secret)).toBe(false);
  });
  it("skips when no secret configured (dev)", () => {
    expect(verifyMetaSignature(body, null, undefined)).toBe(true);
  });
});

describe("rateLimit", () => {
  it("allows up to the limit then blocks", () => {
    const key = "test-" + Math.random();
    const opts = { limit: 3, windowMs: 1000 };
    expect(rateLimit(key, opts).ok).toBe(true);
    expect(rateLimit(key, opts).ok).toBe(true);
    expect(rateLimit(key, opts).ok).toBe(true);
    const blocked = rateLimit(key, opts);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThan(0);
  });
});
