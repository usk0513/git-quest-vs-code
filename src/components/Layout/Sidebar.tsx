import React from 'react';
import { SourceControlView } from '../SourceControl/SourceControlView';
import { ExplorerView } from '../Explorer/ExplorerView';
import { GitState } from '@/types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFolder, faCodeBranch } from '@fortawesome/free-solid-svg-icons';

interface SidebarProps {
  view: 'source-control' | 'explorer';
  onViewChange: (view: 'source-control' | 'explorer') => void;
  gitState: GitState;
  files: string[];
  currentFile: string | null;
  onSelectFile: (filepath: string) => void;
  onStageFile: (filepath: string) => void;
  onCommit: (message: string) => void;
  onPush: () => void;
  sourceControlReadOnly?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  view,
  onViewChange,
  gitState,
  files,
  currentFile,
  onSelectFile,
  onStageFile,
  onCommit,
  onPush,
  sourceControlReadOnly = false,
}) => {
  return (
    <div className="h-full flex">
      {/* Icon bar */}
      <div className="w-12 bg-vscode-sidebar border-r border-vscode-border flex flex-col items-center py-2 gap-2">
        <button
          onClick={() => onViewChange('explorer')}
          className={`w-10 h-10 flex items-center justify-center rounded hover:bg-vscode-hover ${
            view === 'explorer' ? 'bg-vscode-active' : ''
          }`}
          title="エクスプローラー"
        >
          <FontAwesomeIcon icon={faFolder} size="lg" />
        </button>
        <button
          onClick={() => onViewChange('source-control')}
          className={`w-10 h-10 flex items-center justify-center rounded hover:bg-vscode-hover ${
            view === 'source-control' ? 'bg-vscode-active' : ''
          }`}
          title="ソース管理"
        >
          <FontAwesomeIcon icon={faCodeBranch} size="lg" />
        </button>
      </div>

      {/* View content */}
      <div className="flex-1">
        {view === 'source-control' ? (
          <SourceControlView
            gitState={gitState}
            onStageFile={onStageFile}
            onCommit={onCommit}
            onPush={onPush}
            readOnly={sourceControlReadOnly}
          />
        ) : (
          <ExplorerView
            files={files}
            currentFile={currentFile}
            onSelectFile={onSelectFile}
          />
        )}
      </div>
    </div>
  );
};
