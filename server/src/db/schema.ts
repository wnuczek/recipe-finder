import {
  doublePrecision,
  integer,
  pgTable,
  primaryKey,
  text,
} from "drizzle-orm/pg-core";

export const recipesTable = pgTable("recipes", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  favoritesCount: integer("favorites_count").notNull().default(0),
});

export const recipeIngredientsTable = pgTable(
  "recipe_ingredients",
  {
    recipeId: text("recipe_id")
      .notNull()
      .references(() => recipesTable.id, { onDelete: "cascade" }),
    ingredient: text("ingredient").notNull(),
    // Nullable pair: amount === null means "to taste" ("do smaku"); unit is
    // null only when amount is null. Units are constrained at the app layer
    // by server/src/search/supported-units.ts, not by a DB enum.
    amount: doublePrecision("amount"),
    unit: text("unit"),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.recipeId, table.ingredient] }),
  }),
);
