import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
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

describe('InstructionPane instructions', () => {
  const instructions = (id: number) => {
    render(<InstructionPane step={findStep(id)} />);
    const heading = screen.getByRole('heading', { name: '📘 説明' });
    const section = heading.parentElement;
    if (!section) {
      throw new Error('No instructions section');
    }
    return section;
  };

  it('renders "## " lines as headings instead of showing the marks', () => {
    const section = instructions(22);

    expect(
      within(section).getByRole('heading', { level: 4, name: 'ブランチの作成（GUI操作）' })
    ).toBeInTheDocument();
    expect(section.textContent).not.toContain('##');
  });

  it('renders numbered lines as an ordered list', () => {
    const section = instructions(22);

    const items = within(within(section).getByRole('list')).getAllByRole('listitem');
    expect(items.map((item) => item.textContent)).toEqual([
      '画面左下のブランチ名（main）をクリック',
      '画面上部に表示されるメニューで「+ 新しいブランチの作成...」を選択',
      'ブランチ名を入力: feature/gui-test',
      '「作成」ボタンをクリック',
    ]);
  });

  it('renders backquoted words as inline code without the backquotes', () => {
    const section = instructions(2);

    const codes = Array.from(section.querySelectorAll('code')).map((code) => code.textContent);
    expect(codes).toEqual(['README.md', 'greeting.txt', 'git status', 'git branch']);
    expect(section.textContent).not.toContain('`');
  });

  it('renders a fenced block as preformatted code', () => {
    const section = instructions(5);

    const pre = section.querySelector('pre');
    expect(pre?.textContent).toBe('Hello, Git!');
    expect(section.textContent).not.toContain('```');
  });

  it('renders backquoted words in hints as inline code', () => {
    render(<InstructionPane step={findStep(62)} />);
    const hints = screen.getByRole('heading', { name: '💡 ヒント' }).parentElement;

    expect(hints?.querySelector('code')?.textContent).toBe('origin/feature/gui-test');
    expect(hints?.textContent).not.toContain('`');
  });

  it('keeps the line breaks inside a paragraph', () => {
    const section = instructions(2);

    const paragraph = Array.from(section.querySelectorAll('p')).find((p) =>
      p.textContent?.startsWith('画面左端のエクスプローラーアイコン')
    );
    expect(paragraph?.querySelectorAll('br')).toHaveLength(1);
  });
});
