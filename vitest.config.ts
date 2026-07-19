import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['packages/astro-theme-lotus/tests/**/*.test.ts'],
  },
});
