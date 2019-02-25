module.exports = {
  collectCoverage: true,
  collectCoverageFrom: [
    "js/**/*.{js,jsx}"
  ],
  moduleFileExtensions: [
    'js',
    'jsx',
    'json'
  ],
  moduleDirectories: [
    'node_modules',
    'js'
  ],
  testMatch: [
    "<rootDir>/js/**/*.test.{js,jsx}",
    "<rootDir>/integration-tests/**/*.test.{js,jsx}"
  ],
  transform: {
    '^.+\\.jsx?$': 'babel-jest'
  },
  testResultsProcessor: "./node_modules/jest-junit-reporter",
  restoreMocks: true,
};
