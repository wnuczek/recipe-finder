import { defineConfig } from "drizzle-kit";

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgres://postgres:postgres@localhost:5432/recipe_finder";

export default defineConfig({
  dialect: "postgresql",
  schema: "./server/src/db/schema.ts",
  out: "./server/drizzle",
  dbCredentials: {
    url: databaseUrl,
  },
});
