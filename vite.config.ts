import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const fromRoot = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  root: 'demo',
  plugins: [react()],
  resolve: {
    alias: {
      'world-of-evolving-paths/react': fromRoot('./src/react/index.ts'),
      'world-of-evolving-paths': fromRoot('./src/index.ts'),
    },
  },
  server: { host: true, port: 5173 },
  build: { outDir: '../dist-demo', emptyOutDir: true },
});
