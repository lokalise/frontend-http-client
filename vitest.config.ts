// eslint-disable-next-line import/no-unresolved
import { defineConfig } from 'vitest/config'

// eslint-disable-next-line import/no-default-export
export default defineConfig({
	test: {
		globals: true,
		coverage: {
			include: ['src/**/*.ts'],
			exclude: ['src/**/*.spec.ts', 'src/**/*.test.ts', 'src/index.ts', 'src/types.ts'],
			reporter: ['lcov', 'text-summary'],
			all: true,
			thresholds: {
				lines: 99,
				functions: 91,
				branches: 100,
				statements: 99,
			},
		},
	},
})
