# Git Quest - 実装ガイド

## 1. 実装の全体フロー

このドキュメントでは、Git Questアプリケーションの実装手順を段階的に説明します。

### 1.1 実装フェーズ

```
Phase 1: プロジェクトセットアップ
  ↓
Phase 2: サービス層実装
  ↓
Phase 3: 状態管理実装
  ↓
Phase 4: UIコンポーネント実装
  ↓
Phase 5: 統合とテスト
  ↓
Phase 6: ドキュメント作成
```

## 2. Phase 1: プロジェクトセットアップ

### 2.1 プロジェクト初期化

```bash
# Viteでプロジェクト作成
npm create vite@latest . -- --template react-ts

# 依存パッケージのインストール
npm install
npm install isomorphic-git @isomorphic-git/lightning-fs zustand

# 開発用パッケージ
npm install -D @types/react @types/react-dom
npm install -D vitest @vitest/ui jsdom
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install -D tailwindcss postcss autoprefixer
npm install -D eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser
```

### 2.2 設定ファイル作成

#### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

#### vite.config.ts
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    exclude: ['@isomorphic-git/lightning-fs'],
  },
})
```

#### vitest.config.ts
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup/vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

#### tailwind.config.js
```javascript
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'vscode-bg': '#ffffff',
        'vscode-sidebar': '#f3f3f3',
        'vscode-border': '#e5e5e5',
        'vscode-text': '#000000',
        'vscode-text-muted': '#8c8c8c',
        'vscode-accent': '#005fb8',
        'vscode-button': '#0078d4',
        'vscode-hover': '#e8e8e8',
        // ... その他の色
      },
    },
  },
}
```

### 2.3 ディレクトリ構造作成

```bash
mkdir -p src/{components/{Layout,SourceControl,Explorer,Common},services/{git,terminal,filesystem,tutorial},store,types,constants,styles}
mkdir -p tests/{unit/{services/{git,terminal,tutorial},components},integration,setup}
```

## 3. Phase 2: サービス層実装

### 3.1 型定義の作成

#### src/types/git.ts
```typescript
export interface GitFile {
  path: string;
  status: 'modified' | 'added' | 'deleted' | 'untracked';
}

export interface GitCommit {
  oid: string;
  message: string;
  author: {
    name: string;
    email: string;
    timestamp: number;
  };
}

export interface GitState {
  isRepository: boolean;
  currentBranch: string;
  branches: string[];
  stagedFiles: GitFile[];
  unstagedFiles: GitFile[];
  commits: GitCommit[];
  hasRemote: boolean;
}

export type GitCommand =
  | 'clone' | 'init' | 'add' | 'commit' | 'push'
  | 'branch' | 'checkout' | 'status' | 'log';
```

#### src/types/tutorial.ts
```typescript
export type TutorialStage = 'terminal' | 'gui';

export interface StepConfig {
  id: number;
  stage: TutorialStage;
  title: string;
  description: string;
  detailedInstructions: string;
  allowedCommands: GitCommand[];
  hints: string[];
  successMessage: string;
  validationRules: ValidationRule[];
}

export interface ValidationRule {
  type: 'file-exists' | 'file-staged' | 'commit-made'
        | 'branch-created' | 'branch-switched'
        | 'file-content' | 'pushed';
  target?: string;
  expectedValue?: string | boolean;
}
```

### 3.2 FileSystemService実装

**重要ポイント:**
- シングルトンパターンを使用
- IndexedDBの一貫性を保つため、インスタンスは1つのみ

```typescript
// src/services/filesystem/FileSystemService.ts
import FS from '@isomorphic-git/lightning-fs';

export class FileSystemService {
  private fs: FS;
  public pfs: FS['promises'];

  constructor(name: string = 'fs', wipe: boolean = false) {
    this.fs = new FS(name, { wipe });
    this.pfs = this.fs.promises;
  }

  async readFile(filepath: string): Promise<string> {
    const data = await this.pfs.readFile(filepath, { encoding: 'utf8' });
    return data as string;
  }

  async writeFile(filepath: string, content: string): Promise<void> {
    await this.pfs.writeFile(filepath, content, { encoding: 'utf8' });
  }

  // ... 他のメソッド

  getFS() {
    return this.fs;
  }
}

// シングルトンインスタンス
let fsInstance: FileSystemService | null = null;

