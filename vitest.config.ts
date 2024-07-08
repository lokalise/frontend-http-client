// eslint-disable-next-line import/no-unresolved
import { defineConfig } from 'vitest/config'

// eslint-disable-next-line import/no-default-export
export default defineConfig({
	test: {
		globals: true,
		coverage: {
			include: ['src/**/*.ts'],
			exclude: [
				'src/**/*.spec.ts',
				'src/**/*.test.ts',
				'src/index.ts',
				'src/types.ts',
				'src/utils/either.ts',
			],
			reporter: ['lcov', 'text'],
			all: true,
			thresholds: {
				lines: 100,
				functions: 100,
				branches: 100,
				statements: 100,
			},
		},
	},
})
