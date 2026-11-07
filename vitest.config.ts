import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'demo/**/*.test.ts', 'tests/**/*.test.ts'] },
  resolve: {
    alias: {
      'world-of-evolving-paths/react': fileURLToPath(new URL('./src/react/index.ts', import.meta.url)),
      'world-of-evolving-paths': fileURLToPath(new URL('./src/index.ts', import.meta.url)),
    },
  },
});
