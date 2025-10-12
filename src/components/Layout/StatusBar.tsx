import React from 'react';

interface StatusBarProps {
  currentBranch: string;
}

export const StatusBar: React.FC<StatusBarProps> = ({ currentBranch }) => {
  return (
    <div className="h-6 bg-vscode-bg border-t border-vscode-border flex items-center px-2 text-xs text-vscode-text">
      <div className="flex items-center gap-4">
        {currentBranch && (
          <div className="flex items-center gap-1">
            <span>🌿</span>
            <span>{currentBranch}</span>
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
