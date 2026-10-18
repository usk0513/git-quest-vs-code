// @vitest-environment node
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { compile } from 'tailwindcss';
import { describe, expect, it } from 'vitest';

// These tests compile src/styles/index.css with Tailwind itself, so they check
// the CSS the app ships. jsdom cannot evaluate media queries or cascade
// layers, which is why component tests alone cannot catch these regressions.
const require = createRequire(import.meta.url);
const tailwindDir = path.dirname(require.resolve('tailwindcss/package.json'));
const stylesDir = path.resolve(__dirname, '../../../src/styles');

const loadStylesheet = async (id: string, base: string) => {
  const file = id === 'tailwindcss' ? path.join(tailwindDir, 'index.css') : path.resolve(base, id);
  return { path: file, base: path.dirname(file), content: await readFile(file, 'utf8') };
};

const buildCss = async (candidates: string[]) => {
  const css = await readFile(path.join(stylesDir, 'index.css'), 'utf8');
  const compiler = await compile(css, { base: stylesDir, loadStylesheet });
  return compiler.build(candidates);
};

type Block = { prelude: string; parents: string[]; body: string };

// Splits the compiled CSS into blocks, recording the preludes that enclose
// each one (for example ['@layer utilities', '@media (hover: none)']).
const parseBlocks = (css: string): Block[] => {
  const blocks: Block[] = [];
  const stack: { prelude: string; start: number }[] = [];
  let preludeStart = 0;
  for (let i = 0; i < css.length; i++) {
    const ch = css[i];
    if (ch === '{') {
      stack.push({ prelude: css.slice(preludeStart, i).trim(), start: i + 1 });
      preludeStart = i + 1;
    } else if (ch === '}') {
      const open = stack.pop();
      if (open) {
        blocks.push({
          prelude: open.prelude,
          parents: stack.map((s) => s.prelude),
          body: css.slice(open.start, i),
        });
      }
      preludeStart = i + 1;
    } else if (ch === ';') {
      preludeStart = i + 1;
    }
  }
  return blocks;
};

const findBlock = (css: string, prelude: string) => {
  const block = parseBlocks(css).find((b) => b.prelude === prelude);
  if (!block) throw new Error(`No rule for ${prelude}`);
  return block;
};

describe('Tailwind styles', () => {
  it('shows hover-none: utilities only on devices that cannot hover', async () => {
    const css = await buildCss(['hover-none:opacity-100']);
    const block = findBlock(css, '.hover-none\\:opacity-100');

    expect(block.parents).toEqual(['@layer utilities', '@media (hover: none)']);
    expect(block.body).toContain('opacity: 100%');
  });

  it('applies group-hover: only on devices that can hover', async () => {
    // This is why controls revealed by group-hover also need hover-none:
    // otherwise they stay hidden on touch devices.
    const css = await buildCss(['group-hover:opacity-100']);
    const block = findBlock(css, '.group-hover\\:opacity-100:is(:where(.group):hover *)');

    expect(block.parents).toEqual(['@layer utilities', '@media (hover: hover)']);
  });
});
