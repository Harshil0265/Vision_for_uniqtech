import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      // Listen on IPv4 loopback. With the default "localhost", Node on Windows often binds only to IPv6 (::1),
      // so http://127.0.0.1:5173 and some external browsers could not reach the page. "localhost" still works.
      host: '127.0.0.1',
      port: 5173,
      // Open the app in the default browser on `npm run dev` (set BROWSER=none to turn this off).
      open: process.env.BROWSER !== 'none',
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      // Forward API calls to the .NET API (backend/Vision.API, launch profile "http").
      proxy: {
        '/api': {
          target: process.env.VISION_API_URL || 'http://localhost:5286',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    // `npm run preview` (production build) uses the same address rules.
    preview: {
      host: '127.0.0.1',
      port: 4173,
      proxy: {
        '/api': {
          target: process.env.VISION_API_URL || 'http://localhost:5286',
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
