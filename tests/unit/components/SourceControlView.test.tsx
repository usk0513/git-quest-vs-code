import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SourceControlView } from '@/components/SourceControl/SourceControlView';
import type { GitState } from '@/types';

const baseGitState: GitState = {
  isRepository: true,
  currentBranch: 'feature/gui-test',
  branches: ['main', 'feature/gui-test'],
  remoteBranches: ['origin/main'],
  stagedFiles: [],
  unstagedFiles: [],
  commits: [],
  hasRemote: true,
  aheadCount: 0,
  behindCount: 0,
};

const STAGE_GREETING = 'greeting.txt をステージ';
const UNSTAGE_README = 'README.md のステージを取り消す';

const renderView = (readOnly = false) => {
  const onStageFile = vi.fn();
  const onUnstageFile = vi.fn();
  const gitState: GitState = {
    ...baseGitState,
    unstagedFiles: [{ path: 'greeting.txt', status: 'modified' }],
    stagedFiles: [{ path: 'README.md', status: 'modified' }],
  };

  render(
    <SourceControlView
      gitState={gitState}
      onStageFile={onStageFile}
      onUnstageFile={onUnstageFile}
      onCommit={vi.fn()}
      onPush={vi.fn()}
      readOnly={readOnly}
    />
  );
  return { onStageFile, onUnstageFile, user: userEvent.setup() };
};

// Moves the focus with Tab until it reaches the element, as a keyboard user
// would, and fails if Tab never gets there.
const tabTo = async (user: ReturnType<typeof userEvent.setup>, element: HTMLElement) => {
  for (let i = 0; i < 10 && document.activeElement !== element; i++) {
    await user.tab();
  }
  expect(element).toHaveFocus();
};

describe('SourceControlView', () => {
  it('names the stage and unstage buttons after the action and the file', () => {
    renderView();

    expect(screen.getByRole('button', { name: STAGE_GREETING })).toHaveTextContent('+');
    expect(screen.getByRole('button', { name: UNSTAGE_README })).toHaveTextContent('-');
  });

  it('calls onUnstageFile when clicking minus on staged item', async () => {
    const { onUnstageFile, user } = renderView();

    await user.click(screen.getByRole('button', { name: UNSTAGE_README }));

    expect(onUnstageFile).toHaveBeenCalledWith('README.md');
  });

  it('stages a file once with Enter and once with Space from the keyboard', async () => {
    const { onStageFile, user } = renderView();
    const stageButton = screen.getByRole('button', { name: STAGE_GREETING });

    await tabTo(user, stageButton);
    await user.keyboard('{Enter}');
    expect(onStageFile).toHaveBeenCalledTimes(1);
    await user.keyboard(' ');
    expect(onStageFile).toHaveBeenCalledTimes(2);
    expect(onStageFile).toHaveBeenLastCalledWith('greeting.txt');
  });

  it('unstages a file once with Enter and once with Space from the keyboard', async () => {
    const { onUnstageFile, user } = renderView();
    const unstageButton = screen.getByRole('button', { name: UNSTAGE_README });

    await tabTo(user, unstageButton);
    await user.keyboard('{Enter}');
    expect(onUnstageFile).toHaveBeenCalledTimes(1);
    await user.keyboard(' ');
    expect(onUnstageFile).toHaveBeenCalledTimes(2);
    expect(onUnstageFile).toHaveBeenLastCalledWith('README.md');
  });

  it('shows the stage and unstage buttons on hover, on keyboard focus, and on devices that cannot hover', () => {
    renderView();

    // The variants are checked against the compiled CSS in
    // tests/unit/styles/tailwind.test.ts.
    for (const name of [STAGE_GREETING, UNSTAGE_README]) {
      expect(screen.getByRole('button', { name })).toHaveClass(
        'opacity-0',
        'group-hover:opacity-100',
        'focus-visible:opacity-100',
        'hover-none:opacity-100'
      );
    }
  });

  it('keeps the names on the disabled buttons of the read-only view', () => {
    renderView(true);

    expect(screen.getByRole('button', { name: STAGE_GREETING })).toBeDisabled();
    expect(screen.getByRole('button', { name: UNSTAGE_README })).toBeDisabled();
  });
});
