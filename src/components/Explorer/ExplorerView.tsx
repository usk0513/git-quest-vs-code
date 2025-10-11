import React from 'react';

interface ExplorerViewProps {
  files: string[];
  currentFile: string | null;
  onSelectFile: (filepath: string) => void;
}

export const ExplorerView: React.FC<ExplorerViewProps> = ({
  files,
  currentFile,
  onSelectFile,
}) => {
  return (
    <div className="h-full bg-vscode-sidebar flex flex-col">
      <div className="px-3 py-2 border-b border-vscode-border">
        <h3 className="text-xs font-medium text-vscode-text-secondary uppercase">
          エクスプローラー
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto">
        {files.length > 0 ? (
          <div>
            {files
              .filter((file) => !file.startsWith('.git'))
              .map((file) => (
                <div
                  key={file}
                  onClick={() => onSelectFile(file)}
                  className={`px-3 py-1 text-sm cursor-pointer hover:bg-vscode-hover ${
                    currentFile === file
                      ? 'bg-vscode-active text-vscode-text'
                      : 'text-vscode-text'
                  }`}
                >
                  📄 {file}
                </div>
              ))}
          </div>
        ) : (
          <div className="p-4 text-center text-sm text-vscode-text-muted">
            ファイルがありません
          </div>
        )}
      </div>
    </div>
  );
};
