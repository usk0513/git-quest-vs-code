import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StatusBar } from '@/components/Layout/StatusBar';

const MENU_TITLE = 'ブランチの切り替え';

describe('StatusBar branch menu', () => {
  const renderStatusBar = () => {
    const onSwitchBranch = vi.fn(async () => {});
    render(
      <StatusBar
        currentBranch="feature/gui-test"
        branches={['feature/gui-test', 'main']}
        remoteBranches={['origin/main', 'origin/feature/gui-test']}
        aheadCount={0}
        behindCount={0}
        onSwitchBranch={onSwitchBranch}
        onCreateBranch={vi.fn(async () => true)}
        canCreateBranch={false}
        menuEnabled
      />
    );
    const user = userEvent.setup();
    const openMenu = async () => {
      await user.click(screen.getByRole('button', { name: /feature\/gui-test/ }));
      expect(screen.getByText(MENU_TITLE)).toBeInTheDocument();
    };
    return { onSwitchBranch, user, openMenu };
  };

  it('lists local and remote branches when opened', async () => {
    const { openMenu } = renderStatusBar();
    await openMenu();

    expect(screen.getByRole('button', { name: 'main' })).toBeInTheDocument();
    expect(screen.getByText('origin/feature/gui-test')).toBeInTheDocument();
  });

  it('closes with Escape', async () => {
    const { user, openMenu } = renderStatusBar();
    await openMenu();

    await user.keyboard('{Escape}');

    expect(screen.queryByText(MENU_TITLE)).not.toBeInTheDocument();
  });

  it('closes when the backdrop outside the panel is clicked', async () => {
    const { user, openMenu } = renderStatusBar();
    await openMenu();

    await user.click(screen.getByRole('button', { name: 'ブランチメニューを閉じる' }));

    expect(screen.queryByText(MENU_TITLE)).not.toBeInTheDocument();
  });

  it('stays open when the panel itself is clicked', async () => {
    const { user, openMenu } = renderStatusBar();
    await openMenu();

    await user.click(screen.getByText(MENU_TITLE));

    expect(screen.getByText(MENU_TITLE)).toBeInTheDocument();
  });

  it('switches branch once when a branch is chosen with Enter', async () => {
    const { onSwitchBranch, user, openMenu } = renderStatusBar();
    await openMenu();

    screen.getByRole('button', { name: 'main' }).focus();
    await user.keyboard('{Enter}');

    expect(onSwitchBranch).toHaveBeenCalledTimes(1);
    expect(onSwitchBranch).toHaveBeenCalledWith('main');
  });
});
