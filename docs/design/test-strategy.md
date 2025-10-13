# Git Quest - テスト戦略・設計書

## 1. テスト戦略概要

### 1.1 テストの目的

- コアロジック（Git操作、バリデーション）の品質保証
- リファクタリング時の回帰防止
- チュートリアルフローの正確性検証
- UIコンポーネントの動作保証

### 1.2 テストレベル

| テストレベル | 対象 | 優先度 | カバレッジ目標 |
|------------|------|--------|--------------|
| ユニットテスト | サービス・ユーティリティ | 高 | 80%以上 |
| 統合テスト | サービス間連携 | 中 | 60%以上 |
| コンポーネントテスト | UIコンポーネント | 中 | 50%以上 |
| E2Eテスト | チュートリアル全体 | 低 | 主要フローのみ |

### 1.3 テストツールスタック

- **テストフレームワーク**: Vitest
- **UIテスト**: React Testing Library + @testing-library/user-event
- **アサーション**: Vitest標準 + @testing-library/jest-dom
- **モック**: Vitest標準モック機能
- **E2Eテスト（オプション）**: Playwright

## 2. ユニットテスト設計

### 2.1 CommandParser テスト

**目的**: Gitコマンドの解析が正確か検証

**テストケース:**

| ID | テスト内容 | 入力 | 期待結果 |
|----|----------|------|---------|
| CP-01 | git clone のパース | `git clone /remote-repo` | command='clone', args=['/remote-repo'] |
| CP-02 | git commit -m のパース | `git commit -m "test"` | command='commit', flags=['-m'], message='test' |
| CP-03 | git checkout -b のパース | `git checkout -b feature/test` | command='checkout', flags=['-b'], branchName='feature/test' |
| CP-04 | git add . のパース | `git add .` | command='add', args=['.'] |
| CP-05 | 非Gitコマンド拒否 | `npm install` | Error: 'Only git commands are allowed' |
| CP-06 | 空コマンド拒否 | `git` | Error |
| CP-07 | クォート内のスペース | `git commit -m "with spaces"` | message='with spaces' |
| CP-08 | 複数引数 | `git push origin main` | args=['origin', 'main'] |

**実装例:**
```typescript
// tests/unit/services/terminal/CommandParser.test.ts
describe('CommandParser', () => {
  const parser = new CommandParser();

  describe('parse', () => {
    it('should parse git clone command with URL', () => {
      const result = parser.parse('git clone /remote-repo');
      expect(result.command).toBe('clone');
      expect(result.args).toEqual(['/remote-repo']);
    });

    it('should parse git commit with message', () => {
      const result = parser.parse('git commit -m "Initial commit"');
      expect(result.command).toBe('commit');
      expect(result.flags).toContain('-m');
      expect(result.message).toBe('Initial commit');
    });

    // ... 他のテストケース
  });
});
```

### 2.2 GitValidator テスト

**目的**: コマンドバリデーションが正確か検証

**テストケース:**

| ID | テスト内容 | 許可コマンド | 入力 | 期待結果 |
|----|----------|------------|------|---------|
| GV-01 | 許可コマンド受理 | ['clone'] | `git clone /repo` | passed=true |
| GV-02 | 非許可コマンド拒否 | ['clone'] | `git push` | passed=false |
| GV-03 | git add 引数必須 | ['add'] | `git add` | passed=false, hint='requires a file path' |
| GV-04 | git commit -m 必須 | ['commit'] | `git commit` | passed=false, hint='requires a message' |
| GV-05 | git commit 空メッセージ拒否 | ['commit'] | `git commit -m ""` | passed=false |
| GV-06 | git checkout -b 引数必須 | ['checkout'] | `git checkout -b` | passed=false |
| GV-07 | git push 引数2つ必須 | ['push'] | `git push` | passed=false |
| GV-08 | 非Gitコマンド拒否 | ['add'] | `npm install` | passed=false |

**実装済み:**
```typescript
// tests/unit/services/git/GitValidator.test.ts
describe('GitValidator', () => {
  const validator = new GitValidator();

  it('should allow git clone command when clone is allowed', () => {
    const result = validator.validateCommand('git clone /remote-repo', ['clone']);
    expect(result.passed).toBe(true);
  });

  it('should reject git commit without -m flag', () => {
    const result = validator.validateCommand('git commit', ['commit']);
    expect(result.passed).toBe(false);
    expect(result.message).toContain('requires a message');
  });

  // ... 実装済み
});
```

### 2.3 StepValidator テスト

**目的**: ステップ完了条件の検証が正確か

**テストケース:**

