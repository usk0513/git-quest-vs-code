import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { Terminal } from '@/components/Layout/Terminal';

// jsdom has no layout, so scrollHeight is always 0 and scrollTop does not
// keep its value. Stub both: scrollHeight grows with the number of lines and
// scrollTop remembers what was assigned, per element.
const scrollTops = new WeakMap<Element, number>();

beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
    configurable: true,
    get(this: HTMLElement) {
      return this.childElementCount * 20;
    },
  });
  Object.defineProperty(HTMLElement.prototype, 'scrollTop', {
    configurable: true,
    get(this: HTMLElement) {
      return scrollTops.get(this) ?? 0;
    },
    set(this: HTMLElement, value: number) {
      scrollTops.set(this, value);
    },
  });
});

afterEach(() => {
  Reflect.deleteProperty(HTMLElement.prototype, 'scrollHeight');
  Reflect.deleteProperty(HTMLElement.prototype, 'scrollTop');
});

const noop = () => {};

const renderTerminal = (output: string[]) => {
  const view = render(<Terminal output={output} onCommand={noop} />);
  const outputBox = view.container.querySelector('.overflow-y-auto') as HTMLElement;
  return { ...view, outputBox };
};

describe('Terminal auto-scroll', () => {
  it('scrolls to the bottom when lines are appended asynchronously', async () => {
    const { outputBox, rerender } = renderTerminal(['$ git status']);
    outputBox.scrollTop = 0;

    await act(async () => {
      await Promise.resolve();
      rerender(<Terminal output={['$ git status', 'On branch main', '']} onCommand={noop} />);
    });

    expect(outputBox.scrollHeight).toBe(60);
    expect(outputBox.scrollTop).toBe(60);
  });

  it('scrolls when a reset replaces the whole array', () => {
    const { outputBox, rerender } = renderTerminal(['a', 'b', 'c', 'd']);
    outputBox.scrollTop = 0;

    rerender(<Terminal output={['Tutorial reset!', 'Welcome to Git Quest!', '']} onCommand={noop} />);

    expect(outputBox.scrollTop).toBe(60);
  });

  it('scrolls when the content changes but the number of lines stays the same', () => {
    const { outputBox, rerender } = renderTerminal(['first', 'second']);
    outputBox.scrollTop = 0;

    rerender(<Terminal output={['third', 'fourth']} onCommand={noop} />);

    expect(outputBox.scrollTop).toBe(40);
  });

  it('does not scroll when only the command input changes', () => {
    const output = ['$ git status', 'On branch main'];
    const { outputBox } = renderTerminal(output);
    outputBox.scrollTop = 0;

    fireEvent.change(screen.getByPlaceholderText('Type a git command...'), {
      target: { value: 'git log' },
    });

    expect(outputBox.scrollTop).toBe(0);
  });
});
