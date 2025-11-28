import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // CRITICAL FIX: Use './' for relative paths. 
  // This ensures assets load correctly regardless of the repository name on GitHub Pages.
  base: './', 
  build: {
    outDir: 'dist',
  }
});