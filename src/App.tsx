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
    reset,
    setSidebarView,
    stageFile,
    commit,
    push,
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

  return (
    <div className="w-screen h-screen bg-vscode-bg flex flex-col overflow-hidden">
      {/* Header */}
      <Header onReset={reset} />

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
            onCommit={commit}
            onPush={push}
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
          />
        </div>
      </div>

      {/* Status bar */}
      <StatusBar currentBranch={gitState.currentBranch} />
    </div>
  );
}

export default App;
