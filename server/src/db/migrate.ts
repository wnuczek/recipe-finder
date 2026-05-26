import { migrate } from "drizzle-orm/postgres-js/migrator";

import { db, sqlClient } from "./client";

async function runMigrations() {
  await migrate(db, {
    migrationsFolder: "server/drizzle",
  });

  await sqlClient.end({ timeout: 5 });
}

runMigrations().catch(async (error) => {
  console.error("Migration failed", error);
  await sqlClient.end({ timeout: 5 });
  process.exit(1);
});
