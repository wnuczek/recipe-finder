import type { Recipe } from "./types";

export const RECIPES: Recipe[] = [
  {
    id: "r-001",
    title: "Makaron pomidorowy z bazylią",
    ingredients: ["makaron", "pomidor", "czosnek", "bazylia", "oliwa z oliwek"],
    favoritesCount: 40,
  },
  {
    id: "r-002",
    title: "Kurczak curry z ryżem",
    ingredients: ["kurczak", "ryż", "curry", "cebula", "mleko kokosowe"],
    favoritesCount: 95,
  },
  {
    id: "r-003",
    title: "Sałatka z tuńczykiem",
    ingredients: ["tuńczyk", "sałata", "ogórek", "pomidor", "oliwa z oliwek"],
    favoritesCount: 31,
  },
  {
    id: "r-004",
    title: "Zupa krem z dyni",
    ingredients: ["dynia", "cebula", "czosnek", "bulion", "śmietanka"],
    favoritesCount: 55,
  },
  {
    id: "r-005",
    title: "Ryż z warzywami",
    ingredients: ["ryż", "papryka", "marchew", "groszek", "sos sojowy"],
    favoritesCount: 95,
  },
];
