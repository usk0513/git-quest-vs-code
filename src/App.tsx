import { useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import { Header } from './components/Layout/Header';
import { Sidebar } from './components/Layout/Sidebar';
import { EditorPane } from './components/Layout/EditorPane';
import { Terminal } from './components/Layout/Terminal';
import { StatusBar } from './components/Layout/StatusBar';
import { InstructionPane } from './components/Layout/InstructionPane';

function App() {
  const {
    isInitialized,
    gitState,
    currentStep,
    terminalOutput,
    currentFile,
    fileContent,
    files,
    sidebarView,
    initialize,
    executeCommand,
    editFile,
    selectFile,
    nextStep,
    setSidebarView,
    stageFile,
    unstageFile,
    commit,
    push,
    validateCurrentStep,
    switchBranch,
    createBranch,
  } = useAppStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  const handleContentChange = (content: string) => {
    if (currentFile) {
      editFile(currentFile, content);
    }
  };

  if (!isInitialized || !currentStep) {
    return (
      <div className="w-screen h-screen bg-vscode-bg flex items-center justify-center text-vscode-text">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <div>Loading Git Quest...</div>
        </div>
      </div>
    );
  }

  const modeLabel =
    currentStep.stage === 'terminal'
      ? 'コマンドステージ（Gitコマンド操作を学習中）'
      : 'GUIステージ（VS Code操作を学習中）';

  const handleCreateBranch = async (branch: string): Promise<boolean> => {
    if (currentStep.stage !== 'gui') {
      return false;
    }
    return await createBranch(branch);
  };

  const isCommandStage = currentStep.stage === 'terminal';
  const requiresGuiBranch = currentStep.stage === 'gui' && gitState.currentBranch !== 'feature/gui-test';
  const sourceControlReadOnly = isCommandStage || requiresGuiBranch;
  const sourceControlReadOnlyMessage = isCommandStage
    ? '※ このソース管理ビューはコマンドステージでは閲覧のみ可能です。'
    : 'feature/gui-test ブランチに切り替えてから操作してください。';

  return (
    <div className="w-screen h-screen bg-vscode-bg flex flex-col overflow-hidden">
      {/* Header */}
      <Header modeLabel={modeLabel} />

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar */}
        <div className="w-80 border-r border-vscode-border">
          <Sidebar
            view={sidebarView}
          onViewChange={setSidebarView}
          gitState={gitState}
          files={files}
          currentFile={currentFile}
          onSelectFile={selectFile}
          onStageFile={stageFile}
          onUnstageFile={unstageFile}
          onCommit={commit}
          onPush={push}
          sourceControlReadOnly={sourceControlReadOnly}
          sourceControlReadOnlyMessage={sourceControlReadOnly ? sourceControlReadOnlyMessage : undefined}
        />
      </div>

        {/* Center: Editor + Terminal */}
        <div className="flex-1 flex flex-col">
          {/* Editor */}
          <div className="flex-1 overflow-hidden">
            <EditorPane
              currentFile={currentFile}
              content={fileContent}
              onContentChange={handleContentChange}
            />
          </div>

          {/* Terminal */}
          <div className="h-60 border-t border-vscode-border">
            <Terminal output={terminalOutput} onCommand={executeCommand} />
          </div>
        </div>

        {/* Right: Instructions */}
        <div className="w-96">
          <InstructionPane
            step={currentStep}
            onNext={currentStep.autoAdvance === false ? nextStep : undefined}
            onValidate={currentStep.requiresValidationButton ? validateCurrentStep : undefined}
          />
        </div>
      </div>

      {/* Status bar */}
      <StatusBar
        currentBranch={gitState.currentBranch}
        branches={gitState.branches}
        remoteBranches={gitState.remoteBranches}
        aheadCount={gitState.aheadCount}
        behindCount={gitState.behindCount}
        onSwitchBranch={switchBranch}
        onCreateBranch={handleCreateBranch}
        canCreateBranch={currentStep.stage === 'gui' && gitState.currentBranch === 'main'}
        menuEnabled={currentStep.stage === 'gui'}
      />
    </div>
  );
}

export default App;
