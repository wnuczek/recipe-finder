import { Hono } from "hono";
import { cors } from "hono/cors";

import { recipeDetailsRoute } from "./routes/recipe-details";
import { searchRoute } from "./routes/search";

export const app = new Hono();

app.use(
  "/api/*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type"],
  }),
);

app.get("/health", (c) => c.json({ status: "ok" }));
app.route("/api", searchRoute);
app.route("/api", recipeDetailsRoute);

app.onError((error, c) => {
  console.error("Unhandled server error", error);

  return c.json(
    {
      error: "Internal server error",
    },
    500,
  );
});
