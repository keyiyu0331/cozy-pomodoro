import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// One config file for both the dev server (Vite) and the tests (Vitest).
export default defineConfig({
  plugins: [react()],
  test: {
    include: ['src/**/*.test.ts'],
  },
});
