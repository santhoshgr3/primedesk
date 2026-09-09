import { PrismaClient, type WorkspaceType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const pick = <T>(arr: readonly T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];
const daysAgo = (n: number) => new Date(Date.now() - n * 86400000);
const hoursFromNow = (n: number) => new Date(Date.now() + n * 3600000);

async function main() {
  console.log("🌱 Seeding PrimeDesk CRM…");

  // ── Safety guard ──────────────────────────────────────────
  // This seed WIPES every table. Only allow it against an empty database
  // unless ALLOW_SEED=1 is explicitly set (dev reset).
  const existingUsers = await prisma.user.count();
  if (existingUsers > 0 && process.env.ALLOW_SEED !== "1") {
    console.error(
      `\n✋ Refusing to seed: database already has ${existingUsers} users.\n` +
        `   This seed deletes all data. Re-run with ALLOW_SEED=1 to force.\n`,
    );
    process.exit(1);
  }

  // ── Wipe (dev only) ────────────────────────────────────────
  await prisma.dealStageHistory.deleteMany();
  await prisma.document.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.visit.deleteMany();
  await prisma.shortlistItem.deleteMany();
  await prisma.shortlist.deleteMany();
  await prisma.task.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.message.deleteMany();
  await prisma.enquiryStatusHistory.deleteMany();
  await prisma.enquiry.deleteMany();
  await prisma.space.deleteMany();
  await prisma.operatorContact.deleteMany();
  await prisma.operator.deleteMany();
  await prisma.messageTemplate.deleteMany();
  await prisma.user.deleteMany();

  // ── Users ──────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash("Admin@123", 10);
  const [admin, ops, adv1, adv2, adv3, mkt] = await Promise.all([
    prisma.user.create({
      data: {
        name: "Santhosh Kumar",
        email: "admin@primedesk.co.in",
        role: "ADMIN",
        passwordHash,
        phone: "+917993726302",
        city: "Hyderabad",
      },
    }),
    prisma.user.create({
      data: {
        name: "Divya Reddy",
        email: "ops@primedesk.co.in",
        role: "OPERATIONS",
        passwordHash,
        city: "Hyderabad",
      },
    }),
    prisma.user.create({
      data: {
        name: "Arjun Mehta",
        email: "arjun@primedesk.co.in",
        role: "ADVISOR",
        passwordHash,
        city: "Hyderabad",
      },
    }),
    prisma.user.create({
      data: {
        name: "Kavya Nair",
        email: "kavya@primedesk.co.in",
        role: "ADVISOR",
        passwordHash,
        city: "Bangalore",
      },
    }),
    prisma.user.create({
      data: {
        name: "Rohit Sharma",
        email: "rohit@primedesk.co.in",
        role: "ADVISOR",
        passwordHash,
        city: "Chennai",
      },
    }),
    prisma.user.create({
      data: {
        name: "Neha Gupta",
        email: "neha@primedesk.co.in",
        role: "MARKETING",
        passwordHash,
        city: "Hyderabad",
      },
    }),
  ]);
  const advisors = [adv1, adv2, adv3];

  // ── Message templates ──────────────────────────────────────
  await prisma.messageTemplate.createMany({
    data: [
      {
        key: "welcome_enquiry",
        name: "Welcome — Enquiry received",
        body: "Hi {{name}}, thanks for reaching out to PrimeDesk! Our workspace advisor will call you within 2 hours.",
        approved: true,
      },
      {
        key: "shortlist_ready",
        name: "Shortlist ready",
        body: "Hi {{name}}, we've shortlisted {{count}} spaces matching your requirement. Check the PDF attached!",
        approved: true,
      },
      {
        key: "visit_confirmation",
        name: "Visit confirmation",
        body: "Your site visit is confirmed for {{date}} at {{location}}. Our advisor {{advisor}} will meet you there.",
        approved: true,
      },
      {
        key: "visit_reminder_1day",
        name: "Visit reminder — 1 day",
        body: "Reminder: Your office space visit is tomorrow at {{time}}. Any questions? Call us at +91 7993726302",
        approved: true,
      },
      {
        key: "visit_reminder_2hr",
        name: "Visit reminder — 2 hours",
        body: "Just 2 hours to your visit at {{space}}! See you there.",
        approved: true,
      },
      {
        key: "follow_up_after_visit",
        name: "Follow up after visit",
        body: "Hi {{name}}, hope you liked the spaces! Which one felt right? Happy to discuss pricing or arrange another visit.",
        approved: true,
      },
      {
        key: "deal_congratulations",
        name: "Deal congratulations",
        body: "Congratulations! Your office at {{space}} is confirmed. Welcome to your new workspace! 🎉",
        approved: true,
      },
    ],
  });

  // ── Operators + spaces ─────────────────────────────────────
  const operatorSeed = [
    { name: "IndiQube", type: "national_chain", rate: 8.5 },
    { name: "Awfis", type: "national_chain", rate: 8 },
    { name: "Smartworks", type: "national_chain", rate: 7.5 },
    { name: "91springboard", type: "regional", rate: 9 },
    { name: "WeWork India", type: "national_chain", rate: 7 },
    { name: "Vakil Estate (independent)", type: "independent", rate: 10 },
  ];

  const cityMarkets: Record<string, string[]> = {
    Hyderabad: ["HITEC City", "Gachibowli", "Financial District", "Madhapur", "Kondapur"],
    Bangalore: ["Koramangala", "Whitefield", "Outer Ring Road", "Indiranagar"],
    Chennai: ["OMR", "Guindy", "Nungambakkam"],
    Delhi: ["Gurgaon Cyber City", "Nehru Place", "Aerocity"],
  };
  const wsTypes: WorkspaceType[] = [
    "MANAGED_OFFICE",
    "COWORKING",
    "PLUG_AND_PLAY",
    "GCC_ENTERPRISE",
  ];

  const spaces: { id: string; city: string; operatorId: string }[] = [];
  for (const o of operatorSeed) {
    const operator = await prisma.operator.create({
      data: {
        name: o.name,
        type: o.type,
        commissionRate: o.rate,
        rating: 3 + Math.floor(Math.random() * 3),
        contacts: {
          create: {
            name: `${o.name.split(" ")[0]} Desk`,
            phone: "+9198" + Math.floor(10000000 + Math.random() * 89999999),
            email: `partners@${o.name.split(" ")[0].toLowerCase()}.com`,
            isPrimary: true,
          },
        },
      },
    });

    for (const city of Object.keys(cityMarkets)) {
      const markets = cityMarkets[city];
      const n = 1 + Math.floor(Math.random() * 2);
      for (let i = 0; i < n; i++) {
        const total = pick([60, 80, 120, 150, 200, 300]);
        const s = await prisma.space.create({
          data: {
            operatorId: operator.id,
            name: `${o.name.split(" ")[0]} ${pick(markets)}`,
            city,
            microMarket: pick(markets),
            address: `${pick(markets)}, ${city}`,
            workspaceType: pick(wsTypes),
            totalSeats: total,
            availableSeats: Math.floor(total * (0.2 + Math.random() * 0.6)),
            areaSqft: total * 80,
            floor: `${1 + Math.floor(Math.random() * 8)}`,
            building: `${pick(["Cyber", "Prime", "Summit", "Orbit"])} Towers`,
            pricePerSeat: pick([6500, 7000, 7500, 8000, 8500, 9500, 12000]),
            lockInMonths: pick([6, 12, 24]),
            depositMonths: pick([2, 3]),
            includedItems: ["Internet", "Electricity", "Housekeeping", "Meeting room hours"],
            addOnItems: ["Parking", "Extra cabins"],
            amenities: ["Parking", "24/7 Access", "IT Infrastructure", "Cafeteria", "Meeting Rooms", "Power Backup"],
            status: pick(["active", "active", "active", "waitlisted"]),
            moveInReady: pick(["ready", "2_weeks", "1_month"]),
            lastVerifiedAt: daysAgo(Math.floor(Math.random() * 40)),
          },
        });
        spaces.push({ id: s.id, city, operatorId: operator.id });
      }
    }
  }

  // ── Enquiries ──────────────────────────────────────────────
  const companies = [
    "TechSpark Labs", "FinStream", "MarketVista", "CloudNine Systems", "Zephyr AI",
    "Nexora Consulting", "BrightPath Health", "Quanta Analytics", "Orbit Logistics",
    "PixelForge Studios", "GreenLeaf Energy", "Vertex Fintech", "Lumen Software",
    "Apex GCC India", "Stride Robotics", "Kettle & Co", "DataHarbor", "NovaPay",
    "SilkRoute Exports", "HelioMed", "CraftLabs", "Beacon Talent", "IronClad Security",
    "MetroWorks", "Skyline BPO",
  ];
  const seatRanges = ["20-50", "50-100", "100-200", "200+"];
  const cities = Object.keys(cityMarkets);
  const sources = [
    "WEBSITE_FORM", "WHATSAPP_INBOUND", "LINKEDIN", "FACEBOOK_ADS",
    "GOOGLE_ADS", "REFERRAL", "COLD_CALL",
  ] as const;
  const statuses = [
    "NEW", "NEW", "ADVISOR_ASSIGNED", "REQUIREMENT_CALL_DONE",
    "SHORTLIST_SENT", "SHORTLIST_SENT", "VISIT_SCHEDULED", "VISIT_DONE",
    "NEGOTIATION", "CLOSED_WON", "CLOSED_LOST", "PAUSED",
  ] as const;
  const industries = ["IT / Software", "Fintech", "Startup", "GCC", "Consulting", "Healthcare"];

  let createdCount = 0;
  for (let i = 0; i < companies.length; i++) {
    const status = statuses[i % statuses.length];
    const assigned =
      status === "NEW" && i % 2 === 0 ? null : pick(advisors);
    const city = pick(cities);
    const createdAt = daysAgo(Math.floor(Math.random() * 45));

    const enquiry = await prisma.enquiry.create({
      data: {
        companyName: companies[i],
        industry: pick(industries),
        companySize: pick([30, 60, 120, 250, 500, 900]),
        contactName: pick([
          "Rahul M", "Sneha R", "Priya D", "Vikram S", "Ananya K",
          "Karthik V", "Meera J", "Aditya P",
        ]),
        contactPhone: "+9199" + Math.floor(10000000 + Math.random() * 89999999),
        contactEmail: `contact${i}@${companies[i].split(" ")[0].toLowerCase()}.com`,
        contactDesig: pick(["HR Head", "Admin Manager", "CEO", "CTO", "Office Manager"]),
        seatsNeeded: pick(seatRanges),
        city,
        microMarket: pick(cityMarkets[city]),
        workspaceType: pick(wsTypes),
        budgetPerSeat: pick([7000, 7500, 8000, 9000, 11000]),
        moveInTimeline: pick(["immediate", "1_month", "3_months", "exploring"]),
        amenityPriority: pick([
          ["Parking", "24/7 Access"],
          ["IT Infrastructure", "Meeting Rooms"],
          ["Cafeteria", "Metro Nearby"],
        ]),
        notes: i % 3 === 0 ? "Prefers a fully furnished plug-and-play setup." : null,
        source: pick(sources),
        status,
        priority: pick(["hot", "warm", "warm", "cold"]),
        assignedToId: assigned?.id ?? null,
        createdAt,
        lastActivityAt: daysAgo(Math.floor(Math.random() * 10)),
        activities: {
          create: [
            {
              type: "note",
              description: "Enquiry created",
              performedBy: admin.id,
              createdAt,
            },
            ...(assigned
              ? [
                  {
                    type: "status_change",
                    description: `Status changed NEW → ${status}`,
                    performedBy: assigned.id,
                    createdAt: daysAgo(Math.floor(Math.random() * 5)),
                  },
                ]
              : []),
          ],
        },
      },
    });
    createdCount++;

    // Status history so the funnel report has stage-progression data
    const FUNNEL = [
      "NEW",
      "ADVISOR_ASSIGNED",
      "REQUIREMENT_CALL_DONE",
      "SHORTLIST_SENT",
      "VISIT_SCHEDULED",
      "VISIT_DONE",
      "NEGOTIATION",
      "CLOSED_WON",
    ];
    const reachedIdx = FUNNEL.indexOf(status);
    if (reachedIdx > 0) {
      for (let s = 1; s <= reachedIdx; s++) {
        await prisma.enquiryStatusHistory.create({
          data: {
            enquiryId: enquiry.id,
            fromStatus: FUNNEL[s - 1] as never,
            toStatus: FUNNEL[s] as never,
            changedBy: assigned?.id ?? admin.id,
            createdAt: daysAgo(Math.max(1, 30 - s * 3 - Math.floor(Math.random() * 3))),
          },
        });
      }
    }

    // Open task for non-closed enquiries
    if (!["CLOSED_WON", "CLOSED_LOST", "PAUSED"].includes(status) && assigned) {
      await prisma.task.create({
        data: {
          type: pick(["CALL", "WHATSAPP", "FOLLOW_UP"]),
          title: pick([
            "Follow up on shortlist response",
            "Make requirement call",
            "Confirm visit slot with client",
            "Send revised options",
          ]),
          dueDate: pick([hoursFromNow(-20), hoursFromNow(-2), hoursFromNow(6), hoursFromNow(30)]),
          enquiryId: enquiry.id,
          assignedToId: assigned.id,
          priority: pick(["URGENT", "HIGH", "MEDIUM"]),
        },
      });
    }

    // Shortlist for mid/late funnel
    if (
      ["SHORTLIST_SENT", "VISIT_SCHEDULED", "VISIT_DONE", "NEGOTIATION", "CLOSED_WON"].includes(
        status,
      ) &&
      assigned
    ) {
      const citySpaces = spaces.filter((s) => s.city === city);
      const chosen = citySpaces.slice(0, 3);
      if (chosen.length) {
        await prisma.shortlist.create({
          data: {
            enquiryId: enquiry.id,
            advisorId: assigned.id,
            sentVia: ["whatsapp"],
            sentAt: daysAgo(Math.floor(Math.random() * 8)),
            response: pick(["wants_visit", "no_response", "interested_in_X"]),
            items: {
              create: chosen.map((s, idx) => ({
                spaceId: s.id,
                rank: idx + 1,
                advisorNote: "Good fit on budget & location.",
              })),
            },
          },
        });
      }
    }

    // Visit + deal for late funnel
    if (["VISIT_DONE", "NEGOTIATION", "CLOSED_WON"].includes(status) && assigned) {
      const citySpace = spaces.find((s) => s.city === city);
      if (citySpace) {
        await prisma.visit.create({
          data: {
            enquiryId: enquiry.id,
            spaceId: citySpace.id,
            advisorId: assigned.id,
            scheduledAt: daysAgo(Math.floor(Math.random() * 6)),
            status: "done",
            outcome: pick(["interested", "needs_another", "revisit"]),
            clientFeedback: "Liked the layout; wants to negotiate on lock-in.",
          },
        });

        if (["NEGOTIATION", "CLOSED_WON"].includes(status)) {
          const seats = pick([25, 40, 60, 90, 150]);
          const price = pick([7000, 7500, 8000, 9000]);
          const rate = 8;
          const won = status === "CLOSED_WON";
          const wonAt = daysAgo(Math.floor(Math.random() * 25));
          const deal = await prisma.deal.create({
            data: {
              enquiryId: enquiry.id,
              spaceId: citySpace.id,
              operatorId: citySpace.operatorId,
              advisorId: assigned.id,
              stage: won ? "MOVED_IN" : "NEGOTIATING_TERMS",
              seats,
              pricePerSeat: price,
              monthlyValue: seats * price,
              lockInMonths: 12,
              depositPaid: seats * price * 2,
              commissionRate: rate,
              commissionValue: Math.round(seats * price * (rate / 100)),
              commissionStatus: won ? pick(["invoiced", "received", "received"]) : "pending",
              startDate: won ? wonAt : null,
              movedInAt: won ? wonAt : null,
              updatedAt: won ? wonAt : new Date(),
            },
          });
          await prisma.dealStageHistory.create({
            data: {
              dealId: deal.id,
              toStage: deal.stage,
              changedBy: assigned.id,
              createdAt: won ? wonAt : daysAgo(Math.floor(Math.random() * 5)),
            },
          });
        }
      }
    }
  }

  // A couple of fresh NEW enquiries from "today" for the dashboard KPI
  for (const name of ["FlashPay", "Meridian Health"]) {
    await prisma.enquiry.create({
      data: {
        companyName: name,
        contactName: "Inbound Lead",
        contactPhone: "+9190" + Math.floor(10000000 + Math.random() * 89999999),
        seatsNeeded: pick(seatRanges),
        city: pick(cities),
        workspaceType: "NOT_SURE",
        source: "WEBSITE_FORM",
        status: "NEW",
        priority: "hot",
        lastActivityAt: new Date(),
        activities: {
          create: {
            type: "note",
            description: "Enquiry created via website form",
            performedBy: admin.id,
          },
        },
        tasks: {
          create: {
            type: "CALL",
            title: `Call ${name} within 2 hours`,
            dueDate: hoursFromNow(2),
            assignedToId: adv1.id,
            priority: "URGENT",
          },
        },
      },
    });
    createdCount++;
  }

  // ── A few LOST deals for the lost-deal report ──────────────
  const lostReasons = ["price", "location", "competitor", "requirement_changed", "went_direct"];
  const lostEnquiries = await prisma.enquiry.findMany({
    where: { status: "CLOSED_LOST" },
    take: 6,
  });
  for (const e of lostEnquiries) {
    const sp = spaces.find((s) => s.city === e.city) ?? spaces[0];
    const seats = pick([30, 50, 80]);
    const price = pick([7000, 8000, 9000]);
    const deal = await prisma.deal.create({
      data: {
        enquiryId: e.id,
        spaceId: sp.id,
        operatorId: sp.operatorId,
        advisorId: e.assignedToId ?? adv1.id,
        stage: "LOST",
        seats,
        pricePerSeat: price,
        monthlyValue: seats * price,
        commissionRate: 8,
        commissionValue: 0,
        lostReason: pick(lostReasons),
        updatedAt: daysAgo(Math.floor(Math.random() * 20)),
      },
    });
    await prisma.dealStageHistory.create({
      data: { dealId: deal.id, fromStage: "NEGOTIATING_TERMS", toStage: "LOST", changedBy: adv1.id },
    });
  }

  // ── Call logs ─────────────────────────────────────────────
  const callEnquiries = await prisma.enquiry.findMany({
    where: { assignedToId: { not: null } },
    take: 20,
  });
  for (const e of callEnquiries) {
    const n = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) {
      await prisma.callLog.create({
        data: {
          enquiryId: e.id,
          userId: e.assignedToId!,
          direction: pick(["outbound", "outbound", "inbound"]),
          outcome: pick(["connected", "connected", "no_answer", "voicemail"]),
          durationSec: pick([0, 45, 120, 240, 600]),
          notes: pick([null, "Discussed budget & timeline", "Will revert after internal review"]),
          createdAt: daysAgo(Math.floor(Math.random() * 15)),
        },
      });
    }
  }

  // ── Settings ──────────────────────────────────────────────
  await prisma.setting.createMany({
    data: [
      {
        key: "branding",
        value: {
          companyName: "PrimeDesk",
          primaryColor: "#2563eb",
          logoUrl: "",
          phone: "+91 7993726302",
          email: "info@primedesk.co.in",
          website: "primedesk.co.in",
        },
      },
      { key: "assignment", value: { mode: "round_robin", autoAssignInbound: true } },
      {
        key: "sla",
        value: {
          firstCallHours: 2,
          shortlistHours: 24,
          followUpHours: 24,
          overdueEscalationHours: 48,
        },
      },
      { key: "workingHours", value: { start: "09:00", end: "19:00", days: [1, 2, 3, 4, 5, 6] } },
    ],
  });

  // ── Advisor targets for the current month ─────────────────
  const month = new Date().toISOString().slice(0, 7);
  for (const a of advisors) {
    await prisma.advisorTarget.create({
      data: {
        advisorId: a.id,
        month,
        shortlistsGoal: 25,
        visitsGoal: 12,
        dealsGoal: 4,
        revenueGoal: 300000,
      },
    });
  }

  console.log(
    `✅ Done. 6 users, ${operatorSeed.length} operators, ${spaces.length} spaces, ${createdCount} enquiries, + deals/visits/shortlists/calls/targets/settings.`,
  );
  console.log("   Login: admin@primedesk.co.in / Admin@123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
