import type { UserRole } from "@prisma/client";

const CAN_SEE_COMMISSION: UserRole[] = ["ADMIN", "OPERATIONS"];

/**
 * Commission rate is confidential (PLAN Module 2 — "not shown to clients",
 * and internally limited). Strip it for roles that don't need it.
 */
export function serializeOperator<T extends { commissionRate?: number | null }>(
  operator: T,
  role: UserRole,
): T {
  if (CAN_SEE_COMMISSION.includes(role)) return operator;
  const { commissionRate: _omit, ...rest } = operator;
  return rest as T;
}

export function serializeOperators<
  T extends { commissionRate?: number | null },
>(operators: T[], role: UserRole): T[] {
  return operators.map((o) => serializeOperator(o, role));
}
