import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const fromRoot = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: { index: fromRoot('./src/index.ts'), react: fromRoot('./src/react/index.ts') },
      formats: ['es'],
    },
    rollupOptions: { external: ['pixi.js', 'react', 'react-dom', 'react/jsx-runtime'] },
    emptyOutDir: true,
  },
});
