import React, { useState } from 'react';

interface StatusBarProps {
  currentBranch: string;
  branches: string[];
  onSwitchBranch: (branch: string) => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({ currentBranch, branches, onSwitchBranch }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSelect = (branch: string) => {
    setMenuOpen(false);
    if (branch !== currentBranch) {
      onSwitchBranch(branch);
    }
  };

  return (
    <div className="relative h-6 bg-vscode-bg border-t border-vscode-border flex items-center px-2 text-xs text-vscode-text">
      <div className="flex items-center gap-4">
        {currentBranch && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="flex items-center gap-1 hover:bg-vscode-hover px-1 cursor-pointer rounded"
            >
              <span>🌿</span>
              <span>{currentBranch}</span>
            </button>
            {menuOpen && (
              <div className="absolute bottom-7 left-0 bg-vscode-bg border border-vscode-border rounded shadow-lg z-10 min-w-[140px]">
                <ul className="py-1">
                  {branches.map((branch) => (
                    <li key={branch}>
                      <button
                        type="button"
                        onClick={() => handleSelect(branch)}
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
        <div className="flex items-center gap-1">
          <span>↓ 0</span>
          <span>↑ 0</span>
        </div>
      </div>
    </div>
  );
};
