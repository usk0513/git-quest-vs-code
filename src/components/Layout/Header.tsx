import React from 'react';
interface HeaderProps {
  modeLabel?: string;
}

export const Header: React.FC<HeaderProps> = ({ modeLabel }) => {
  return (
    <header className="h-12 bg-vscode-bg border-b border-vscode-border flex items-center px-4">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold text-vscode-text">Git Quest</h1>
        {modeLabel && (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-vscode-sidebar border border-vscode-border text-vscode-text-secondary">
            {modeLabel}
          </span>
        )}
      </div>
    </header>
  );
};
