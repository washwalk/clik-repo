module.exports = {
  testEnvironment: 'jsdom',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'public/**/*.js',
    '!public/**/*.test.js'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/public/$1'
  }
};