export default {
  preset: "ts-jest",
  testEnvironment: "node",
  extensionsToTreatAsEsm: [".ts"],
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        useESM: true,
      },
    ],
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
  testMatch: ["<rootDir>/tests/**/*.test.ts", "<rootDir>/tests/**/*.spec.ts"],
  collectCoverageFrom: [
    "src/services/**/*.ts",
    "!src/services/index.ts",
    "!src/services/userService.ts",
    "src/lib/generateTag.ts",
    "src/lib/countryService.ts",
    "src/middleware/**/*.ts",
    "src/websocket/lobby/**/*.ts",
    "src/websocket/core/connectionManager.ts",

    // ❌ Exclure tout le reste (infrastructure, wrappers, config)
    "!src/**/*.d.ts",
  ],

  coverageThreshold: {
    global: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
  },

  testTimeout: 30000,
  verbose: true,
  forceExit: true,
  detectOpenHandles: true,
};
