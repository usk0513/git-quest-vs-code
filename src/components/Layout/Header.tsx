import React, { useState } from 'react';
import { Button } from '../Common/Button';

interface HeaderProps {
  onReset: () => void;
  modeLabel?: string;
  currentBranch?: string;
  branches?: string[];
  onSwitchBranch?: (branch: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onReset,
  modeLabel,
  currentBranch,
  branches = [],
  onSwitchBranch,
}) => {
  const [branchMenuOpen, setBranchMenuOpen] = useState(false);

  const handleBranchSelect = (branch: string) => {
    setBranchMenuOpen(false);
    if (branch !== currentBranch && onSwitchBranch) {
      onSwitchBranch(branch);
    }
  };

  return (
    <header className="relative h-12 bg-vscode-bg border-b border-vscode-border flex items-center px-4">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold text-vscode-text">Git Quest</h1>
        {modeLabel && (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-vscode-sidebar border border-vscode-border text-vscode-text-secondary">
            {modeLabel}
          </span>
        )}
      </div>

      <div className="flex-1 flex justify-center">
        {currentBranch && branches.length > 0 && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setBranchMenuOpen((open) => !open)}
              className="px-3 py-1 text-sm text-vscode-text bg-vscode-sidebar border border-vscode-border rounded hover:bg-vscode-hover flex items-center gap-2"
            >
              <span>🌿</span>
              <span>{currentBranch}</span>
            </button>
            {branchMenuOpen && (
              <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-vscode-bg border border-vscode-border rounded shadow-lg z-20 min-w-[160px]">
                <ul className="py-1">
                  {branches.map((branch) => (
                    <li key={branch}>
                      <button
                        type="button"
                        onClick={() => handleBranchSelect(branch)}
                        className={`w-full text-left px-3 py-1 hover:bg-vscode-hover ${
                          branch === currentBranch ? 'text-vscode-text font-semibold' : 'text-vscode-text-secondary'
                        }`}
                      >
                        {branch}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <Button variant="secondary" onClick={onReset}>
          🔄 リセット
        </Button>
      </div>
    </header>
  );
};
