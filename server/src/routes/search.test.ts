import { describe, expect, it } from "vitest";

import { app } from "../app";

describe("POST /api/recipes/search", () => {
  it("returns ranked recipes with metadata", async () => {
    const response = await app.request("/api/recipes/search", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ ingredients: ["ryż"] }),
    });

    expect(response.status).toBe(200);

    const payload = await response.json();

    expect(payload.query.ingredientCount).toBe(1);
    expect(payload.metadata.totalCandidates).toBeGreaterThan(0);
    expect(payload.results[0]).toMatchObject({
      matchCount: expect.any(Number),
      matchPercent: expect.any(Number),
      rank: 1,
    });
  });

  it("returns 400 for invalid payload", async () => {
    const response = await app.request("/api/recipes/search", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ ingredients: [] }),
    });

    expect(response.status).toBe(400);

    const payload = await response.json();
    expect(payload.error).toContain("Invalid payload");
  });
});
