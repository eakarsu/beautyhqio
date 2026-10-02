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
  setupFiles: ['<rootDir>/src/test/setup-env.ts'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/e2e/',
    '/.next/',
    // tests/unit/*.test.ts are written for node:test (`node --test tests/*.test.ts`),
    // not Jest. Without this, jest's `**/*.test.ts` glob picks them up, runs them on
    // the wrong runner and reports a false failure in `npm run test:unit`.
    '<rootDir>/tests/',
  ],
  modulePathIgnorePatterns: ['<rootDir>/.next/'],
};

module.exports = config;
