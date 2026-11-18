import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

function listFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? listFiles(join(dir, entry.name)) : [join(dir, entry.name)],
  );
}

/**
 * After `npm run build`, writes dist/sw.js: the service worker that lets the
 * app work offline. It is scripts/sw-template.js with the list of built
 * files (and a fingerprint of their contents) added at the top.
 */
function offlineServiceWorker(): Plugin {
  return {
    name: 'cozy-pomodoro-service-worker',
    apply: 'build',
    closeBundle() {
      const dist = 'dist';
      const files = listFiles(dist)
        .filter((file) => !file.endsWith('sw.js'))
        .sort();

      const fingerprint = createHash('sha256');
      for (const file of files) fingerprint.update(readFileSync(file));

      const urls = files
        .map((file) => './' + relative(dist, file).split('\\').join('/'))
        .map((url) => (url === './index.html' ? './' : url));

      const template = readFileSync('scripts/sw-template.js', 'utf8');
      fingerprint.update(template); // a changed worker also counts as a new version
      const header =
        `const VERSION = '${fingerprint.digest('hex').slice(0, 12)}';\n` +
        `const FILES = ${JSON.stringify(urls, null, 2)};\n\n`;
      writeFileSync(join(dist, 'sw.js'), header + template);
    },
  };
}

// One config file for both the dev server / build (Vite) and the tests (Vitest).
export default defineConfig({
  base: './', // relative paths, so the built app works from any folder or address
  plugins: [react(), offlineServiceWorker()],
  test: {
    include: ['src/**/*.test.ts'],
  },
});
