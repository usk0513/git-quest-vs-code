import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '../Common/Button';

interface StatusBarProps {
  currentBranch: string;
  branches: string[];
  remoteBranches: string[];
  aheadCount: number;
  behindCount: number;
  onSwitchBranch: (branch: string) => Promise<void>;
  onCreateBranch: (branch: string) => Promise<boolean>;
  canCreateBranch: boolean;
  menuEnabled: boolean;
}

const BranchMenu: React.FC<{
  currentBranch: string;
  branches: string[];
  remoteBranches: string[];
  onSelectBranch: (branch: string) => Promise<void>;
  onCreateBranch: (branch: string) => Promise<boolean>;
  onClose: () => void;
  canCreateBranch: boolean;
}> = ({
  currentBranch,
  branches,
  remoteBranches,
  onSelectBranch,
  onCreateBranch,
  onClose,
  canCreateBranch,
}) => {

  const [showCreateInput, setShowCreateInput] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showCreateInput) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [showCreateInput]);

  // Escape closes the menu, like clicking outside the panel.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleCreate = async () => {
    if (isProcessing) return;
    const trimmed = newBranchName.trim();
    if (!trimmed) {
      setError('ブランチ名を入力してください');
      return;
    }
    setIsProcessing(true);
    const success = await onCreateBranch(trimmed);
    setIsProcessing(false);
    if (success) {
      setShowCreateInput(false);
      setNewBranchName('');
      setError(null);
      onClose();
    } else {
      setError('指定されたブランチ名ではありません（feature/gui-test）');
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-30">
      {/* The backdrop is a sibling of the panel (not its parent), so clicks
          inside the panel never reach it and no buttons are nested. It is
          skipped in the tab order; keyboard users close with Escape or the
          close button. */}
      <button
        type="button"
        aria-label="ブランチメニューを閉じる"
        tabIndex={-1}
        className="absolute inset-0 w-full h-full cursor-default"
        onClick={onClose}
      />
      <div
        className="relative w-full flex justify-center pointer-events-none"
        style={{ paddingTop: '3.25rem' }}
      >
        <div className="pointer-events-auto bg-vscode-bg border border-vscode-border rounded shadow-xl w-80 max-w-full overflow-hidden">
          <div className="p-3 border-b border-vscode-border text-sm font-semibold text-vscode-text">
            ブランチの切り替え
          </div>
          <div className="max-h-80 overflow-y-auto text-sm">
            {!showCreateInput ? (
              <button
                type="button"
                onClick={() => {
                  setShowCreateInput(true);
                  setError(null);
                }}
                disabled={!canCreateBranch}
                className={`w-full text-left px-4 py-2 ${
                  canCreateBranch
                    ? 'hover:bg-vscode-hover text-vscode-accent'
                    : 'text-vscode-text-muted cursor-not-allowed opacity-60'
                }`}
              >
                + 新しいブランチの作成...
              </button>
            ) : (
              <div className="px-4 py-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={newBranchName}
                  placeholder="feature/gui-test"
                  onChange={(e) => {
                    setNewBranchName(e.target.value);
                    setError(null);
                  }}
                  className="w-full px-2 py-1 text-sm bg-vscode-bg border border-vscode-input-border rounded focus:border-vscode-input-focus outline-none"
                />
                {error && <p className="mt-1 text-xs text-vscode-warning">{error}</p>}
                <div className="flex justify-end gap-2 mt-2">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setShowCreateInput(false);
                      setNewBranchName('');
                      setError(null);
                    }}
                  >
                    キャンセル
                  </Button>
                  <Button onClick={handleCreate} disabled={isProcessing}>
                    作成
                  </Button>
                </div>
              </div>
            )}
            <div className="mx-4 border-t border-vscode-border my-2" />
            <div className="px-4 py-1 text-xs font-semibold text-vscode-text-muted">
              ローカルブランチ
            </div>
            {branches.map((branch) => (
              <button
                key={branch}
                type="button"
                onClick={async () => {
                  await onSelectBranch(branch);
                  onClose();
                }}
                className={`w-full text-left px-4 py-2 hover:bg-vscode-hover ${
                  branch === currentBranch ? 'font-semibold text-vscode-text' : 'text-vscode-text-secondary'
                }`}
              >
              {branch}
            </button>
          ))}
          <div className="mx-4 border-t border-vscode-border my-2" />
          <div className="px-4 py-1 text-xs font-semibold text-vscode-text-muted">
            リモートブランチ
          </div>
          {remoteBranches.map((branch) => (
            <div key={branch} className="px-4 py-2 text-vscode-text-secondary">
              {branch}
            </div>
          ))}
        </div>
          <div className="flex justify-end gap-2 px-3 py-2 border-t border-vscode-border">
            <Button variant="secondary" onClick={onClose}>
              閉じる
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export const StatusBar: React.FC<StatusBarProps> = ({
  currentBranch,
  branches,
  remoteBranches,
  aheadCount,
  behindCount,
  onSwitchBranch,
  onCreateBranch,
  canCreateBranch,
  menuEnabled,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleToggleMenu = () => {
    if (!menuEnabled || branches.length === 0) return;
    setIsMenuOpen((open) => !open);
  };

  return (
    <>
      <div className="h-6 bg-vscode-bg border-t border-vscode-border flex items-center px-2 text-xs text-vscode-text">
        <div className="flex items-center gap-4">
          {currentBranch && (
            <button
              type="button"
              onClick={handleToggleMenu}
              className={`flex items-center gap-1 px-1 rounded ${
                menuEnabled ? 'hover:bg-vscode-hover cursor-pointer' : 'opacity-60 cursor-not-allowed'
              }`}
            >
              <span>🌿</span>
              <span>{currentBranch}</span>
            </button>
          )}
          <div className="flex items-center gap-1">
            <span>↓ {behindCount}</span>
            <span>↑ {aheadCount}</span>
          </div>
        </div>
      </div>
      {isMenuOpen && (
        <BranchMenu
          currentBranch={currentBranch}
          branches={branches}
          remoteBranches={remoteBranches}
          onSelectBranch={async (branch) => {
            await onSwitchBranch(branch);
          }}
          onCreateBranch={onCreateBranch}
          canCreateBranch={canCreateBranch}
          onClose={() => setIsMenuOpen(false)}
        />
      )}
    </>
  );
};
