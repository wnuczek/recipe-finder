import type { SupportedUnit } from "./supported-units";
import type { Recipe } from "./types";

export type SeedIngredient = {
  name: string;
  amount: number | null;
  unit: SupportedUnit | null;
};

export type SeedRecipe = {
  id: string;
  title: string;
  favoritesCount: number;
  ingredients: SeedIngredient[];
};

export const SEED_RECIPES: SeedRecipe[] = [
  {
    id: "r-001",
    title: "Makaron pomidorowy z bazylią",
    favoritesCount: 40,
    ingredients: [
      { name: "makaron", amount: 200, unit: "g" },
      { name: "pomidor", amount: 4, unit: "szt" },
      { name: "czosnek", amount: 2, unit: "szt" },
      { name: "bazylia", amount: null, unit: null },
      { name: "oliwa z oliwek", amount: 2, unit: "łyżka" },
    ],
  },
  {
    id: "r-002",
    title: "Kurczak curry z ryżem",
    favoritesCount: 95,
    ingredients: [
      { name: "kurczak", amount: 400, unit: "g" },
      { name: "ryż", amount: 1, unit: "szklanka" },
      { name: "curry", amount: 2, unit: "łyżeczka" },
      { name: "cebula", amount: 1, unit: "szt" },
      { name: "mleko kokosowe", amount: 400, unit: "ml" },
    ],
  },
  {
    id: "r-003",
    title: "Sałatka z tuńczykiem",
    favoritesCount: 31,
    ingredients: [
      { name: "tuńczyk", amount: 150, unit: "g" },
      { name: "sałata", amount: 1, unit: "szt" },
      { name: "ogórek", amount: 1, unit: "szt" },
      { name: "pomidor", amount: 2, unit: "szt" },
      { name: "oliwa z oliwek", amount: 2, unit: "łyżka" },
    ],
  },
  {
    id: "r-004",
    title: "Zupa krem z dyni",
    favoritesCount: 55,
    ingredients: [
      { name: "dynia", amount: 600, unit: "g" },
      { name: "cebula", amount: 1, unit: "szt" },
      { name: "czosnek", amount: 2, unit: "szt" },
      { name: "bulion", amount: 750, unit: "ml" },
      { name: "śmietanka", amount: 100, unit: "ml" },
    ],
  },
  {
    id: "r-005",
    title: "Ryż z warzywami",
    favoritesCount: 95,
    ingredients: [
      { name: "ryż", amount: 1, unit: "szklanka" },
      { name: "papryka", amount: 1, unit: "szt" },
      { name: "marchew", amount: 2, unit: "szt" },
      { name: "groszek", amount: 150, unit: "g" },
      { name: "sos sojowy", amount: 3, unit: "łyżka" },
    ],
  },
];

// Names-only view preserved for the ranking utility and its tests.
export const RECIPES: Recipe[] = SEED_RECIPES.map((recipe) => ({
  id: recipe.id,
  title: recipe.title,
  favoritesCount: recipe.favoritesCount,
  ingredients: recipe.ingredients.map((ingredient) => ingredient.name),
}));