| ID | テスト内容 | ルール | Git状態 | 期待結果 |
|----|----------|-------|---------|---------|
| SV-01 | ファイル存在確認 | file-exists: 'README.md' | ファイル存在 | passed=true |
| SV-02 | ファイル不在検出 | file-exists: 'README.md' | ファイル不在 | passed=false |
| SV-03 | ステージング確認 | file-staged: 'test.txt' | staged: ['test.txt'] | passed=true |
| SV-04 | 未ステージング検出 | file-staged: 'test.txt' | unstaged: ['test.txt'] | passed=false |
| SV-05 | コミット確認 | commit-made | commits.length > 0 | passed=true |
| SV-06 | 未コミット検出 | commit-made | commits.length = 0 | passed=false |
| SV-07 | ブランチ作成確認 | branch-created: 'feature' | branches: ['main', 'feature'] | passed=true |
| SV-08 | ブランチ切替確認 | branch-switched: 'feature' | currentBranch='feature' | passed=true |
| SV-09 | ファイル内容確認 | file-content: 'test.txt'='Hello' | content='Hello, World' | passed=true |
| SV-10 | プッシュ確認 | pushed | (シミュレート) | passed=true |

**実装:**
```typescript
// tests/unit/services/tutorial/StepValidator.test.ts
describe('StepValidator', () => {
  let validator: StepValidator;
  let mockFs: FileSystemService;

  beforeEach(() => {
    mockFs = createMockFileSystem();
    validator = new StepValidator(mockFs);
  });

  it('should validate file exists', async () => {
    const mockGitState = createMockGitState();
    await mockFs.writeFile('/workspace/README.md', 'test');

    const result = await validator.validateStep(
      [{ type: 'file-exists', target: 'README.md' }],
      mockGitState,
      '/workspace'
    );

    expect(result.passed).toBe(true);
  });

  it('should validate file is staged', () => {
    const mockGitState = {
      ...createMockGitState(),
      stagedFiles: [{ path: 'test.txt', status: 'modified' }]
    };

    const result = validator.validateStep(
      [{ type: 'file-staged', target: 'test.txt' }],
      mockGitState,
      '/workspace'
    );

    expect(result.passed).toBe(true);
  });
});
```

## 3. 統合テスト設計

### 3.1 TutorialService 統合テスト

**目的**: チュートリアル全体フローの動作検証

**テストシナリオ:**

#### TS-01: 完全フロー実行
```typescript
describe('TutorialService Integration', () => {
  let tutorialService: TutorialService;

  beforeEach(async () => {
    const fs = new FileSystemService('test-fs', true);
    const git = new GitService(fs);
    // ... サービス初期化
    tutorialService = new TutorialService(/* ... */);
    await tutorialService.initialize();
  });

  it('should complete full tutorial flow (steps 1-6)', async () => {
    // Step 1: Clone
    const cloneResult = await tutorialService.executeCommand('git clone /remote-repo');
    expect(cloneResult.success).toBe(true);
    expect(tutorialService.getState().currentStep).toBe(2);

    // Step 2: Create branch
    const branchResult = await tutorialService.executeCommand('git checkout -b feature/test');
    expect(branchResult.success).toBe(true);
    expect(tutorialService.getState().currentStep).toBe(3);

    // Step 3: Edit file
    await tutorialService.editFile('greeting.txt', 'Hello, Git!');
    expect(tutorialService.getState().currentStep).toBe(4);

    // Step 4: Add
    await tutorialService.executeCommand('git add greeting.txt');
    expect(tutorialService.getState().currentStep).toBe(5);

    // Step 5: Commit
    await tutorialService.executeCommand('git commit -m "Add greeting"');
    expect(tutorialService.getState().currentStep).toBe(6);

    // Step 6: Push
    await tutorialService.executeCommand('git push origin feature/test');
    expect(tutorialService.isTerminalStageCompleted()).toBe(true);
  });

  it('should reject wrong commands and provide hints', async () => {
    // Step 1で間違ったコマンド
    const result = await tutorialService.executeCommand('git push');
    expect(result.success).toBe(false);
    expect(result.hint).toBeDefined();
    expect(tutorialService.getState().currentStep).toBe(1); // ステップは進まない
  });
});
```

#### TS-02: リセット機能
```typescript
it('should reset to initial state', async () => {
  // 進行させる
  await tutorialService.executeCommand('git clone /remote-repo');
  expect(tutorialService.getState().currentStep).toBe(2);

  // リセット
  await tutorialService.reset();

  // 初期状態に戻る
  expect(tutorialService.getState().currentStep).toBe(0);
  expect(tutorialService.getState().isCompleted).toBe(false);
});
```

### 3.2 GitService + FileSystemService 統合テスト

**目的**: Git操作とファイルシステムの連携検証

**テストケース:**

