import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExplorerView } from '@/components/Explorer/ExplorerView';

describe('ExplorerView', () => {
  const renderView = () => {
    const onSelectFile = vi.fn();
    render(
      <ExplorerView
        files={['README.md', 'greeting.txt']}
        currentFile={null}
        onSelectFile={onSelectFile}
      />
    );
    return { onSelectFile, user: userEvent.setup() };
  };

  it('renders each file as a button', () => {
    renderView();
    expect(screen.getByRole('button', { name: /README\.md/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /greeting\.txt/ })).toBeInTheDocument();
  });

  it('selects a file once on click', async () => {
    const { onSelectFile, user } = renderView();

    await user.click(screen.getByRole('button', { name: /greeting\.txt/ }));

    expect(onSelectFile).toHaveBeenCalledTimes(1);
    expect(onSelectFile).toHaveBeenCalledWith('greeting.txt');
  });

  it('selects a file once with Enter and once with Space from the keyboard', async () => {
    const { onSelectFile, user } = renderView();

    await user.tab();
    expect(screen.getByRole('button', { name: /README\.md/ })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onSelectFile).toHaveBeenCalledTimes(1);
    expect(onSelectFile).toHaveBeenLastCalledWith('README.md');

    await user.tab();
    await user.keyboard(' ');
    expect(onSelectFile).toHaveBeenCalledTimes(2);
    expect(onSelectFile).toHaveBeenLastCalledWith('greeting.txt');
  });
});
