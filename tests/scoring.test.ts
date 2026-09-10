import { describe, it, expect } from "vitest";
import { computeScore } from "@/lib/services/scoring";

const base = {
  seatsNeeded: "20-50",
  moveInTimeline: "exploring",
  budgetPerSeat: null,
  source: "OTHER" as const,
  contactEmail: null,
  status: "NEW" as const,
};
const noSignals = {
  shortlistsSent: 0,
  visitsDone: 0,
  activityCount: 0,
  daysSinceLastActivity: null,
};

describe("computeScore", () => {
  it("a big, urgent, engaged lead scores hot", () => {
    const { score, priority } = computeScore(
      {
        ...base,
        seatsNeeded: "200+",
        moveInTimeline: "immediate",
        budgetPerSeat: 9000,
        source: "REFERRAL",
        contactEmail: "a@b.com",
        status: "NEGOTIATION",
      },
      {
        shortlistsSent: 2,
        visitsDone: 1,
        activityCount: 6,
        daysSinceLastActivity: 1,
      },
    );
    expect(score).toBeGreaterThanOrEqual(65);
    expect(priority).toBe("hot");
  });

  it("a small, exploring, silent lead scores cold", () => {
    const { score, priority } = computeScore(base, {
      ...noSignals,
      daysSinceLastActivity: 40,
    });
    expect(score).toBeLessThan(35);
    expect(priority).toBe("cold");
  });

  it("clamps to 0..100", () => {
    const { score } = computeScore(
      { ...base, status: "PAUSED" },
      { ...noSignals, daysSinceLastActivity: 60 },
    );
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("is monotonic in engagement", () => {
    const low = computeScore(base, noSignals).score;
    const high = computeScore(base, {
      shortlistsSent: 2,
      visitsDone: 2,
      activityCount: 6,
      daysSinceLastActivity: 1,
    }).score;
    expect(high).toBeGreaterThan(low);
  });
});