```typescript
describe('GitService + FileSystemService Integration', () => {
  let fs: FileSystemService;
  let git: GitService;

  beforeEach(() => {
    fs = new FileSystemService('test-fs', true);
    git = new GitService(fs);
  });

  it('should initialize repository', async () => {
    await git.init('/test-repo');
    const exists = await fs.exists('/test-repo/.git');
    expect(exists).toBe(true);
  });

  it('should add and commit file', async () => {
    await git.init('/test-repo');
    await fs.writeFile('/test-repo/test.txt', 'content');
    await git.add('/test-repo', 'test.txt');
    const sha = await git.commit('/test-repo', 'Initial commit');

    expect(sha).toBeDefined();

    const commits = await git.log('/test-repo');
    expect(commits).toHaveLength(1);
    expect(commits[0].message).toBe('Initial commit');
  });

  it('should create and checkout branch', async () => {
    await git.init('/test-repo');
    await git.branch('/test-repo', 'feature', true);

    const currentBranch = await git.currentBranch('/test-repo');
    expect(currentBranch).toBe('feature');

    const branches = await git.listBranches('/test-repo');
    expect(branches).toContain('feature');
  });
});
```

## 4. コンポーネントテスト設計

### 4.1 Button コンポーネント

**実装済み:**
```typescript
// tests/unit/components/Button.test.tsx
describe('Button', () => {
  it('should render button with children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('should call onClick when clicked', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    await userEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

### 4.2 Terminal コンポーネント

**テストケース:**

```typescript
// tests/unit/components/Layout/Terminal.test.tsx
describe('Terminal', () => {
  it('should display output lines', () => {
    const output = ['$ git status', 'On branch main', 'nothing to commit'];
    render(<Terminal output={output} onCommand={vi.fn()} />);

    output.forEach(line => {
      expect(screen.getByText(line)).toBeInTheDocument();
    });
  });

  it('should execute command on Enter key', async () => {
    const onCommand = vi.fn();
    const user = userEvent.setup();

    render(<Terminal output={[]} onCommand={onCommand} />);

    const input = screen.getByPlaceholderText(/type a git command/i);
    await user.type(input, 'git status{Enter}');

    expect(onCommand).toHaveBeenCalledWith('git status');
  });

  it('should clear input after command execution', async () => {
    const user = userEvent.setup();

    render(<Terminal output={[]} onCommand={vi.fn()} />);

    const input = screen.getByPlaceholderText(/type a git command/i);
    await user.type(input, 'git status{Enter}');

    expect(input).toHaveValue('');
  });
});
```

### 4.3 SourceControlView コンポーネント

**テストケース:**

```typescript
// tests/unit/components/SourceControl/SourceControlView.test.tsx
describe('SourceControlView', () => {
  const mockGitState: GitState = {
    isRepository: true,
    currentBranch: 'main',
    branches: ['main'],
    stagedFiles: [],
    unstagedFiles: [
      { path: 'test.txt', status: 'modified' }
    ],
    commits: [],
    hasRemote: false
  };

  it('should display unstaged files', () => {
    render(
      <SourceControlView
        gitState={mockGitState}
        onStageFile={vi.fn()}
        onCommit={vi.fn()}
        onPush={vi.fn()}
      />
    );

    expect(screen.getByText('test.txt')).toBeInTheDocument();
    expect(screen.getByText(/変更 \(1\)/)).toBeInTheDocument();
  });

  it('should call onStageFile when + button clicked', async () => {
    const onStageFile = vi.fn();
    const user = userEvent.setup();

    render(
      <SourceControlView
        gitState={mockGitState}
        onStageFile={onStageFile}
        onCommit={vi.fn()}
        onPush={vi.fn()}
      />
    );

    const stageButton = screen.getByRole('button', { name: '+' });
    await user.click(stageButton);

    expect(onStageFile).toHaveBeenCalledWith('test.txt');
  });

  it('should disable commit button when no message', () => {
    render(
      <SourceControlView
        gitState={{ ...mockGitState, stagedFiles: [{ path: 'test.txt', status: 'modified' }] }}
        onStageFile={vi.fn()}
        onCommit={vi.fn()}
        onPush={vi.fn()}
      />
    );

    const commitButton = screen.getByRole('button', { name: /コミット/ });
    expect(commitButton).toBeDisabled();
  });

  it('should render read-only indicators in command stage', () => {
    render(
      <SourceControlView
        gitState={mockGitState}
        onStageFile={vi.fn()}
        onCommit={vi.fn()}
        onPush={vi.fn()}
        readOnly
      />
    );

    expect(screen.getByPlaceholderText(/閲覧のみ/)).toBeDisabled();
    expect(screen.getByText(/閲覧のみです/)).toBeInTheDocument();
  });
});
```

## 5. E2Eテスト設計（オプション）

### 5.1 Playwright テストシナリオ

```typescript
// tests/e2e/tutorial-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Git Quest Tutorial', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
  });

  test('should complete terminal stage', async ({ page }) => {
    // Step 0: Next button
    await page.getByRole('button', { name: /次へ/ }).click();

    // Step 1: Clone
    await page.getByPlaceholder(/type a git command/i).fill('git clone /remote-repo');
    await page.keyboard.press('Enter');
    await expect(page.getByText(/Step 2/)).toBeVisible({ timeout: 5000 });

    // Step 2: Create branch
    await page.getByPlaceholder(/type a git command/i).fill('git checkout -b feature/add-greeting');
    await page.keyboard.press('Enter');
    await expect(page.getByText(/Step 3/)).toBeVisible({ timeout: 5000 });

    // Step 3: Edit file
    await page.getByText('greeting.txt').click();
    await page.getByRole('textbox', { name: /editor/ }).fill('Hello, Git!');
    await expect(page.getByText(/Step 4/)).toBeVisible({ timeout: 5000 });

    // Step 4: Add
    await page.getByPlaceholder(/type a git command/i).fill('git add greeting.txt');
    await page.keyboard.press('Enter');
    await expect(page.getByText(/Step 5/)).toBeVisible({ timeout: 5000 });

    // Step 5: Commit
    await page.getByPlaceholder(/type a git command/i).fill('git commit -m "Add greeting"');
    await page.keyboard.press('Enter');
    await expect(page.getByText(/Step 6/)).toBeVisible({ timeout: 5000 });

    // Step 6: Push
    await page.getByPlaceholder(/type a git command/i).fill('git push origin feature/add-greeting');
    await page.keyboard.press('Enter');
    await expect(page.getByText(/セカンドステージ/)).toBeVisible({ timeout: 5000 });
  });

  test('should reset tutorial', async ({ page }) => {
    // 進行
    await page.getByRole('button', { name: /次へ/ }).click();
    await page.getByPlaceholder(/type a git command/i).fill('git clone /remote-repo');
    await page.keyboard.press('Enter');

    // リセット
    await page.getByRole('button', { name: /リセット/ }).click();

    // 初期状態に戻る
    await expect(page.getByText(/Step 0/)).toBeVisible();
  });
});
```

## 6. テスト実行戦略

### 6.1 CI/CD統合

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:unit        # ユニット・統合テスト
      - run: npm run test:coverage    # カバレッジ取得
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

### 6.2 テスト実行コマンド

```bash
# すべてのテスト実行（watch mode）
npm run test

