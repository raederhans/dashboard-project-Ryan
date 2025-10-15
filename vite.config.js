import { defineConfig } from 'vite';

export default defineConfig({
  root: 'public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    fs: { strict: false, allow: ['..'] },
  },
  preview: {
    port: 4173,
  },
});

