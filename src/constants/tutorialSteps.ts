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
    autoAdvance: false,
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
git clone https://github.com/git-quest/sample-repo.git
\`\`\`

GitHubでは上記のようなHTTPS URLを指定してクローンします。
このチュートリアルでは、シミュレーション環境のため以下のコマンドを実行してください：

\`\`\`bash
git clone /remote-repo
\`\`\`

どちらも、リモートリポジトリの内容をローカルにコピーする操作です。
    `,
    allowedCommands: ['clone'],
    hints: [
      'git clone コマンドを使用します',
      '通常のGitHub操作では https://github.com/... の形式です',
      'この環境では git clone /remote-repo を実行してください',
    ],
    successMessage: 'クローンに成功しました！ワークスペースにファイルがコピーされました。',
    validationRules: [
      { type: 'file-exists', target: 'README.md' },
      { type: 'file-exists', target: 'greeting.txt' },
    ],
  },
  // Step 1 confirm
  {
    id: 2,
    stage: 'terminal',
    title: 'Step 1: クローン結果を確認',
    description: 'クローンしたファイルをUIで確認します',
    detailedInstructions: `
## クローン結果を確認

エクスプローラービュー(一番左の📁アイコン)を開き、\`README.md\` や \`greeting.txt\` が表示されているか確認しましょう。
リモートから取得したファイルがローカルに展開されていることがわかります。

必要に応じて \`git status\` や \`git branch\` を実行して、ワークスペースの状態を確認しても構いません。

確認が終わったら、右上の「次へ」ボタンを押して次のステップへ進んでください。
    `,
    allowedCommands: ['status', 'branch', 'log'],
    allowBranchCreation: false,
    hints: [
      'エクスプローラーに README.md や greeting.txt が表示されているか確認しましょう',
      'git status で作業ツリーがクリーンなことを確認できます',
      '確認できたら「次へ」を押して先に進みます',
    ],
    successMessage: 'エクスプローラーでファイルを確認したら「次へ」を押しましょう。',
    validationRules: [],
    autoAdvance: false,
  },
  // Step 2: Create branch
  {
    id: 3,
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
  // Step 2 confirm
  {
    id: 4,
    stage: 'terminal',
    title: 'Step 2: ブランチの状態を確認',
    description: 'ブランチが切り替わったことを確認します',
    detailedInstructions: `
## ブランチの状態を確認

ターミナルで \`git branch\` を実行するか、ステータスバーを見て現在のブランチが \`feature/add-greeting\` になっていることを確認しましょう。
エクスプローラーのファイルはまだ変更されていません。

確認できたら「次へ」を押して次に進みます。
    `,
    allowedCommands: ['branch', 'status', 'log'],
    allowBranchCreation: false,
    hints: [
      'git branch で現在のブランチを確認できます',
      'ステータスバーに表示されるブランチ名も確認してみましょう',
      '確認できたら「次へ」を押して先に進みます',
    ],
    successMessage: 'feature/add-greeting ブランチに切り替わっていることを確認できたら「次へ」を押してください。',
    validationRules: [],
    autoAdvance: false,
  },
  // Step 3: Edit file
  {
    id: 5,
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

編集が終わったら、右側の「編集内容をチェック」ボタンを押して変更が認識されているか確認しましょう。
    `,
    allowedCommands: ['status', 'diff'],
    requiresValidationButton: true,
    validationButtonLabel: '編集内容をチェック',
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
  // Step 3 confirm
  {
    id: 6,
    stage: 'terminal',
    title: 'Step 3: 変更内容を確認',
    description: 'ソース管理に編集内容が反映されたかを確認します',
    detailedInstructions: `
## 変更内容を確認

ソース管理ビューで \`greeting.txt\` が変更として表示されているか確認しましょう。
必要に応じて \`git diff\` で差分を確認しても構いません。

確認できたら「次へ」を押して次のステップに進みましょう。
    `,
    allowedCommands: ['status', 'diff'],
    hints: [
      'ソース管理ビューに greeting.txt が表示されているか確認してください',
      'git diff で変更内容の差分を確認できます',
      '確認できたら「次へ」を押して先に進みます',
    ],
    successMessage: '変更内容を確認できたら「次へ」を押して先に進みましょう。',
    validationRules: [],
    autoAdvance: false,
  },
  // Step 4: git add
  {
    id: 7,
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
  // Step 4 confirm
  {
    id: 8,
    stage: 'terminal',
    title: 'Step 4: ステージ状態を確認',
    description: 'ステージングされたファイルを確認します',
    detailedInstructions: `
## ステージ状態を確認

ソース管理ビューの「ステージ済みの変更」に \`greeting.txt\` が移動していることを確認します。
\`git status\` でもステージ済みのファイルを確認できます。

確認が終わったら「次へ」を押してください。
    `,
    allowedCommands: ['status'],
    hints: [
      'ステージ済みの変更に greeting.txt が表示されていることを確認してください',
      'git status でステージングされたファイルを再確認できます',
      '確認できたら「次へ」を押して先に進みます',
    ],
    successMessage: 'ステージ状態を確認できたら「次へ」を押して進みましょう。',
    validationRules: [],
    autoAdvance: false,
  },
  // Step 5: git commit
  {
    id: 9,
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
      { type: 'commit-made', expectedValue: 2 },
    ],
  },
  // Step 5 confirm
  {
    id: 10,
    stage: 'terminal',
    title: 'Step 5: コミット履歴を確認',
    description: 'コミットが反映されたことを確認します',
    detailedInstructions: `
## コミット履歴を確認

\`git log\` を実行して最新のコミットが追加されていることを確認しましょう。
ソース管理ビューでは変更がなくなっているはずです。

確認できたら「次へ」を押して進みます。
    `,
    allowedCommands: ['status', 'log'],
    hints: [
      'git log で最新のコミットが追加されたことを確認してください',
      'ソース管理ビューに変更が残っていないかをチェックしましょう',
      '確認できたら「次へ」を押して先に進みます',
    ],
    successMessage: 'コミットが履歴に追加されていることを確認したら「次へ」を押してください。',
    validationRules: [],
    autoAdvance: false,
  },
  // Step 6: git push
  {
    id: 11,
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
    successMessage: 'プッシュに成功しました！',
    validationRules: [
      { type: 'pushed' },
    ],
  },
  // Step 6 confirm
  {
    id: 12,
    stage: 'terminal',
    title: 'Step 6: プッシュ結果を確認',
    description: 'リモートへ反映されたことを確認します',
    detailedInstructions: `
## プッシュ結果を確認

ターミナルの出力や \`git status\` を確認し、リモートにプッシュが成功したことを確認しましょう。
\`git log\` を確認すると、最新のコミットがプッシュされたことがわかります。

確認が終わったら「次へ」を押してGUIステージに進みます。
    `,
    allowedCommands: ['status', 'log'],
    hints: [
      'push コマンドの出力に「new branch」などが表示されているか確認しましょう',
      'git status で作業ツリーがクリーンになっていることを確認してください',
      '確認できたら「次へ」を押してGUIステージに進みます',
    ],
    successMessage: 'プッシュの結果を確認できたら「次へ」を押してGUIステージへ進みましょう。',
    validationRules: [],
    autoAdvance: false,
  },
];

