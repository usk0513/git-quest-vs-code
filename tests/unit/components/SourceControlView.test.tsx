import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SourceControlView } from '@/components/SourceControl/SourceControlView';
import { GitState } from '@/types';

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

describe('SourceControlView', () => {
  it('calls onUnstageFile when clicking minus on staged item', async () => {
    const onUnstageFile = vi.fn();
    const user = userEvent.setup();

    const gitState: GitState = {
      ...baseGitState,
      stagedFiles: [{ path: 'greeting.txt', status: 'modified' }],
    };

    render(
      <SourceControlView
        gitState={gitState}
        onStageFile={vi.fn()}
        onUnstageFile={onUnstageFile}
        onCommit={vi.fn()}
        onPush={vi.fn()}
      />
    );

    const unstageButton = screen.getByRole('button', { name: '-' });
    await user.click(unstageButton);

    expect(onUnstageFile).toHaveBeenCalledWith('greeting.txt');
  });
});
