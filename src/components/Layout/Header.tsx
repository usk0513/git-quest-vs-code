import React from 'react';
import { Button } from '../Common/Button';

interface HeaderProps {
  onReset: () => void;
  modeLabel?: string;
}

export const Header: React.FC<HeaderProps> = ({ onReset, modeLabel }) => {
  return (
    <header className="h-12 bg-vscode-bg border-b border-vscode-border flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold text-vscode-text">Git Quest</h1>
        {modeLabel && (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-vscode-sidebar border border-vscode-border text-vscode-text-secondary">
            {modeLabel}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button variant="secondary" onClick={onReset}>
          🔄 リセット
        </Button>
      </div>
    </header>
  );
};
