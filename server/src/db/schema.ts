import { integer, pgTable, primaryKey, text } from "drizzle-orm/pg-core";

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
  },
  (table) => ({
    pk: primaryKey({ columns: [table.recipeId, table.ingredient] }),
  }),
);
