const CI = require('is-ci');

/** @type {import('jest').Config} */
module.exports = {
  collectCoverage: CI,
  coverageDirectory: '../../artifacts/unit/coverage',
  modulePathIgnorePatterns: [/dist/, /node_modules/, /e2e/].map((s) => s.source),
  preset: 'ts-jest',
  testMatch: [
    '<rootDir>/src/**/*.test.{js,ts}',
    '<rootDir>/src/__tests__/**/*.{js,ts}'
  ],
};
