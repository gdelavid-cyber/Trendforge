import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    setupFiles: ['dotenv/config'],
    testTimeout: 30000,
    hookTimeout: 30000,
    // Each file gets its own process so module-level singletons
    // (circuit breaker state, prisma, redis) never leak between suites.
    pool: 'forks',
    // Suites mutate shared dev-DB rows (species budgets/kill-switch);
    // parallel files would race each other's fixtures.
    fileParallelism: false,
    sequence: { concurrent: false },
  },
});
