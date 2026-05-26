import { asc, eq, inArray } from "drizzle-orm";

import type { Recipe } from "../../search/types";
import { db } from "../client";
import { recipeIngredientsTable, recipesTable } from "../schema";

type RecipeResultRow = {
  id: string;
  title: string;
  favoritesCount: number;
  ingredient: string | null;
};

type ListRecipesForSearchOptions = {
  selectedIngredients?: string[];
  includeZeroMatches?: boolean;
};

function normalizeSelectedIngredients(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

export async function listRecipesForSearch(
  options: ListRecipesForSearchOptions = {},
): Promise<Recipe[]> {
  const includeZeroMatches = options.includeZeroMatches ?? false;
  const selectedIngredients = normalizeSelectedIngredients(
    options.selectedIngredients ?? [],
  );

  let candidateRecipeIds: string[] | null = null;

  if (!includeZeroMatches && selectedIngredients.length > 0) {
    const candidateRows = await db
      .selectDistinct({ id: recipeIngredientsTable.recipeId })
      .from(recipeIngredientsTable)
      .where(inArray(recipeIngredientsTable.ingredient, selectedIngredients));

    candidateRecipeIds = candidateRows.map((row) => row.id);

    if (candidateRecipeIds.length === 0) {
      return [];
    }
  }

  const baseQuery = db
    .select({
      id: recipesTable.id,
      title: recipesTable.title,
      favoritesCount: recipesTable.favoritesCount,
      ingredient: recipeIngredientsTable.ingredient,
    })
    .from(recipesTable)
    .leftJoin(
      recipeIngredientsTable,
      eq(recipeIngredientsTable.recipeId, recipesTable.id),
    );

  const rows =
    candidateRecipeIds === null
      ? await baseQuery.orderBy(
          asc(recipesTable.title),
          asc(recipeIngredientsTable.ingredient),
        )
      : await baseQuery
          .where(inArray(recipesTable.id, candidateRecipeIds))
          .orderBy(
            asc(recipesTable.title),
            asc(recipeIngredientsTable.ingredient),
          );

  return mapRowsToRecipes(rows);
}

export async function listIngredients(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ ingredient: recipeIngredientsTable.ingredient })
    .from(recipeIngredientsTable)
    .orderBy(asc(recipeIngredientsTable.ingredient));

  return rows
    .map((row) => row.ingredient.trim())
    .filter((value) => value.length > 0);
}

function mapRowsToRecipes(rows: RecipeResultRow[]): Recipe[] {
  const recipesById = new Map<string, Recipe>();

  for (const row of rows) {
    const existing = recipesById.get(row.id);

    if (!existing) {
      recipesById.set(row.id, {
        id: row.id,
        title: row.title,
        favoritesCount: row.favoritesCount,
        ingredients: row.ingredient ? [row.ingredient] : [],
      });
      continue;
    }

    if (row.ingredient) {
      existing.ingredients.push(row.ingredient);
    }
  }

  return [...recipesById.values()];
}
