module.exports = {
  preset: "jest-expo",
  testMatch: ["<rootDir>/{app,components}/**/*.test.ts?(x)"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
};
