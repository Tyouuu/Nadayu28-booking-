import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Gemini API key is accessed via import.meta.env.VITE_GEMINI_API_KEY in code.
// No need to define process.env — Vite exposes VITE_* env vars automatically.
export default defineConfig({
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
});
