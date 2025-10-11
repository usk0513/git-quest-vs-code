# Git Quest - アーキテクチャ設計書

## 1. システムアーキテクチャ概要

### 1.1 全体構成

```
┌─────────────────────────────────────────────────┐
│                  ブラウザ                        │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │         React + TypeScript               │ │
│  │                                           │ │
│  │  ┌─────────────────────────────────────┐ │ │
│  │  │   UIコンポーネント層                │ │ │
│  │  │  - Layout, Terminal, Editor等       │ │ │
│  │  └──────────────┬──────────────────────┘ │ │
│  │                 │                         │ │
│  │  ┌─────────────▼──────────────────────┐ │ │
│  │  │   状態管理層（Zustand）             │ │ │
│  │  │  - useAppStore                     │ │ │
│  │  └──────────────┬──────────────────────┘ │ │
│  │                 │                         │ │
│  │  ┌─────────────▼──────────────────────┐ │ │
│  │  │   サービス層                        │ │ │
│  │  │  - TutorialService                 │ │ │
│  │  │  - GitService                      │ │ │
│  │  │  - FileSystemService               │ │ │
│  │  │  - GitValidator                    │ │ │
│  │  └──────────────┬──────────────────────┘ │ │
│  │                 │                         │ │
│  │  ┌─────────────▼──────────────────────┐ │ │
│  │  │   外部ライブラリ層                   │ │ │
│  │  │  - isomorphic-git                  │ │ │
│  │  │  - LightningFS (IndexedDB)         │ │ │
│  │  └─────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

### 1.2 レイヤー責務

#### UIコンポーネント層
- ユーザーインターフェースの描画
- ユーザー入力の受付
- 状態管理層への操作委譲
- **Gitやファイルシステムの直接操作は禁止**

#### 状態管理層（Zustand）
- アプリケーション全体の状態管理
- UIとサービス層の仲介
- 状態変更の一元管理

#### サービス層
- ビジネスロジックの実装
- Git操作の抽象化
- チュートリアル進行の管理
- コマンド検証・実行

#### 外部ライブラリ層
- Git操作の実装（isomorphic-git）
- 仮想ファイルシステム（LightningFS）

## 2. サービス層設計

### 2.1 サービス依存関係

```
TutorialService（オーケストレーター）
    ↓ 依存
    ├─ GitService
    ├─ FileSystemService
    ├─ GitValidator
    ├─ CommandParser
    ├─ StepValidator
    └─ RemoteSimulator
```

### 2.2 各サービスの責務

#### TutorialService
**責務:** チュートリアル全体のオーケストレーション

- コマンド実行の制御
- ステップ進行の管理
- バリデーション実行
- Git状態の取得・更新
- ファイル操作の仲介

**主要メソッド:**
```typescript
initialize(): Promise<void>
executeCommand(command: string): Promise<CommandExecutionResult>
nextStep(): Promise<void>
reset(): Promise<void>
getGitState(): Promise<GitState>
editFile(filepath: string, content: string): Promise<void>
```

#### GitService
**責務:** isomorphic-gitのラッパー

- Git操作の抽象化
- Git状態の取得
- エラーハンドリング

**主要メソッド:**
```typescript
init(dir: string): Promise<void>
add(dir: string, filepath: string): Promise<void>
commit(dir: string, message: string): Promise<string>
branch(dir: string, branchName: string, checkout?: boolean): Promise<void>
checkout(dir: string, ref: string): Promise<void>
currentBranch(dir: string): Promise<string>
listBranches(dir: string): Promise<string[]>
log(dir: string, depth?: number): Promise<GitCommit[]>
getGitState(dir: string): Promise<GitState>
```

#### FileSystemService
**責務:** LightningFSのラッパー（シングルトン）

- ファイルシステム操作の抽象化
- 単一インスタンスの保証（IndexedDB一貫性）

**主要メソッド:**
```typescript
readFile(filepath: string): Promise<string>
writeFile(filepath: string, content: string): Promise<void>
mkdir(dirpath: string): Promise<void>
readdir(dirpath: string): Promise<string[]>
exists(filepath: string): Promise<boolean>
```

#### GitValidator
**責務:** Gitコマンドのバリデーション

- コマンド形式の検証
- 許可コマンドのチェック
- コマンド固有の検証（引数、フラグ等）

**主要メソッド:**
```typescript
validateCommand(commandString: string, allowedCommands: GitCommand[]): ValidationResult
```

#### CommandParser
**責務:** Gitコマンドの解析

- コマンド文字列のパース
- 引数・フラグの抽出
- コマンド構造の分解

**主要メソッド:**
```typescript
parse(commandString: string): ParsedGitCommand
isGitCommand(commandString: string): boolean
```

#### StepValidator
**責務:** ステップ完了条件の検証

- バリデーションルールの実行
- Git状態の確認
- ファイル状態の確認

**主要メソッド:**
```typescript
validateStep(rules: ValidationRule[], gitState: GitState, workspaceDir: string): Promise<ValidationResult>
```

#### RemoteSimulator
**責務:** リモートリポジトリのシミュレーション

- 架空のリモートリポジトリ作成
- クローン操作のシミュレート
- プッシュ操作のシミュレート

**主要メソッド:**
```typescript
createRemoteRepository(): Promise<void>
cloneToWorkspace(workspaceDir: string): Promise<void>
simulatePush(workspaceDir: string, branch: string): Promise<boolean>
```

## 3. 状態管理設計

### 3.1 状態構造

```typescript
interface AppState {
  // サービスインスタンス
  tutorialService: TutorialService | null;

