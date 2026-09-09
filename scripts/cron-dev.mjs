// Local cron runner — mirrors vercel.json so scheduled jobs fire in dev.
// Usage: npm run dev:cron   (run alongside `npm run dev`)
import cron from "node-cron";

const BASE = process.env.APP_URL ?? "http://localhost:3000";
const SECRET = process.env.CRON_SECRET;

const JOBS = [
  { name: "reminders", schedule: "*/15 * * * *" },
  { name: "escalate", schedule: "0 * * * *" },
  { name: "digest", schedule: "30 3 * * *" },
  { name: "rescore", schedule: "0 20 * * *" },
];

async function run(name) {
  const started = Date.now();
  try {
    const res = await fetch(`${BASE}/api/cron/${name}`, {
      method: "POST",
      headers: SECRET ? { Authorization: `Bearer ${SECRET}` } : {},
    });
    const body = await res.json().catch(() => ({}));
    console.log(
      `[cron:${name}] ${res.status} ${Date.now() - started}ms`,
      JSON.stringify(body),
    );
  } catch (err) {
    console.error(`[cron:${name}] failed`, err.message);
  }
}

for (const j of JOBS) {
  cron.schedule(j.schedule, () => run(j.name));
  console.log(`scheduled ${j.name} (${j.schedule})`);
}

// Also run the fast ones once on start so you see output immediately.
if (process.argv.includes("--now")) {
  run("reminders");
  run("rescore");
}

console.log(`Local cron runner up. Target: ${BASE}. Ctrl+C to stop.`);
