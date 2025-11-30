import React, { useState } from 'react';
import { GitState } from '@/types';
import { Button } from '../Common/Button';

interface SourceControlViewProps {
  gitState: GitState;
  onStageFile: (filepath: string) => void;
  onUnstageFile: (filepath: string) => void;
  onCommit: (message: string) => void;
  onPush: () => void;
  readOnly?: boolean;
  readOnlyMessage?: string;
}

export const SourceControlView: React.FC<SourceControlViewProps> = ({
  gitState,
  onStageFile,
  onUnstageFile,
  onCommit,
  onPush,
  readOnly = false,
  readOnlyMessage,
}) => {
  const [commitMessage, setCommitMessage] = useState('');

  const handleCommit = () => {
    if (readOnly) return;
    if (commitMessage.trim()) {
      onCommit(commitMessage);
      setCommitMessage('');
    }
  };

  const hasUncommittedChanges =
    gitState.stagedFiles.length > 0 || gitState.unstagedFiles.length > 0;

  return (
    <div className="h-full bg-vscode-sidebar flex flex-col">
      <div className="px-3 py-2 border-b border-vscode-border">
        <h3 className="text-xs font-medium text-vscode-text-secondary uppercase">
          ソース管理
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Commit message input */}
        {gitState.isRepository && (
          <div className="p-3 border-b border-vscode-border">
            <textarea
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              placeholder={readOnly ? 'GUIステージでコミットできます' : 'コミットメッセージ'}
              className="w-full px-2 py-1 text-sm bg-vscode-bg border border-vscode-input-border rounded focus:border-vscode-input-focus outline-none resize-none"
              disabled={readOnly}
              rows={3}
            />
            <div className="mt-2 flex gap-2">
              <Button
                onClick={handleCommit}
                disabled={
                  readOnly || !commitMessage.trim() || gitState.stagedFiles.length === 0
                }
                className="flex-1 text-sm"
              >
                ✓ コミット
              </Button>
              {gitState.commits.length > 0 && (
                <Button
                  onClick={onPush}
                  variant="secondary"
                  className="flex-1 text-sm"
                  disabled={readOnly}
                >
                  ↑ プッシュ
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Unstaged files */}
        {gitState.unstagedFiles.length > 0 && (
          <div className="border-b border-vscode-border">
            <div className="px-3 py-2 bg-vscode-sidebar sticky top-0">
              <div className="text-xs font-medium text-vscode-text">
                変更 ({gitState.unstagedFiles.length})
              </div>
            </div>
            <div>
              {gitState.unstagedFiles.map((file) => (
                <div
                  key={file.path}
                  className="px-3 py-1 hover:bg-vscode-hover flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2 text-sm">
                    <span
                      className={
                        file.status === 'modified'
                          ? 'text-vscode-git-modified'
                          : file.status === 'added'
                          ? 'text-vscode-git-added'
                          : file.status === 'deleted'
                          ? 'text-vscode-git-deleted'
                          : 'text-vscode-text-muted'
                      }
                    >
                      {file.status === 'modified' ? 'M' : file.status === 'added' ? 'A' : file.status === 'deleted' ? 'D' : 'U'}
                    </span>
                    <span className="text-vscode-text">{file.path}</span>
                  </div>
                  <button
                    onClick={readOnly ? undefined : () => onStageFile(file.path)}
                    className={`${
                      readOnly ? 'opacity-40 cursor-not-allowed' : 'opacity-0 group-hover:opacity-100 hover:bg-vscode-active'
                    } text-vscode-accent px-2 py-1 rounded`}
                    disabled={readOnly}
                  >
                    +
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Staged files */}
        {gitState.stagedFiles.length > 0 && (
          <div className="border-b border-vscode-border">
            <div className="px-3 py-2 bg-vscode-git-staged-bg sticky top-0">
              <div className="text-xs font-medium text-vscode-text">
                ステージ済み ({gitState.stagedFiles.length})
              </div>
            </div>
            <div>
              {gitState.stagedFiles.map((file) => (
                <div
                  key={file.path}
                  className="px-3 py-1 hover:bg-vscode-hover flex items-center justify-between group text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-vscode-git-added">
                      {file.status === 'modified' ? 'M' : file.status === 'added' ? 'A' : 'D'}
                    </span>
                    <span className="text-vscode-text">{file.path}</span>
                  </div>
                  <button
                    onClick={readOnly ? undefined : () => onUnstageFile(file.path)}
                    className={`${
                      readOnly ? 'opacity-40 cursor-not-allowed' : 'opacity-0 group-hover:opacity-100 hover:bg-vscode-active'
                    } text-vscode-text px-2 py-1 rounded`}
                    disabled={readOnly}
                  >
                    -
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Commits */}
        {gitState.commits.length > 0 && (
          <div>
            <div className="px-3 py-2 bg-vscode-sidebar sticky top-0">
              <div className="text-xs font-medium text-vscode-text">
                コミット ({gitState.commits.length})
              </div>
            </div>
            <div>
              {gitState.commits.slice(0, 5).map((commit) => (
                <div
                  key={commit.oid}
                  className="px-3 py-2 hover:bg-vscode-hover border-l-2 border-vscode-accent"
                >
                  <div className="text-sm text-vscode-text truncate">
                    {commit.message}
                  </div>
                  <div className="text-xs text-vscode-text-muted mt-1">
                    {commit.oid.substring(0, 7)} • {commit.author.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!hasUncommittedChanges && gitState.commits.length === 0 && gitState.isRepository && (
          <div className="p-4 text-center text-sm text-vscode-text-muted">
            変更はありません
          </div>
        )}

        {!gitState.isRepository && (
          <div className="p-4 text-center text-sm text-vscode-text-muted">
            リポジトリがまだクローンされていません
          </div>
        )}

        {readOnly && gitState.isRepository && (
          <div className="p-3 text-xs text-vscode-text-muted border-t border-vscode-border">
            {readOnlyMessage ?? '※ このソース管理ビューはコマンドステージでは閲覧のみ可能です。'}
          </div>
        )}
      </div>
    </div>
  );
};
