/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
    }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  setupFilesAfterEnv: [],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/e2e/',
    '/.next/',
  ],
};

module.exports = config;