# 1回だけ実行
npm run test:unit

# カバレッジ付き実行
npm run test:coverage

# 特定ファイルのみ実行
npm run test -- CommandParser.test.ts

# UIモードで実行
npm run test:ui
```

### 6.3 カバレッジ目標

```javascript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
  },
});
```

## 7. テスト実装の優先順位

### Phase 1（実装済み）
- ✅ CommandParser ユニットテスト
- ✅ GitValidator ユニットテスト
- ✅ Button コンポーネントテスト

### Phase 2（次のステップ）
- StepValidator ユニットテスト
- TutorialService 統合テスト（基本フロー）
- Terminal コンポーネントテスト

### Phase 3（将来の拡張）
- GitService 統合テスト
- SourceControlView コンポーネントテスト
- その他UIコンポーネントテスト
- E2Eテスト（Playwright）

## 8. テストのベストプラクティス

### 8.1 命名規則

```typescript
// ❌ 悪い例
it('test 1', () => { ... });

// ✅ 良い例
it('should parse git clone command with URL', () => { ... });
```

### 8.2 AAA パターン

```typescript
it('should validate file is staged', () => {
  // Arrange（準備）
  const mockGitState = {
    stagedFiles: [{ path: 'test.txt', status: 'modified' }]
  };

  // Act（実行）
  const result = validator.validateStep(rules, mockGitState, '/workspace');

  // Assert（検証）
  expect(result.passed).toBe(true);
});
```

### 8.3 モックの使用

```typescript
// サービスのモック
const mockGitService = {
  add: vi.fn().mockResolvedValue(undefined),
  commit: vi.fn().mockResolvedValue('abc123'),
  // ...
};

// 依存を注入
const tutorialService = new TutorialService(
  mockFileSystem,
  mockGitService,
  // ...
);
```

### 8.4 テストの独立性

```typescript
// ❌ 悪い例：テストが互いに依存
let sharedState;
it('test 1', () => { sharedState = 'value'; });
it('test 2', () => { expect(sharedState).toBe('value'); });

// ✅ 良い例：各テストが独立
beforeEach(() => {
  // 各テスト前に初期化
});

it('test 1', () => { /* 独立 */ });
it('test 2', () => { /* 独立 */ });
```