export const getFileSystemService = (): FileSystemService => {
  if (!fsInstance) {
    fsInstance = new FileSystemService('git-quest-fs', true);
  }
  return fsInstance;
};

export const resetFileSystem = (): FileSystemService => {
  fsInstance = new FileSystemService('git-quest-fs', true);
  return fsInstance;
};
```

### 3.3 GitService実装

**重要ポイント:**
- isomorphic-gitのラッパー
- エラーハンドリングを統一
- statusMatrix()の解析ロジックが重要

```typescript
// src/services/git/GitService.ts
import git from 'isomorphic-git';
import { FileSystemService } from '../filesystem/FileSystemService';

export class GitService {
  private fs: FileSystemService;

  constructor(fileSystem: FileSystemService) {
    this.fs = fileSystem;
  }

  async init(dir: string): Promise<void> {
    await git.init({
      fs: this.fs.getFS(),
      dir,
      defaultBranch: 'main',
    });
  }

  async add(dir: string, filepath: string): Promise<void> {
    await git.add({
      fs: this.fs.getFS(),
      dir,
      filepath,
    });
  }

  // statusMatrix()の解析例
  async getGitState(dir: string): Promise<GitState> {
    const matrix = await git.statusMatrix({ fs: this.fs.getFS(), dir });

    const stagedFiles: GitFile[] = [];
    const unstagedFiles: GitFile[] = [];

    for (const [filepath, headStatus, workdirStatus, stageStatus] of matrix) {
      // [0,2,2] = 新規ファイル、ステージ済み
      if (headStatus === 0 && workdirStatus === 2 && stageStatus === 2) {
        stagedFiles.push({ path: filepath, status: 'added' });
      }
      // [1,2,2] = 変更ファイル、ステージ済み
      else if (headStatus === 1 && workdirStatus === 2 && stageStatus === 2) {
        stagedFiles.push({ path: filepath, status: 'modified' });
      }
      // [1,2,1] = 変更ファイル、未ステージ
      else if (headStatus === 1 && workdirStatus === 2 && stageStatus === 1) {
        unstagedFiles.push({ path: filepath, status: 'modified' });
      }
      // ... 他のパターン
    }

    return { stagedFiles, unstagedFiles, /* ... */ };
  }
}
```

### 3.4 CommandParser実装

**重要ポイント:**
- クォート内のスペースを正しく処理
- フラグと引数を分離

```typescript
// src/services/terminal/CommandParser.ts
export class CommandParser {
  parse(commandString: string): ParsedGitCommand {
    if (!commandString.startsWith('git ')) {
      throw new Error('Only git commands are allowed');
    }

    const withoutGit = commandString.substring(4).trim();
    const parts = this.splitCommand(withoutGit);

    const subcommand = parts[0] as GitCommand;
    const args: string[] = [];
    const flags: string[] = [];
    let message: string | undefined;
    let branchName: string | undefined;

    for (let i = 1; i < parts.length; i++) {
      const part = parts[i];

      if (part.startsWith('-')) {
        flags.push(part);

        // -m flag: 次の引数がメッセージ
        if (part === '-m' && i + 1 < parts.length) {
          message = parts[i + 1];
          i++;
        }

        // -b flag: 次の引数がブランチ名
        if (part === '-b' && i + 1 < parts.length) {
          branchName = parts[i + 1];
          i++;
        }
      } else {
        args.push(part);
      }
    }

    return { command: subcommand, args, flags, message, branchName };
  }

  private splitCommand(commandString: string): string[] {
    const parts: string[] = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';

    for (let i = 0; i < commandString.length; i++) {
      const char = commandString[i];

      if ((char === '"' || char === "'") && !inQuotes) {
        inQuotes = true;
        quoteChar = char;
      } else if (char === quoteChar && inQuotes) {
        inQuotes = false;
        quoteChar = '';
      } else if (char === ' ' && !inQuotes) {
        if (current) {
          parts.push(current);
          current = '';
        }
      } else {
        current += char;
      }
    }

    if (current) parts.push(current);
    return parts;
  }
}
```

### 3.5 GitValidator実装

**重要ポイント:**
- 許可リストチェック
- コマンド固有の検証

```typescript
// src/services/git/GitValidator.ts
export class GitValidator {
  private parser: CommandParser;

  constructor() {
    this.parser = new CommandParser();
  }

