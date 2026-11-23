import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

const pages = ['index.html', 'dispatch/index.html', 'booking/index.html', 'handover/index.html'];
export default defineConfig({
  base: './',
  build: {
    license: { fileName: 'THIRD_PARTY_LICENSES.md' },
    rolldownOptions: { input: pages.map(page => fileURLToPath(new URL(page, import.meta.url))) },
  },
  server: { host: '127.0.0.1', proxy: { '/api': 'http://127.0.0.1:4181' } },
});
