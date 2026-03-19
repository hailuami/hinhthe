import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/',
  plugins: [react()],
  define: {
    'process.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY || "")
  },
  build: {
    outDir: 'dist',
    target: 'esnext'
  },
  server: {
    port: 3000,
    host: '0.0.0.0'
  }
});
