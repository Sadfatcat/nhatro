/** Jest config for backend tests living in .test/api/ — kept out of apps/api
 *  so the NestJS project itself never needs a test runner wired in. */
module.exports = {
  rootDir: '..',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/.test/api/**/*.test.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/.test/tsconfig.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  moduleNameMapper: {
    '^@prisma/client$': '<rootDir>/apps/api/node_modules/@prisma/client',
  },
  clearMocks: true,
};