  validateCommand(
    commandString: string,
    allowedCommands: GitCommand[]
  ): ValidationResult {
    if (!this.parser.isGitCommand(commandString)) {
      return {
        passed: false,
        message: 'Only git commands are allowed',
        hint: 'Start your command with "git"',
      };
    }

    const parsed = this.parser.parse(commandString);

    if (!allowedCommands.includes(parsed.command)) {
      return {
        passed: false,
        message: `The command "git ${parsed.command}" is not allowed at this step`,
        hint: `Allowed commands: ${allowedCommands.map(cmd => `git ${cmd}`).join(', ')}`,
      };
    }

    // コマンド固有の検証
    return this.validateSpecificCommand(parsed);
  }

  private validateSpecificCommand(parsed: ParsedGitCommand): ValidationResult {
    switch (parsed.command) {
      case 'commit':
        if (!parsed.flags.includes('-m') || !parsed.message) {
          return {
            passed: false,
            message: 'git commit requires a message',
            hint: 'Usage: git commit -m "your message"',
          };
        }
        break;

      case 'add':
        if (parsed.args.length === 0) {
          return {
            passed: false,
            message: 'git add requires a file path',
            hint: 'Usage: git add <file> or git add .',
          };
        }
        break;

      // ... 他のコマンド
    }

    return { passed: true, message: 'Valid command' };
  }
}
```

### 3.6 StepValidator実装

**重要ポイント:**
- 各バリデーションルールの実装
- ファイルシステムとGit状態の両方をチェック

```typescript
// src/services/tutorial/StepValidator.ts
export class StepValidator {
  private fs: FileSystemService;

  constructor(fileSystem: FileSystemService) {
    this.fs = fileSystem;
  }

  async validateStep(
    rules: ValidationRule[],
    gitState: GitState,
    workspaceDir: string
  ): Promise<ValidationResult> {
    for (const rule of rules) {
      const result = await this.validateRule(rule, gitState, workspaceDir);
      if (!result.passed) {
        return result;
      }
    }

    return { passed: true, message: 'Step completed successfully!' };
  }

  private async validateRule(
    rule: ValidationRule,
    gitState: GitState,
    workspaceDir: string
  ): Promise<ValidationResult> {
    switch (rule.type) {
      case 'file-exists':
        return await this.validateFileExists(rule.target!, workspaceDir);

      case 'file-staged':
        return this.validateFileStaged(rule.target!, gitState);

      case 'commit-made':
        return this.validateCommitMade(gitState);

      case 'branch-created':
        return this.validateBranchCreated(rule.target!, gitState);

      case 'file-content':
        return await this.validateFileContent(
          rule.target!,
          rule.expectedValue as string,
          workspaceDir
        );

      // ... 他のルール
    }
  }

  private validateFileStaged(filepath: string, gitState: GitState): ValidationResult {
    const isStaged = gitState.stagedFiles.some((f) => f.path === filepath);

    if (!isStaged) {
      return {
        passed: false,
        message: `File ${filepath} is not staged`,
        hint: 'Use git add to stage the file',
      };
    }

    return { passed: true, message: `File ${filepath} is staged` };
  }
}
```

### 3.7 TutorialService実装

**重要ポイント:**
- すべてのサービスを統合するオーケストレーター
- コマンド実行→バリデーション→ステップ進行の流れ

```typescript
// src/services/tutorial/TutorialService.ts
export class TutorialService {
  private fs: FileSystemService;
  private git: GitService;
  private validator: GitValidator;
  private stepValidator: StepValidator;
  private parser: CommandParser;
  private currentStepConfig: StepConfig;

  constructor(/* 依存注入 */) {
    this.fs = fileSystem;
    this.git = gitService;
    // ...
    this.currentStepConfig = TUTORIAL_STEPS[0];
  }

  async executeCommand(commandString: string): Promise<CommandExecutionResult> {
    // 1. バリデーション
    const validation = this.validator.validateCommand(
      commandString,
      this.currentStepConfig.allowedCommands
    );

    if (!validation.passed) {
      return {
        success: false,
        output: '',
        error: validation.message,
        hint: validation.hint,
      };
    }

    // 2. コマンド解析
    const parsed = this.parser.parse(commandString);

    // 3. コマンド実行
    const result = await this.executeGitCommand(parsed);

    // 4. ステップ完了チェック
    if (result.success) {
      await this.checkStepCompletion();
    }

    return result;
  }

