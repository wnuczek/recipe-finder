import { inArray, sql } from "drizzle-orm";

import { RECIPES } from "../search/recipes.fixture";
import { db, sqlClient } from "./client";
import { recipeIngredientsTable, recipesTable } from "./schema";

async function seed() {
  await db.transaction(async (tx) => {
    await tx
      .insert(recipesTable)
      .values(
        RECIPES.map((recipe) => ({
          id: recipe.id,
          title: recipe.title,
          favoritesCount: recipe.favoritesCount,
        })),
      )
      .onConflictDoUpdate({
        target: recipesTable.id,
        set: {
          title: sql`excluded.title`,
          favoritesCount: sql`excluded.favorites_count`,
        },
      });

    const recipeIds = RECIPES.map((recipe) => recipe.id);

    await tx
      .delete(recipeIngredientsTable)
      .where(inArray(recipeIngredientsTable.recipeId, recipeIds));

    await tx.insert(recipeIngredientsTable).values(
      RECIPES.flatMap((recipe) =>
        recipe.ingredients.map((ingredient) => ({
          recipeId: recipe.id,
          ingredient,
        })),
      ),
    );
  });

  await sqlClient.end({ timeout: 5 });
}

seed().catch(async (error) => {
  console.error("Seed failed", error);
  await sqlClient.end({ timeout: 5 });
  process.exit(1);
});
