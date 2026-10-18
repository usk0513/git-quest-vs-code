import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InstructionPane } from '@/components/Layout/InstructionPane';
import { TUTORIAL_STEPS, GUI_TUTORIAL_STEPS } from '@/constants/tutorialSteps';
import type { StepConfig } from '@/types';

const findStep = (id: number): StepConfig => {
  const step = [...TUTORIAL_STEPS, ...GUI_TUTORIAL_STEPS].find((s) => s.id === id);
  if (!step) {
    throw new Error(`Step ${id} not found`);
  }
  return step;
};

// jsdom has no layout and does not keep scrollTop, so remember what was
// assigned per element.
const scrollTops = new WeakMap<Element, number>();

beforeEach(() => {
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
  Reflect.deleteProperty(HTMLElement.prototype, 'scrollTop');
});

const scrollArea = (container: HTMLElement) => {
  const area = container.querySelector<HTMLElement>('.overflow-y-auto');
  if (!area) {
    throw new Error('No scroll area');
  }
  return area;
};

describe('InstructionPane layout', () => {
  it('keeps the next button outside the scrolling area', () => {
    const { container } = render(<InstructionPane step={findStep(2)} onNext={vi.fn()} />);

    const next = screen.getByRole('button', { name: '次へ →' });
    expect(scrollArea(container).contains(next)).toBe(false);
  });

  it('keeps the check button outside the scrolling area', () => {
    const { container } = render(<InstructionPane step={findStep(5)} onValidate={vi.fn()} />);

    const check = screen.getByRole('button', { name: '編集内容をチェック' });
    expect(scrollArea(container).contains(check)).toBe(false);
  });

  it('shows a new step from the top even if the previous one was scrolled', () => {
    const { container, rerender } = render(<InstructionPane step={findStep(2)} onNext={vi.fn()} />);
    scrollArea(container).scrollTop = 221;

    rerender(<InstructionPane step={findStep(3)} onNext={vi.fn()} />);

    expect(scrollArea(container).scrollTop).toBe(0);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(findStep(3).title);
  });

  it('keeps the scroll position while the step stays the same', () => {
    const step = findStep(2);
    const { container, rerender } = render(<InstructionPane step={step} onNext={vi.fn()} />);
    scrollArea(container).scrollTop = 221;

    rerender(<InstructionPane step={step} onNext={vi.fn()} />);

    expect(scrollArea(container).scrollTop).toBe(221);
  });
});
