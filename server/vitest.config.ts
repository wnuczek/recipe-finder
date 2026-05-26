import { defineConfig } from "vitest/config";

export default defineConfig({
  root: ".",
  test: {
    include: ["server/src/**/*.test.ts"],
    environment: "node",
    globals: true,
    coverage: {
      enabled: false,
    },
  },
});