// GUI stage steps (Step 2-1 to 6-1)
export const GUI_TUTORIAL_STEPS: StepConfig[] = [
  // Step 1-1: Switch to main branch (GUI)
  {
    id: 20,
    stage: 'gui',
    title: 'Step 1: メインブランチに切り替え（GUI）',
    description: 'GUIを使ってメインブランチに戻ります',
    detailedInstructions: `
## ブランチの切り替え（GUI操作）

まずは作業ブランチからメインブランチに戻りましょう。

1. 画面上部中央のブランチメニュー（現在は feature/add-greeting）をクリック
2. 表示された一覧から main を選択

切り替え後、ステータスバーに main と表示されることを確認してください。
    `,
    allowedCommands: ['status', 'log', 'branch'],
    allowedGuiActions: ['switch-branch'],
    hints: [
      '画面上部中央のブランチ名をクリックして一覧を開きます',
      'main を選択するとメインブランチに切り替わります',
    ],
    successMessage: 'メインブランチに切り替わりました！',
    validationRules: [
      { type: 'branch-switched', target: 'main' },
    ],
    allowBranchCreation: false,
  },
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
    allowedCommands: ['status', 'log', 'branch'],
    allowBranchCreation: false,
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
    allowedCommands: ['status', 'log', 'branch'],
    allowBranchCreation: false,
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
    allowedCommands: ['status', 'log', 'branch'],
    allowBranchCreation: false,
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
    allowedCommands: ['status', 'log', 'branch'],
    allowBranchCreation: false,
    allowedGuiActions: ['commit'],
    hints: [
      'コミットメッセージを入力してください',
      'コミットボタンをクリックしてください',
    ],
    successMessage: 'GUIでコミットできました！',
    validationRules: [
      { type: 'commit-made', expectedValue: 3 },
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
    allowedCommands: ['status', 'log', 'branch'],
    allowBranchCreation: false,
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
