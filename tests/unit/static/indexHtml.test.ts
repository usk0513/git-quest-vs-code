// @vitest-environment node
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

// Vite copies public/ into the build as is, and prefixes absolute URLs to its
// files in index.html with the base path (/git-quest-vs-code/ on GitHub
// Pages). A favicon that is not in public/ is missing from the build: GitHub
// Pages answers 404, and the preview server answers with the app's HTML.
const root = path.resolve(__dirname, '../../..');

// The first bytes of each file type that index.html declares for an icon.
const signatures: Record<string, (file: Buffer) => boolean> = {
  'image/svg+xml': (file) => /^<svg[\s>]/.test(file.toString('utf8').trimStart()),
  'image/png': (file) =>
    file.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
};

describe('index.html', () => {
  it('links favicons that are in public/ and have the declared type', async () => {
    const html = await readFile(path.join(root, 'index.html'), 'utf8');
    const icons = [...html.matchAll(/<link rel="icon" type="([^"]+)"[^>]* href="([^"]+)"/g)].map(
      ([, type, href]) => ({ type, href })
    );

    expect(icons.map((icon) => icon.type)).toEqual(['image/svg+xml', 'image/png']);
    for (const { type, href } of icons) {
      expect(href).toMatch(/^\/[^/]/);
      const file = await readFile(path.join(root, 'public', href));
      expect(signatures[type](file), href).toBe(true);
    }
  });
});
