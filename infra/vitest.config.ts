import { defineConfig } from 'vitest/config';
import packageJson from '../package.json' with { type: 'json' };

export default defineConfig({
  define: { 'import.meta.env.VITE_APP_VERSION': JSON.stringify(packageJson.version) },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
  },
});
