import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '../Common/Button';

interface StatusBarProps {
  currentBranch: string;
  branches: string[];
  onSwitchBranch: (branch: string) => void;
  onCreateBranch: () => void;
  menuEnabled: boolean;
}

const BranchMenu: React.FC<{
  currentBranch: string;
  branches: string[];
  onSelectBranch: (branch: string) => void;
  onCreateBranch: () => void;
  onClose: () => void;
}> = ({ currentBranch, branches, onSelectBranch, onCreateBranch, onClose }) => {
  const remoteBranches = useMemo(() => {
    return Array.from(new Set(branches.map((branch) => `origin/${branch}`)));
  }, [branches]);

  return createPortal(
    <div className="fixed inset-0 z-30 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-vscode-bg border border-vscode-border rounded shadow-xl w-80 max-w-full overflow-hidden">
        <div className="p-3 border-b border-vscode-border text-sm font-semibold text-vscode-text">
          ブランチの切り替え
        </div>
        <div className="max-h-80 overflow-y-auto text-sm">
          <button
            type="button"
            onClick={() => {
              onClose();
              onCreateBranch();
            }}
            className="w-full text-left px-4 py-2 hover:bg-vscode-hover text-vscode-accent"
          >
            + 新しいブランチの作成...
          </button>
          <div className="mx-4 border-t border-vscode-border my-2" />
          <div className="px-4 py-1 text-xs font-semibold text-vscode-text-muted">
            ローカルブランチ
          </div>
          {branches.map((branch) => (
            <button
              key={branch}
              type="button"
              onClick={() => {
                onSelectBranch(branch);
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
    </div>,
    document.body
  );
};

export const StatusBar: React.FC<StatusBarProps> = ({
  currentBranch,
  branches,
  onSwitchBranch,
  onCreateBranch,
  menuEnabled,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleToggleMenu = () => {
    if (!menuEnabled || branches.length === 0) return;
    setIsMenuOpen((open) => !open);
  };

  const handleCreateBranch = () => {
    onCreateBranch();
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
            <span>↓ 0</span>
            <span>↑ 0</span>
          </div>
        </div>
      </div>
      {isMenuOpen && (
        <BranchMenu
          currentBranch={currentBranch}
          branches={branches}
          onSelectBranch={onSwitchBranch}
          onCreateBranch={handleCreateBranch}
          onClose={() => setIsMenuOpen(false)}
        />
      )}
    </>
  );
};
