module.exports = {
  collectCoverage: true,
  collectCoverageFrom: [
    "js/**/*.js",
    "js/**/*.ts"
  ],
  coverageThreshold: {
    global: {
      statements: -9,
      branches: -12,
      functions: 100,
      lines: -9
    }
  },
  moduleFileExtensions: [
    'js',
    'json',
    'ts'
  ],
  moduleDirectories: [
    'node_modules',
    'js'
  ],
  testMatch: [
    "<rootDir>/js/**/*.test.js",
    "<rootDir>/js/**/*.test.ts",
    "<rootDir>/integration-tests/**/*.test.js",
    "<rootDir>/integration-tests/**/*.test.ts",
  ],
  testResultsProcessor: "./node_modules/jest-junit-reporter",
  restoreMocks: true,
};
