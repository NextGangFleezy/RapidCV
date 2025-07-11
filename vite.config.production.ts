import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    target: 'es2020',
    minify: false,
    sourcemap: false,
    cssCodeSplit: false,
    rollupOptions: {
      treeshake: 'smallest',
      output: {
        manualChunks: undefined,
      },
      external: [],
    },
    chunkSizeWarningLimit: 5000,
  },
  optimizeDeps: {
    force: true,
    include: ['react', 'react-dom'],
  },
  logLevel: 'error',
});