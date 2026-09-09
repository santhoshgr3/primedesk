"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { formatINR, titleCase } from "@/lib/utils";

const STAGE_AGE_LIMIT_DAYS = 7;

export function DealCard({ deal, onOpen }: { deal: any; onOpen: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: deal.id });

  const lastMove = deal.stageHistory?.[0]?.createdAt ?? deal.updatedAt;
  const daysInStage = Math.floor(
    (Date.now() - new Date(lastMove).getTime()) / 86400000,
  );
  const stale = daysInStage >= STAGE_AGE_LIMIT_DAYS && !["MOVED_IN", "LOST"].includes(deal.stage);

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={`rounded-lg border bg-card p-3 text-sm shadow-sm ${
        isDragging ? "opacity-50" : ""
      } ${stale ? "border-red-300" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <button onClick={onOpen} className="text-left font-medium hover:underline">
          {deal.enquiry.companyName}
        </button>
        <span
          {...listeners}
          {...attributes}
          className="cursor-grab px-1 text-muted-foreground active:cursor-grabbing"
          title="Drag to move stage"
        >
          ⠿
        </span>
      </div>
      <p className="mt-0.5 truncate text-xs text-muted-foreground">
        {deal.space.name} · {deal.seats} seats · {deal.enquiry.city}
      </p>
      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="font-semibold text-primary">
          {formatINR(deal.monthlyValue, { short: true })}/mo
        </span>
        <span className={stale ? "font-medium text-red-600" : "text-muted-foreground"}>
          {daysInStage}d in stage
        </span>
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">
        {deal.advisor.name} · {titleCase(deal.commissionStatus)} comm.{" "}
        {formatINR(deal.commissionValue ?? 0, { short: true })}
      </p>
    </div>
  );
}
