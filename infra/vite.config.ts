import { defineConfig } from 'vite';
import packageJson from '../package.json' with { type: 'json' };
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { cloudflare } from '@cloudflare/vite-plugin';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = fileURLToPath(new URL('..', import.meta.url));

export default defineConfig({
  root: 'src/ui',
  define: { 'import.meta.env.VITE_APP_VERSION': JSON.stringify(packageJson.version) },
  plugins: [
    react(),
    tailwindcss(),
    cloudflare({ configPath: path.resolve(rootDir, 'infra', 'wrangler.jsonc') }),
  ],
});
