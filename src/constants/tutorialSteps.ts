import { StepConfig } from '@/types';

export const TUTORIAL_STEPS: StepConfig[] = [
  // Step 0: Initial state
  {
    id: 0,
    stage: 'terminal',
    title: 'リモートリポジトリの確認',
    description: 'リモートリポジトリが存在する状態です',
    illustration: {
      src: 'https://i.gyazo.com/423a788d51d01e75474858d653ab6f6a.png',
      alt: 'ローカルは空でリモートリポジトリにのみファイルが存在している状態を示す図',
    },
    detailedInstructions: `
Git Questへようこそ！

このチュートリアルでは、Gitの基本的な操作を学びます。

現在、リモートリポジトリ（sample-repo）が存在している状態です。
これからこのリポジトリをローカルにクローンして、変更を加えていきます。

次のステップに進むには、下の「次へ」ボタンをクリックしてください。
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
    illustration: {
      src: 'https://i.gyazo.com/5335a6c080c4ff2de437cd4331bec189.png',
      alt: 'git clone によってリモートの内容をローカルに複製するイメージ図'
    },
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
    illustration: {
      src: 'https://i.gyazo.com/10585663cc21ef9b604ee203bd897755.png',
      alt: 'エクスプローラーで README.md と greeting.txt を確認するイメージ図'
    },
    detailedInstructions: `
## クローン結果を確認

エクスプローラービュー(一番左のフォルダーアイコン)を開き、\`README.md\` や \`greeting.txt\` が表示されているか確認しましょう。
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
    illustration: {
      src: 'https://i.gyazo.com/2d8c7c6f7d2f553748109b854b2d6763.png',
      alt: 'ブランチ作成と切り替えの状態を示す図'
    },
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
    illustration: {
      src: 'https://i.gyazo.com/20b07aff6619a7b921f136c5ed6cd2be.png',
      alt: 'ブランチ状態を確認している画面の図'
    },
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
    illustration: {
      src: 'https://i.gyazo.com/36c2ba65e5232e3e8db53316c834449b.png',
      alt: 'エディタで greeting.txt を編集している図'
    },
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
    illustration: {
      src: 'https://i.gyazo.com/1db77c4292475662cc2bcfe35065bd36.png',
      alt: 'git status で変更内容を確認するイメージ図'
    },
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
    illustration: {
      src: 'https://i.gyazo.com/8d09e2b90513c0b1c880269cb1b749ce.png',
      alt: 'ソース管理ビューで変更をステージングしているイメージ図'
    },
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
    illustration: {
      src: 'https://i.gyazo.com/ffca3315e83415dfec1fe94e15c6c37d.png',
      alt: 'ステージ済みのファイルを確認している画面の図'
    },
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
    illustration: {
      src: 'https://i.gyazo.com/3bb0d6e18bef260e519e965ae6f1e794.png',
      alt: 'コミットメッセージ入力とコミット操作のイメージ図'
    },
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
    illustration: {
      src: 'https://i.gyazo.com/e70ffc30fb288a2d299293c56a79444d.png',
      alt: 'コミット履歴を確認する画面の図'
    },
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
    illustration: {
      src: 'https://i.gyazo.com/592d528d48c1ab20ba49835f7335096f.png',
      alt: 'リモートへプッシュする操作を示す図'
    },
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
    illustration: {
      src: 'https://i.gyazo.com/12f77f174b9dc3307e29645237799dd7.png',
      alt: 'リモートへの反映を確認している画面の図'
    },
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
    illustration: {
      src: 'https://i.gyazo.com/ba5030838bfd99f76144c4d42aaa7647.png',
      alt: 'ステータスバーから main ブランチを選択する図',
    },
    detailedInstructions: `
## ブランチの切り替え（GUI操作）

まずは作業ブランチからメインブランチに戻りましょう。

1. 画面左下のブランチ名（現在は feature/add-greeting）をクリック
2. 画面中央に表示されるブランチメニューから main を選択

選択するとメインブランチに切り替わります。
    `,
    allowedCommands: ['status', 'log', 'branch'],
    allowedGuiActions: ['switch-branch'],
    hints: [
      '画面左下のブランチ名をクリックして一覧を開きます',
      '表示されたメニューから main を選択します',
    ],
    successMessage: 'メインブランチに切り替わりました！',
    validationRules: [
      { type: 'branch-switched', target: 'main' },
    ],
    allowBranchCreation: false,
  },
  {
    id: 21,
    stage: 'gui',
    title: 'Step 1: メインブランチを確認（GUI）',
    description: 'ステータスバーが main になっていることを確認します',
    illustration: {
      src: 'https://i.gyazo.com/558594a0afa7dc02c7a2e1dc57928ed4.png',
      alt: 'ステータスバーに main と表示されていることを確認する図',
    },
    detailedInstructions: `
## 切り替え結果の確認

ステータスバー左下のブランチ名が main になっているか確認しましょう。
必要に応じて \`git branch\` を実行して、現在のブランチが main であることを確かめても構いません。

確認できたら、右上の「次へ」ボタンで次のステップへ進みましょう。
    `,
    allowedCommands: ['status', 'log', 'branch'],
    hints: [
      'ステータスバーに main と表示されているか確認してください',
      'greeting.txt が空の状態に戻っているか確認してください',
    ],
    successMessage: 'main ブランチにいることを確認できました！',
    validationRules: [],
    allowBranchCreation: false,
    autoAdvance: false,
  },
  // Step 2-1: Create branch (GUI)
  {
    id: 22,
    stage: 'gui',
    title: 'Step 2: 新しいブランチを作成（GUI）',
    description: 'GUIを使ってブランチを作成します',
    illustration: {
      src: 'https://i.gyazo.com/ba5030838bfd99f76144c4d42aaa7647.png',
      alt: 'GUIから新しいブランチを作成する様子を示す図'
    },
    detailedInstructions: `
## ブランチの作成（GUI操作）

今度は、コマンドではなくGUIを使って操作してみましょう。

1. 画面左下のブランチ名（main）をクリック
2. 画面中央に表示されるメニューで「+ 新しいブランチの作成...」を選択
3. ブランチ名を入力: feature/gui-test
4. Enterキーを押して確定

VS Codeと同じ操作でブランチを作成できます！
    `,
    allowedCommands: ['status', 'log', 'branch'],
    allowBranchCreation: false,
    allowedGuiActions: ['create-branch', 'switch-branch'],
    hints: [
      '画面左下のブランチ名をクリックしてください',
      'メニューから「+ 新しいブランチの作成...」を選んで feature/gui-test と入力してください',
    ],
    successMessage: 'GUIでブランチを作成できました！',
    validationRules: [
      { type: 'branch-created', target: 'feature/gui-test' },
      { type: 'branch-switched', target: 'feature/gui-test' },
    ],
    requiresValidationButton: true,
    validationButtonLabel: 'ブランチを作成したことを確認',
    autoAdvance: true,
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
    requiresValidationButton: true,
    validationButtonLabel: '編集内容をチェック',
    autoAdvance: true,
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
    autoAdvance: true,
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
      { type: 'commit-made', expectedValue: 2 },
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
