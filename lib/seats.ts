/** Map a display seat range to numeric bounds (and back). */
export const SEAT_RANGES = ["20-50", "50-100", "100-200", "200+"] as const;

const BOUNDS: Record<string, [number, number]> = {
  "20-50": [20, 50],
  "50-100": [50, 100],
  "100-200": [100, 200],
  "200+": [200, 100000],
};

export function seatBounds(range: string): { min: number; max: number } {
  const [min, max] = BOUNDS[range] ?? [0, 100000];
  return { min, max };
}

/** Nearest display range for a raw seat count (used by CSV import). */
export function rangeForCount(n: number): string {
  if (!n || n <= 0) return "20-50";
  if (n <= 50) return "20-50";
  if (n <= 100) return "50-100";
  if (n <= 200) return "100-200";
  return "200+";
}
