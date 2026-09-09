// Docker-free local Postgres for development, via embedded-postgres.
// Usage: node scripts/db-embedded.mjs start | stop
import EmbeddedPostgres from "embedded-postgres";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(fileURLToPath(import.meta.url), "../..");
const dataDir = path.join(root, ".pgdata");

const pg = new EmbeddedPostgres({
  databaseDir: dataDir,
  user: "primedesk",
  password: "password",
  port: 5432,
  persistent: true,
  initdbFlags: ["--encoding=UTF8", "--lc-collate=C", "--lc-ctype=C"],
});

const cmd = process.argv[2];

if (cmd === "start") {
  if (!fs.existsSync(path.join(dataDir, "PG_VERSION"))) {
    console.log("Initialising cluster…");
    await pg.initialise();
  }
  await pg.start();
  try {
    await pg.createDatabase("primedesk_crm");
    console.log("Created database primedesk_crm");
  } catch {
    console.log("Database primedesk_crm already exists");
  }
  console.log(
    "Postgres up on localhost:5432 (primedesk / password / primedesk_crm). Ctrl+C to stop.",
  );
  process.on("SIGINT", async () => {
    await pg.stop();
    process.exit(0);
  });
  setInterval(() => {}, 1 << 30);
} else if (cmd === "stop") {
  await pg.stop();
  console.log("stopped");
} else {
  console.log("usage: node scripts/db-embedded.mjs start|stop");
  process.exit(1);
}
