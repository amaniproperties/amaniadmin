import { defineConfig } from 'vite';
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const backendTarget = process.env.AMANI_ADMIN_PROXY_TARGET || 'http://127.0.0.1:4000';
const frontendPort = Number(process.env.VITE_PORT || 3001);
const pages = Object.fromEntries(
  readdirSync(resolve(root, 'production'))
    .filter((name) => name.endsWith('.html'))
    .map((name) => [name.replace(/\.html$/, ''), resolve(root, 'production', name)])
);

export default defineConfig({
  root,
  base: '/',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2022',
    rollupOptions: { input: pages }
  },
  server: {
    host: '127.0.0.1',
    port: frontendPort,
    strictPort: true,
    open: '/production/index.html',
    proxy: {
      '/api': { target: backendTarget, changeOrigin: true },
      '/health': { target: backendTarget, changeOrigin: true }
    }
  },
  preview: {
    host: '127.0.0.1',
    port: 3001,
    strictPort: true
  },
  css: {
    preprocessorOptions: {
      scss: { quietDeps: true }
    }
  }
});
