import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { cloudflare } from '@cloudflare/vite-plugin';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = fileURLToPath(new URL('..', import.meta.url));

export default defineConfig({
  root: 'src/ui',
  plugins: [
    react(),
    tailwindcss(),
    cloudflare({ configPath: path.resolve(rootDir, 'infra', 'wrangler.jsonc') }),
  ],
});
