import { Hono } from "hono";

import { searchRoute } from "./routes/search";

export const app = new Hono();

app.get("/health", (c) => c.json({ status: "ok" }));
app.route("/api", searchRoute);

app.onError((error, c) => {
  console.error("Unhandled server error", error);

  return c.json(
    {
      error: "Internal server error",
    },
    500,
  );
});
