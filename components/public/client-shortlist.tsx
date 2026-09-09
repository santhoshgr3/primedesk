"use client";

import { useState } from "react";
import { Check, MapPin, Building2, IndianRupee, Phone, Mail } from "lucide-react";
import { formatINR, titleCase } from "@/lib/utils";

type Item = {
  id: string;
  spaceId: string;
  rank: number;
  advisorNote: string | null;
  clientPreferred: boolean;
  space: {
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
  };
};

export function ClientShortlist({
  token,
  branding,
  data,
}: {
  token: string;
  branding: {
    companyName: string;
    primaryColor: string;
    phone: string;
    email: string;
    website: string;
  };
  data: {
    version: number;
    response: string | null;
    enquiry: { companyName: string; contactName: string; city: string };
    advisor: { name: string; phone: string | null; email: string | null };
    items: Item[];
  };
}) {
  const already = !!data.response;
  const [picked, setPicked] = useState<Set<string>>(
    new Set(data.items.filter((i) => i.clientPreferred).map((i) => i.spaceId)),
  );
  const [note, setNote] = useState("");
  const [wantsVisit, setWantsVisit] = useState(false);
  const [submitted, setSubmitted] = useState(already);
  const [busy, setBusy] = useState(false);

  const accent = branding.primaryColor || "#2563eb";

  function toggle(id: string) {
    setPicked((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  async function submit() {
    setBusy(true);
    try {
      const res = await fetch(`/api/public/shortlist/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferredSpaceIds: [...picked],
          note: note || undefined,
          wantsVisit,
        }),
      });
      if (res.ok) setSubmitted(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <header
        className="px-5 py-5 text-white"
        style={{ background: accent }}
      >
        <div className="mx-auto max-w-3xl">
          <p className="text-lg font-bold">{branding.companyName}</p>
          <p className="text-sm opacity-90">{branding.website}</p>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-5">
        <div className="my-6 rounded-xl border bg-white p-5 shadow-sm">
          <h1 className="text-xl font-semibold">
            Office space options for {data.enquiry.companyName}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Hi {data.enquiry.contactName}, here are {data.items.length} spaces
            we&apos;ve shortlisted in {data.enquiry.city}. Tick the ones you like
            and tell us if you&apos;d like to visit — zero brokerage, always.
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Your advisor:{" "}
            <span className="font-medium text-slate-700">
              {data.advisor.name}
            </span>{" "}
            {data.advisor.phone && (
              <a
                href={`tel:${data.advisor.phone}`}
                className="ml-1 inline-flex items-center gap-1"
                style={{ color: accent }}
              >
                <Phone className="size-3.5" />
                {data.advisor.phone}
              </a>
            )}
          </p>
        </div>

        {submitted ? (
          <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
            <div
              className="mx-auto flex size-12 items-center justify-center rounded-full text-white"
              style={{ background: "#16a34a" }}
            >
              <Check className="size-6" />
            </div>
            <p className="mt-3 font-medium text-green-800">
              Thanks! Your advisor has your preferences.
            </p>
            <p className="mt-1 text-sm text-green-700">
              {data.advisor.name} will reach out shortly
              {wantsVisit ? " to arrange the visit" : ""}.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {data.items.map((it, i) => {
                const on = picked.has(it.spaceId);
                return (
                  <button
                    key={it.id}
                    onClick={() => toggle(it.spaceId)}
                    className={`block w-full rounded-xl border-2 bg-white p-4 text-left transition-all ${
                      on ? "shadow-md" : "border-slate-200 hover:border-slate-300"
                    }`}
                    style={on ? { borderColor: accent } : undefined}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">
                          {i + 1}. {it.space.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {it.space.operator.name}
                        </p>
                      </div>
                      <div
                        className={`flex size-6 shrink-0 items-center justify-center rounded-full border-2 ${
                          on ? "text-white" : "border-slate-300"
                        }`}
                        style={
                          on
                            ? { background: accent, borderColor: accent }
                            : undefined
                        }
                      >
                        {on && <Check className="size-4" />}
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-slate-600 sm:grid-cols-4">
                      <span className="flex items-center gap-1">
                        <IndianRupee className="size-3.5" />
                        {formatINR(it.space.pricePerSeat)}/seat
                      </span>
                      <span className="flex items-center gap-1">
                        <Building2 className="size-3.5" />
                        {it.space.availableSeats} seats
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="size-3.5" />
                        {it.space.microMarket}
                      </span>
                      <span>{titleCase(it.space.workspaceType)}</span>
                    </div>

                    <p className="mt-1 text-xs text-slate-400">
                      {it.space.address} · Move-in:{" "}
                      {titleCase(it.space.moveInReady)}
                      {it.space.lockInMonths
                        ? ` · ${it.space.lockInMonths}mo lock-in`
                        : ""}
                    </p>

                    {it.space.amenities?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {it.space.amenities.slice(0, 6).map((a) => (
                          <span
                            key={a}
                            className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600"
                          >
                            {a}
                          </span>
                        ))}
                      </div>
                    )}

                    {it.advisorNote && (
                      <p className="mt-2 rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-800">
                        {it.advisorNote}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 rounded-xl border bg-white p-5 shadow-sm">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={wantsVisit}
                  onChange={(e) => setWantsVisit(e.target.checked)}
                />
                I&apos;d like to visit the spaces I&apos;ve ticked
              </label>
              <textarea
                className="mt-3 w-full rounded-md border border-slate-300 p-2 text-sm"
                rows={3}
                placeholder="Anything else? Preferred visit dates, questions, other requirements…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <button
                onClick={submit}
                disabled={busy}
                className="mt-3 w-full rounded-md py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                style={{ background: accent }}
              >
                {busy
                  ? "Sending…"
                  : picked.size
                    ? `Send my ${picked.size} preferred space${picked.size > 1 ? "s" : ""}`
                    : "None of these suit — let my advisor know"}
              </button>
            </div>
          </>
        )}

        <p className="mt-8 text-center text-xs text-slate-400">
          {branding.companyName} · {branding.phone} · {branding.email}
        </p>
      </div>
    </div>
  );
}