  private async checkStepCompletion(): Promise<void> {
    const gitState = await this.git.getGitState(WORKSPACE_DIR);

    const validation = await this.stepValidator.validateStep(
      this.currentStepConfig.validationRules,
      gitState,
      WORKSPACE_DIR
    );

    if (validation.passed) {
      this.advanceStep();
    }
  }

  private advanceStep(): void {
    const nextStepId = this.state.currentStep + 1;

    // ステージ遷移チェック
    if (nextStepId === 7) {
      this.state.currentStage = 'gui';
      this.state.currentStep = 21;
      this.currentStepConfig = GUI_TUTORIAL_STEPS[0];
      return;
    }

    // 次のステップを検索
    const nextStep = TUTORIAL_STEPS.find(step => step.id === nextStepId);
    if (nextStep) {
      this.state.currentStep = nextStepId;
      this.currentStepConfig = nextStep;
    }
  }
}
```

## 4. Phase 3: 状態管理実装

### 4.1 Zustand Store実装

**重要ポイント:**
- すべてのサービスを初期化
- UIとサービス層の仲介
- GUI操作を内部的にコマンド実行に変換

```typescript
// src/store/useAppStore.ts
import { create } from 'zustand';

export const useAppStore = create<AppState>((set, get) => ({
  // 初期状態
  tutorialService: null,
  gitState: /* 初期値 */,
  currentStep: null,
  terminalOutput: [],
  // ...

  // 初期化
  initialize: async () => {
    const fs = getFileSystemService();
    const git = new GitService(fs);
    const validator = new GitValidator();
    const stepValidator = new StepValidator(fs);
    const remoteSimulator = new RemoteSimulator(fs, git);
    const parser = new CommandParser();

    const tutorialService = new TutorialService(
      fs,
      git,
      validator,
      stepValidator,
      remoteSimulator,
      parser
    );

    await tutorialService.initialize();

    set({
      tutorialService,
      currentStep: tutorialService.getCurrentStep(),
      isInitialized: true,
    });
  },

  // コマンド実行
  executeCommand: async (command: string) => {
    const { tutorialService } = get();
    if (!tutorialService) return;

    // ターミナルに表示
    set({ terminalOutput: [...get().terminalOutput, `$ ${command}`] });

    // 実行
    const result = await tutorialService.executeCommand(command);

    // 結果を表示
    const newOutput = [...get().terminalOutput];
    if (result.output) newOutput.push(result.output);
    if (result.error) {
      newOutput.push(`Error: ${result.error}`);
      if (result.hint) newOutput.push(`Hint: ${result.hint}`);
    }

    set({ terminalOutput: newOutput });

    // 状態更新
    await get().refreshGitState();
  },

  // GUI操作：ステージング
  stageFile: async (filepath: string) => {
    // 内部的にコマンド実行
    await get().tutorialService?.executeCommand(`git add ${filepath}`);
    await get().refreshGitState();
  },

  // GUI操作：コミット
  commit: async (message: string) => {
    await get().tutorialService?.executeCommand(`git commit -m "${message}"`);
    await get().refreshGitState();
  },

  // リセット
  reset: async () => {
    resetFileSystem();
    await get().initialize();
    set({ terminalOutput: ['Tutorial reset!'], currentFile: null });
  },
}));
```

## 5. Phase 4: UIコンポーネント実装

### 5.1 App.tsx実装

```typescript
// src/App.tsx
function App() {
  const {
    isInitialized,
    gitState,
    currentStep,
    terminalOutput,
    initialize,
    executeCommand,
    // ...
  } = useAppStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (!isInitialized || !currentStep) {
    return <div>Loading...</div>;
  }

  return (
    <div className="w-screen h-screen flex flex-col">
      <Header onReset={reset} />

      <div className="flex-1 flex">
        <Sidebar /* props */ />

        <div className="flex-1 flex flex-col">
          <EditorPane /* props */ />
          <Terminal output={terminalOutput} onCommand={executeCommand} />
        </div>

        <InstructionPane step={currentStep} />
      </div>

      <StatusBar currentBranch={gitState.currentBranch} />
    </div>
  );
}
```

### 5.2 Terminal実装

```typescript
// src/components/Layout/Terminal.tsx
export const Terminal: React.FC<TerminalProps> = ({ output, onCommand }) => {
  const [input, setInput] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && input.trim()) {
      onCommand(input.trim());
      setInput('');
    }
  };

  return (
    <div className="h-full bg-vscode-bg flex flex-col">
      <div className="flex-1 overflow-y-auto font-mono text-sm">
        {output.map((line, index) => (
          <div key={index}>{line}</div>
        ))}
      </div>

      <div className="flex items-center gap-2 p-2 border-t">
        <span className="font-mono">$</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent border-none outline-none"
          autoFocus
        />
      </div>
    </div>
  );
};
```

### 5.3 SourceControlView実装

```typescript
// src/components/SourceControl/SourceControlView.tsx
export const SourceControlView: React.FC<Props> = ({
  gitState,
  onStageFile,
  onCommit,
}) => {
  const [commitMessage, setCommitMessage] = useState('');

  return (
    <div className="h-full flex flex-col">
      {/* コミットメッセージ入力 */}
      <textarea
        value={commitMessage}
        onChange={(e) => setCommitMessage(e.target.value)}
        placeholder="コミットメッセージ"
      />
      <Button
        onClick={() => onCommit(commitMessage)}
        disabled={!commitMessage.trim()}
      >
        ✓ コミット
      </Button>

      {/* 未ステージファイル */}
      <div>
        <h3>変更 ({gitState.unstagedFiles.length})</h3>
        {gitState.unstagedFiles.map((file) => (
          <div key={file.path}>
            <span>{file.path}</span>
            <button onClick={() => onStageFile(file.path)}>+</button>
          </div>
        ))}
      </div>

      {/* ステージ済みファイル */}
      <div>
        <h3>ステージ済み ({gitState.stagedFiles.length})</h3>
        {gitState.stagedFiles.map((file) => (
          <div key={file.path}>{file.path}</div>
        ))}
      </div>
    </div>
  );
};
```

## 6. Phase 5: テスト実装

### 6.1 ユニットテスト実装順序

1. **CommandParser** → コマンド解析の基礎
2. **GitValidator** → バリデーションロジック
3. **StepValidator** → ステップ検証ロジック
4. **Button等の基本コンポーネント**

### 6.2 統合テスト実装

```typescript
// tests/integration/TutorialService.test.ts
describe('TutorialService Integration', () => {
  let tutorialService: TutorialService;

  beforeEach(async () => {
    // サービス初期化
    const fs = new FileSystemService('test', true);
    // ...
    tutorialService = new TutorialService(/* ... */);
    await tutorialService.initialize();
  });

  it('should complete full tutorial flow', async () => {
    // Step 1
    await tutorialService.executeCommand('git clone /remote-repo');
    expect(tutorialService.getState().currentStep).toBe(2);

    // Step 2
    await tutorialService.executeCommand('git checkout -b feature/test');
    expect(tutorialService.getState().currentStep).toBe(3);

    // ... 全ステップ実行
  });
});
```

## 7. 実装時の注意点

### 7.1 よくある間違い

❌ **UIコンポーネントから直接isomorphic-gitを呼び出す**
```typescript
// 悪い例
const MyComponent = () => {
  const handleClick = async () => {
    await git.add({ fs, dir: '/workspace', filepath: 'test.txt' });
  };
};
```

✅ **Zustand Store経由でサービスを呼び出す**
```typescript
// 良い例
const MyComponent = () => {
  const { stageFile } = useAppStore();

  const handleClick = async () => {
    await stageFile('test.txt');
  };
};
```

### 7.2 パフォーマンス注意点

- Git状態の取得（`getGitState()`）は重い処理
- 必要な時のみ呼び出す（操作後のみ）
- 不要な再レンダリングを防ぐ

### 7.3 デバッグのコツ

1. **ブラウザDevToolsのIndexedDBタブ**で仮想ファイルシステムを確認
2. **コンソール**でサービスの動作をログ出力
3. **React DevTools**で状態を確認

## 8. 実装完了チェックリスト

- [ ] すべてのサービスが実装されている
- [ ] Zustand Storeが正しく動作する
- [ ] UIコンポーネントが表示される
- [ ] コマンド実行が動作する
- [ ] ステップ進行が正しく動作する
- [ ] リセット機能が動作する
- [ ] ユニットテストが通る（カバレッジ70%以上）
- [ ] 統合テストが通る
- [ ] README.mdに起動方法が記載されている
- [ ] CLAUDE.mdが作成されている
