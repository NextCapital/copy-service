module.exports = {
  collectCoverage: true,
  collectCoverageFrom: [
    "js/**/*.ts"
  ],
  coverageThreshold: {
    global: {
      statements: -11,
      branches: -13,
      functions: 100,
      lines: -11
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
  restoreMocks: true,
  testEnvironment: 'node',
  testMatch: [
    "<rootDir>/js/**/*.test.ts",
    "<rootDir>/integration-tests/**/*.test.ts",
  ],
  testResultsProcessor: "./node_modules/jest-junit-reporter",
  transform: {
    '^.+\.tsx?$': ['ts-jest', {
      tsconfig: {
        resolveJsonModule: true
      }
    }]
  }
};
