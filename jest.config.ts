import { type JestConfigWithTsJest } from 'ts-jest';

const config: JestConfigWithTsJest = {
  preset: `ts-jest`,
  rootDir: `.`,
  testEnvironment: `node`,
  moduleFileExtensions: [`ts`, `tsx`, `js`, `jsx`, `json`, `node`],
  testMatch: [`<rootDir>/**/*.spec.ts`],
  passWithNoTests: true,
  detectOpenHandles: true,
  setupFilesAfterEnv: [`<rootDir>/setup-jest.js`],
};

export default config;
