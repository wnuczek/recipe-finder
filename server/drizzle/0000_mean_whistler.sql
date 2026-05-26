CREATE TABLE "recipe_ingredients" (
	"recipe_id" text NOT NULL,
	"ingredient" text NOT NULL,
	CONSTRAINT "recipe_ingredients_recipe_id_ingredient_pk" PRIMARY KEY("recipe_id","ingredient")
);
--> statement-breakpoint
CREATE TABLE "recipes" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"favorites_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;