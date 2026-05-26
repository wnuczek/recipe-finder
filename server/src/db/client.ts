import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

function requireDatabaseUrl() {
  const value = process.env.DATABASE_URL;

  if (!value) {
    throw new Error(
      "Missing DATABASE_URL. Copy .env.example to .env and configure your Supabase Postgres connection.",
    );
  }

  return value;
}

const connectionString = requireDatabaseUrl();

export const sqlClient = postgres(connectionString, {
  prepare: false,
});

export const db = drizzle(sqlClient, { schema });
