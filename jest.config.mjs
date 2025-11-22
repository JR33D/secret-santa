// Base config shared across projects
const baseConfig = {
	moduleNameMapper: {
		'^@/(.*)$': '<rootDir>/src/$1',
	},
	collectCoverageFrom: ['src/**/*.{js,jsx,ts,tsx}', '!src/**/*.d.ts', '!src/**/*.stories.{js,jsx,ts,tsx}', '!src/**/__tests__/**', '!src/**/node_modules/**'],
	coverageThreshold: {
		global: { branches: 70, functions: 70, lines: 70, statements: 70 },
	},
};

// Export multiple projects
const projectConfig = {
	projects: [
		{
			displayName: 'jsdom',
			testEnvironment: 'jest-environment-jsdom',
			preset: 'ts-jest',
			setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
			testMatch: ['**/__tests__/components/**/*.test.{ts,tsx}', '**/__tests__/app/**/*.test.{ts,tsx}'],
			...baseConfig,
		},
		{
			displayName: 'node',
			testEnvironment: 'node',
			preset: 'ts-jest',
			setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
			testMatch: ['**/__tests__/api/**/*.test.{ts,tsx}', '**/__tests__/lib/**/*.test.{ts,tsx}'],
			...baseConfig,
		},
	],
};

export default projectConfig;
