import type { RankedRecipe } from "@/services/search-client";

const snapshots = new Map<string, RankedRecipe>();

export function setRecipeSnapshots(recipes: RankedRecipe[]): void {
  for (const recipe of recipes) {
    snapshots.set(recipe.id, recipe);
  }
}

export function getRecipeSnapshot(id: string): RankedRecipe | undefined {
  return snapshots.get(id);
}