  // Git状態
  gitState: GitState;

  // チュートリアル状態
  currentStep: StepConfig | null;
  tutorialState: TutorialState | null;

  // UI状態
  terminalOutput: string[];
  currentFile: string | null;
  fileContent: string;
  files: string[];
  isInitialized: boolean;
  sidebarView: 'source-control' | 'explorer';

  // アクション
  initialize(): Promise<void>;
  executeCommand(command: string): Promise<void>;
  // ... 他のアクション
}
```

### 3.2 状態更新フロー

**コマンド実行時:**
```
ユーザー入力
  ↓
useAppStore.executeCommand()
  ↓
TutorialService.executeCommand()
  ↓
GitValidator.validateCommand()（検証）
  ↓
CommandParser.parse()（解析）
  ↓
TutorialService.executeGitCommand()（実行）
  ↓
GitService.xxx()（Git操作）
  ↓
StepValidator.validateStep()（ステップ検証）
  ↓
TutorialService.advanceStep()（進行）
  ↓
useAppStore.refreshGitState()（状態更新）
  ↓
UIコンポーネント再レンダリング
```

**GUI操作時:**
```
ボタンクリック（例: ステージング）
  ↓
useAppStore.stageFile(filepath)
  ↓
内部的にexecuteCommand(`git add ${filepath}`)を呼び出し
  ↓
（以降は上記と同じフロー）
```

## 4. データフロー設計

### 4.1 仮想Git環境

```
LightningFS (IndexedDB)
  ├─ /remote-repo/          ← 架空のリモートリポジトリ
  │   ├─ .git/
  │   ├─ README.md
  │   ├─ greeting.txt
  │   └─ src/
  │       └─ main.js
  │
  └─ /workspace/            ← ユーザーのワークスペース
      ├─ .git/
      ├─ README.md
      ├─ greeting.txt
      └─ src/
          └─ main.js
```

### 4.2 クローン処理フロー

```
1. RemoteSimulator.createRemoteRepository()
   - /remote-repo/を作成
   - 初期ファイルを配置
   - git initして初期コミット作成

2. ユーザーが`git clone /remote-repo`を実行

3. RemoteSimulator.cloneToWorkspace()
   - /workspace/を作成
   - /remote-repo/からファイルをコピー
   - git initして履歴を再現
```

### 4.3 Git状態の取得

isomorphic-gitの`statusMatrix()`から状態を解析:

```typescript
// statusMatrixの形式: [filepath, HEAD, WORKDIR, STAGE]
// 各値: 0=不在, 1=存在（変更なし）, 2=存在（変更あり）

