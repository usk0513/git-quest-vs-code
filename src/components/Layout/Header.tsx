import React from 'react';
import { Button } from '../Common/Button';

interface HeaderProps {
  onReset: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onReset }) => {
  return (
    <header className="h-12 bg-vscode-bg border-b border-vscode-border flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold text-vscode-text">Git Quest</h1>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="secondary" onClick={onReset}>
          🔄 リセット
        </Button>
      </div>
    </header>
  );
};
