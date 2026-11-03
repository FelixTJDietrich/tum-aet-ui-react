import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [react()],
  root: process.env.VITEST ? undefined : 'playground',
  build: {
    outDir: resolve(import.meta.dirname, 'dist'),
    emptyOutDir: false,
    lib: { entry: resolve(import.meta.dirname, 'src/index.ts'), formats: ['es'], fileName: 'index' },
    rollupOptions: { external: ['react', 'react-dom', 'react/jsx-runtime', 'react-dom/client'] },
    cssCodeSplit: false,
  },
  test: {
    root: import.meta.dirname,
    environment: 'jsdom',
    globals: true,
    setupFiles: ['src/test-setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
  },
});
