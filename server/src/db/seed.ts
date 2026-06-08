import { inArray, notInArray, sql } from "drizzle-orm";

import { SEED_RECIPES } from "../search/recipes.fixture";
import { db, sqlClient } from "./client";
import { recipeIngredientsTable, recipesTable } from "./schema";

async function seed() {
  await db.transaction(async (tx) => {
    const recipeIds = SEED_RECIPES.map((recipe) => recipe.id);

    if (recipeIds.length > 0) {
      await tx
        .delete(recipesTable)
        .where(notInArray(recipesTable.id, recipeIds));
    } else {
      await tx.delete(recipesTable);
    }

    await tx
      .insert(recipesTable)
      .values(
        SEED_RECIPES.map((recipe) => ({
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

    await tx
      .delete(recipeIngredientsTable)
      .where(inArray(recipeIngredientsTable.recipeId, recipeIds));

    await tx.insert(recipeIngredientsTable).values(
      SEED_RECIPES.flatMap((recipe) =>
        recipe.ingredients.map((ingredient) => ({
          recipeId: recipe.id,
          ingredient: ingredient.name,
          amount: ingredient.amount,
          unit: ingredient.unit,
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
