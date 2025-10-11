import { StepConfig } from '@/types';

export const TUTORIAL_STEPS: StepConfig[] = [
  // Step 0: Initial state
  {
    id: 0,
    stage: 'terminal',
    title: 'リモートリポジトリの確認',
    description: 'リモートリポジトリが存在する状態です',
    detailedInstructions: `
Git Questへようこそ！

このチュートリアルでは、Gitの基本的な操作を学びます。

現在、リモートリポジトリ（sample-repo）が存在している状態です。
これからこのリポジトリをローカルにクローンして、変更を加えていきます。

次のステップに進むには、右上の「次へ」ボタンをクリックしてください。
    `,
    allowedCommands: [],
    hints: [],
    successMessage: '準備完了です！次のステップに進みましょう。',
    validationRules: [],
  },
  // Step 1: git clone
  {
    id: 1,
    stage: 'terminal',
    title: 'Step 1: リポジトリをクローン',
    description: 'リモートリポジトリをローカルにクローンします',
    detailedInstructions: `
## git clone

リモートリポジトリをローカルにコピー（クローン）しましょう。

\`\`\`bash
git clone /remote-repo
\`\`\`

このコマンドを実行すると、リモートリポジトリの内容がローカルにコピーされます。
    `,
    allowedCommands: ['clone'],
    hints: [
      'git clone コマンドを使用します',
      'クローン元のパスは /remote-repo です',
      '正しいコマンド: git clone /remote-repo',
    ],
    successMessage: 'クローンに成功しました！ワークスペースにファイルがコピーされました。',
    validationRules: [
      { type: 'file-exists', target: 'README.md' },
      { type: 'file-exists', target: 'greeting.txt' },
    ],
  },
  // Step 2: Create branch
  {
    id: 2,
    stage: 'terminal',
    title: 'Step 2: 新しいブランチを作成',
    description: '作業用のブランチを作成して切り替えます',
    detailedInstructions: `
## git branch / git checkout

新しいブランチを作成して、そのブランチに切り替えましょう。

\`\`\`bash
git checkout -b feature/add-greeting
\`\`\`

\`-b\` オプションを使うと、ブランチの作成と切り替えを同時に行えます。

または、以下のように2つのコマンドに分けても同じです：
\`\`\`bash
git branch feature/add-greeting
git checkout feature/add-greeting
\`\`\`
    `,
    allowedCommands: ['branch', 'checkout'],
    hints: [
      'git checkout -b コマンドで作成と切り替えを同時に行えます',
      'ブランチ名は feature/add-greeting にしてください',
      '正しいコマンド: git checkout -b feature/add-greeting',
    ],
    successMessage: '新しいブランチの作成と切り替えに成功しました！',
    validationRules: [
      { type: 'branch-created', target: 'feature/add-greeting' },
      { type: 'branch-switched', target: 'feature/add-greeting' },
    ],
  },
  // Step 3: Edit file
  {
    id: 3,
    stage: 'terminal',
    title: 'Step 3: ファイルを編集',
    description: 'greeting.txt に内容を追加します',
    detailedInstructions: `
## ファイルの編集

中央のエディタペインで greeting.txt を開いて、以下の内容を追加してください：

\`\`\`
Hello, Git!
\`\`\`

ファイルを編集すると、左側のソース管理パネルに変更が表示されます。
    `,
    allowedCommands: ['status', 'diff'],
    hints: [
      'エディタで greeting.txt を開いてください',
      '"Hello, Git!" というテキストを追加してください',
      'ファイルを編集すると自動的に変更が検出されます',
    ],
    successMessage: 'ファイルの編集が完了しました！',
    validationRules: [
      { type: 'file-content', target: 'greeting.txt', expectedValue: 'Hello, Git!' },
    ],
  },
  // Step 4: git add
  {
    id: 4,
    stage: 'terminal',
    title: 'Step 4: 変更をステージング',
    description: '変更したファイルをステージングエリアに追加します',
    detailedInstructions: `
## git add

変更したファイルをステージングエリアに追加しましょう。

\`\`\`bash
git add greeting.txt
\`\`\`

または、すべての変更を一度に追加する場合：
\`\`\`bash
git add .
\`\`\`

ステージングエリアに追加されたファイルは、次のコミットに含まれます。
    `,
    allowedCommands: ['add', 'status'],
    hints: [
      'git add コマンドを使用します',
      'ファイル名を指定するか、. ですべて追加できます',
      '正しいコマンド: git add greeting.txt または git add .',
    ],
    successMessage: 'ファイルをステージングエリアに追加しました！',
    validationRules: [
      { type: 'file-staged', target: 'greeting.txt' },
    ],
  },
  // Step 5: git commit
  {
    id: 5,
    stage: 'terminal',
    title: 'Step 5: 変更をコミット',
    description: 'ステージングした変更をコミットします',
    detailedInstructions: `
## git commit

ステージングした変更をコミットしましょう。

\`\`\`bash
git commit -m "Add greeting message"
\`\`\`

\`-m\` オプションでコミットメッセージを指定します。
コミットメッセージは、何を変更したかを簡潔に説明するものです。
    `,
    allowedCommands: ['commit', 'status', 'log'],
    hints: [
      'git commit -m "メッセージ" の形式で実行します',
      'コミットメッセージは何でも構いません',
      '例: git commit -m "Add greeting message"',
    ],
    successMessage: 'コミットに成功しました！',
    validationRules: [
      { type: 'commit-made' },
    ],
  },
  // Step 6: git push
  {
    id: 6,
    stage: 'terminal',
    title: 'Step 6: リモートにプッシュ',
    description: 'ローカルの変更をリモートリポジトリにプッシュします',
    detailedInstructions: `
## git push

ローカルのコミットをリモートリポジトリにプッシュしましょう。

\`\`\`bash
git push origin feature/add-greeting
\`\`\`

これで、あなたの変更がリモートリポジトリに反映されます！
    `,
    allowedCommands: ['push', 'status'],
    hints: [
      'git push origin <ブランチ名> の形式で実行します',
      'ブランチ名は feature/add-greeting です',
      '正しいコマンド: git push origin feature/add-greeting',
    ],
    successMessage: 'プッシュに成功しました！ターミナルステージをクリアしました！',
    validationRules: [
      { type: 'pushed' },
    ],
  },
];

