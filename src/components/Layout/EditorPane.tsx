import React from 'react';

interface EditorPaneProps {
  currentFile: string | null;
  content: string;
  onContentChange: (content: string) => void;
}

export const EditorPane: React.FC<EditorPaneProps> = ({
  currentFile,
  content,
  onContentChange,
}) => {
  if (!currentFile) {
    return (
      <div className="h-full bg-vscode-bg flex items-center justify-center text-vscode-text-muted">
        <div className="text-center">
          <div className="text-4xl mb-4">📄</div>
          <div>ファイルを選択してください</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-vscode-bg flex flex-col">
      <div className="px-4 py-2 border-b border-vscode-border">
        <div className="text-sm text-vscode-text">{currentFile}</div>
      </div>

      <div className="flex-1 overflow-auto">
        <textarea
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          className="w-full h-full p-4 bg-vscode-bg text-vscode-text font-mono text-sm resize-none border-none outline-none"
          spellCheck={false}
        />
      </div>
    </div>
  );
};