例:
['greeting.txt', 1, 2, 1]
→ HEADに存在、WORKDIRで変更、STAGEは変更前
→ 解釈: 変更ありだがステージングされていない

['greeting.txt', 1, 2, 2]
→ HEADに存在、WORKDIRで変更、STAGEも変更
→ 解釈: 変更ありかつステージング済み
```

## 5. チュートリアル進行設計

### 5.1 ステップ定義構造

```typescript
interface StepConfig {
  id: number;                        // ステップID
  stage: 'terminal' | 'gui';         // ターミナル or GUI
  title: string;                     // ステップタイトル
  description: string;               // 短い説明
  detailedInstructions: string;      // 詳細説明（Markdown）
  allowedCommands: GitCommand[];     // 許可コマンド
  hints: string[];                   // ヒント
  successMessage: string;            // 成功メッセージ
  validationRules: ValidationRule[]; // 検証ルール
}
```

### 5.2 ステップIDの設計

```
ターミナルステージ:  0, 1, 2, 3, 4, 5, 6
GUIステージ:        21, 31, 41, 51, 61

※ 6→21へのジャンプは意図的
※ 将来の中間ステップ追加を考慮
```

### 5.3 バリデーションルール

```typescript
type ValidationRule =
  | { type: 'file-exists', target: string }
  | { type: 'file-staged', target: string }
  | { type: 'commit-made' }
  | { type: 'branch-created', target: string }
  | { type: 'branch-switched', target: string }
  | { type: 'file-content', target: string, expectedValue: string }
  | { type: 'pushed' };
```

### 5.4 自動進行ロジック

```typescript
// コマンド実行後
checkStepCompletion() {
  const gitState = await getGitState();
  const validation = await stepValidator.validateStep(
    currentStep.validationRules,
    gitState
  );

  if (validation.passed) {
    advanceStep();  // 次のステップへ
  }
}
```

## 6. エラーハンドリング設計

### 6.1 エラーの種類

1. **バリデーションエラー**: 許可されていないコマンド
2. **構文エラー**: コマンドの形式が不正
3. **実行エラー**: Git操作自体が失敗
4. **システムエラー**: ファイルシステム等の致命的エラー

### 6.2 エラーメッセージ戦略

```typescript
interface CommandExecutionResult {
  success: boolean;
  output: string;      // 成功時の出力
  error?: string;      // エラーメッセージ
  hint?: string;       // ヒント（エラー時）
}
```

**例:**
```typescript
// 許可されていないコマンド
{
  success: false,
  output: '',
  error: 'The command "git push" is not allowed at this step',
  hint: 'Allowed commands: git clone'
}

// 引数不足
{
  success: false,
  output: '',
  error: 'git add requires a file path',
  hint: 'Usage: git add <file> or git add .'
}
```

## 7. パフォーマンス最適化設計

### 7.1 シングルトンパターン

**FileSystemService:**
- LightningFSは1つのIndexedDBデータベースを使用
- 複数インスタンス作成でデータ不整合を防ぐため、シングルトン化

```typescript
let fsInstance: FileSystemService | null = null;

export const getFileSystemService = (): FileSystemService => {
  if (!fsInstance) {
    fsInstance = new FileSystemService('git-quest-fs', true);
  }
  return fsInstance;
};
```

### 7.2 状態更新の最適化

- Git状態は操作後のみ更新（refreshGitState）
- 不要な再レンダリングを防ぐため、Zustandのselectを活用

### 7.3 メモリ管理

- リセット時にLightningFSを完全にwipe
- ページリロードでIndexedDBを再初期化

## 8. セキュリティ設計

### 8.1 コマンド実行制限

- ホワイトリスト方式
- 各ステップで許可されたコマンドのみ実行可能
- Gitコマンド以外は完全にブロック

### 8.2 ファイルシステムのサンドボックス化

- LightningFSによる完全な隔離
- ブラウザのIndexedDBに限定
- ローカルファイルシステムへのアクセス不可

### 8.3 XSS対策

- ユーザー入力は全てReactのエスケープ機能を使用
- Markdownレンダリングは使用しない（プレーンテキスト表示）