// GUI stage steps (Step 2-1 to 6-1)
export const GUI_TUTORIAL_STEPS: StepConfig[] = [
  // Step 2-1: Create branch (GUI)
  {
    id: 21,
    stage: 'gui',
    title: 'Step 2: 新しいブランチを作成（GUI）',
    description: 'GUIを使ってブランチを作成します',
    detailedInstructions: `
## ブランチの作成（GUI操作）

今度は、コマンドではなくGUIを使って操作してみましょう。

1. 下部のステータスバーにあるブランチ名（main）をクリック
2. 「新しいブランチを作成」を選択
3. ブランチ名を入力: feature/gui-test
4. Enterキーを押して確定

VS Codeと同じ操作でブランチを作成できます！
    `,
    allowedCommands: [],
    allowedGuiActions: ['create-branch', 'switch-branch'],
    hints: [
      'ステータスバーのブランチ名をクリックしてください',
      'ブランチ名は feature/gui-test にしてください',
    ],
    successMessage: 'GUIでブランチを作成できました！',
    validationRules: [
      { type: 'branch-created', target: 'feature/gui-test' },
      { type: 'branch-switched', target: 'feature/gui-test' },
    ],
  },
  // Step 3-1: Edit file (GUI)
  {
    id: 31,
    stage: 'gui',
    title: 'Step 3: ファイルを編集（GUI）',
    description: 'エディタでファイルを編集します',
    detailedInstructions: `
## ファイルの編集（GUI操作）

エディタを使ってファイルを編集しましょう。

1. 左側のエクスプローラーから greeting.txt をクリック
2. 中央のエディタで内容を編集
3. 「Hello, Git Quest!」と入力

編集すると、左側のソース管理に変更が表示されます。
    `,
    allowedCommands: [],
    allowedGuiActions: ['edit-file'],
    hints: [
      'エクスプローラーから greeting.txt を開いてください',
      '"Hello, Git Quest!" と入力してください',
    ],
    successMessage: 'ファイルの編集が完了しました！',
    validationRules: [
      { type: 'file-content', target: 'greeting.txt', expectedValue: 'Hello, Git Quest!' },
    ],
  },
  // Step 4-1: git add (GUI)
  {
    id: 41,
    stage: 'gui',
    title: 'Step 4: 変更をステージング（GUI）',
    description: 'GUIでファイルをステージングします',
    detailedInstructions: `
## ステージング（GUI操作）

変更をステージングエリアに追加しましょう。

1. 左側のソース管理アイコンをクリック
2. 「変更」セクションで greeting.txt の横にある「+」ボタンをクリック

ファイルが「ステージ済み」セクションに移動します。
    `,
    allowedCommands: [],
    allowedGuiActions: ['stage-file'],
    hints: [
      'ソース管理ビューを開いてください',
      'ファイルの横の「+」ボタンをクリックしてください',
    ],
    successMessage: 'GUIでステージングできました！',
    validationRules: [
      { type: 'file-staged', target: 'greeting.txt' },
    ],
  },
  // Step 5-1: git commit (GUI)
  {
    id: 51,
    stage: 'gui',
    title: 'Step 5: 変更をコミット（GUI）',
    description: 'GUIでコミットします',
    detailedInstructions: `
## コミット（GUI操作）

ステージングした変更をコミットしましょう。

1. コミットメッセージ入力欄に「Add greeting with GUI」と入力
2. 「✓ コミット」ボタンをクリック

コミットが完了すると、コミット履歴に表示されます。
    `,
    allowedCommands: [],
    allowedGuiActions: ['commit'],
    hints: [
      'コミットメッセージを入力してください',
      'コミットボタンをクリックしてください',
    ],
    successMessage: 'GUIでコミットできました！',
    validationRules: [
      { type: 'commit-made' },
    ],
  },
  // Step 6-1: git push (GUI)
  {
    id: 61,
    stage: 'gui',
    title: 'Step 6: リモートにプッシュ（GUI）',
    description: 'GUIでプッシュします',
    detailedInstructions: `
## プッシュ（GUI操作）

最後に、リモートにプッシュしましょう。

1. コミット後、「コミット」ボタンが「プッシュ」ボタンに変わります
2. 「プッシュ」ボタンをクリック

おめでとうございます！すべてのチュートリアルを完了しました！
    `,
    allowedCommands: [],
    allowedGuiActions: ['push'],
    hints: [
      'プッシュボタンをクリックしてください',
    ],
    successMessage: 'おめでとうございます！すべてのチュートリアルを完了しました！',
    validationRules: [
      { type: 'pushed' },
    ],
  },
];
