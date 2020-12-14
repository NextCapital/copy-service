module.exports = {
  collectCoverage: true,
  collectCoverageFrom: [
    "js/**/*.js"
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
    'json'
  ],
  moduleDirectories: [
    'node_modules',
    'js'
  ],
  testMatch: [
    "<rootDir>/js/**/*.test.js",
    "<rootDir>/integration-tests/**/*.test.js"
  ],
  testResultsProcessor: "./node_modules/jest-junit-reporter",
  restoreMocks: true,
};
