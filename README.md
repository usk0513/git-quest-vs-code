# Git Quest

Gitの操作を学べるインタラクティブWebアプリケーション

## 📖 概要

Git Questは、Gitの基本的な操作をブラウザ上で学習できる教育用アプリケーションです。VS Codeのような親しみやすいインターフェースで、実際にGitコマンドを実行しながら学べます。

### 特徴

- 🖥️ **VS Codeライクなインターフェース**: 使い慣れたエディタ風のUIで学習
- 💻 **ターミナル操作**: 実際のGitコマンドを入力して学習
- 🖱️ **GUI操作**: VS Codeのような画面操作でもGitを学習可能
- 📚 **ステップバイステップ**: 初心者でも段階的に学べるチュートリアル
- ✅ **リアルタイムフィードバック**: 各ステップで正しい操作をガイド
- 🔄 **いつでもリセット**: 何度でもやり直せる学習環境

### 対応ブラウザ

スタイルに使っている Tailwind CSS 4 の要件に合わせて、次のバージョン以降を対象にしています。

- **Chrome / Edge**: 111 以降
- **Safari**（iPhone・iPad を含む）: 16.4 以降
- **Firefox**: 128 以降

Tailwind CSS 4 は `@layer`、`@property`、`color-mix()` などの新しい CSS 機能を使うため、これより古いブラウザでは色や影などの表示が崩れることがあります。

## 🚀 起動方法

### 必要な環境

- **Node.js**: 24.x（LTS）
- **npm**: 11.10 以上（Node.js 24 に同梱。`.npmrc` の `min-release-age` に必要）

### インストール・起動手順

1. **リポジトリをクローン**

   ```bash
   git clone https://github.com/yourusername/git-quest-vs-code.git
   cd git-quest-vs-code
   ```

2. **依存関係をインストール**

   ```bash
   npm ci
   ```

   `npm ci` は `package-lock.json` に固定されたバージョンをそのままインストールします。

3. **開発サーバーを起動**

   ```bash
   npm run dev
   ```

4. **ブラウザでアクセス**

   ```
   http://localhost:5173
   ```

   ブラウザが自動的に開かない場合は、上記のURLに手動でアクセスしてください。

### その他のコマンド

```bash
# 本番用ビルド
npm run build

# ビルドしたアプリをプレビュー
npm run preview

# テストを実行
npm run test

# カバレッジ付きでテスト
npm run test:coverage

# リント（Biome。エラーと警告が0件であることを確認）
npm run lint

# 型チェック（アプリ・設定ファイル・テスト。npm run build でも実行される）
npm run typecheck
```

### 依存パッケージの取得とセキュリティ設定

リポジトリ直下の `.npmrc` で、パッケージの取得方法を次のように設定しています。

```ini
registry=https://npm.flatt.tech/
min-release-age=7
```

- **`registry`（Takumi Guard）**：すべてのパッケージを [Takumi Guard](https://shisho.dev/docs/ja/t/guard/quickstart/npm/) 経由で取得します。既知の悪意あるパッケージは `403 Forbidden` で拒否されます。認証は不要です（匿名モード）。
- **`min-release-age=7`**：`npm install` や `npm update` で新しいバージョンを選ぶとき、公開から7日以上経ったものだけを使います。公開直後に乗っ取られた版を避けるための設定です。`npm ci` は `package-lock.json` に固定された版をそのまま使うので、この設定の影響を受けません。

#### 公開から7日未満のセキュリティ修正を入れる場合

修正版が公開から7日経っていない場合、通常の `npm install` では選ばれません（`ETARGET` エラーになります）。急ぐ場合は、その1回だけ設定を外して入れ、理由を Pull Request に記録してください。

```bash
npm install <パッケージ>@<修正版> --min-release-age=0
```

`.npmrc` の `min-release-age-exclude` に恒久的に登録するのは避けてください。

#### `package-lock.json` の取得元

`.npmrc` を設定した状態で依存を追加・更新すると、そのエントリの `resolved` には `https://npm.flatt.tech/` が記録されます（npm 11.15 以降の仕様）。既存の `https://registry.npmjs.org/` のエントリと混在していても、問題なく動作します。

#### インストールが `403 Forbidden` になった場合

Takumi Guard が、そのパッケージを悪意あるものとしてブロックしています。設定を外して回避せず、該当するパッケージとバージョンを調べてください。

#### Takumi Guard の利用をやめる場合

1. `.npmrc` から `registry=` の行を削除する
2. `package-lock.json` の `resolved` にある `https://npm.flatt.tech/` を `https://registry.npmjs.org/` に置き換える（パスと `integrity` は同じなので、そのまま置き換えられます）
3. `.github/dependabot.yml` から `registries` の設定を削除する
4. `.github/workflows/ci.yml` の「Check npm configuration」で、`npm config get registry` の比較先を `https://registry.npmjs.org/` に変更する（変更しないと、CI がこの確認で失敗します。`min-release-age` の確認はそのまま残します）

#### CI での確認

Pull Request と `main` へのデプロイでは、`.github/workflows/ci.yml` が次を確認します。

- `.npmrc` の設定が反映されていること
- `npm ci`、リント（Biome）、ビルド、カバレッジ付きテストが成功すること
- 本番依存に既知の脆弱性がないこと（`npm audit --omit=dev`）
- レジストリ署名を検証できること（`npm audit signatures`）

## 📚 使い方

### ファーストステージ: ターミナルベース

1. アプリを起動すると、**Step 0**（初期状態）から始まります
2. 右側のペインに表示される指示を読んでください
3. 下部のターミナルに、指示に従ってGitコマンドを入力します
4. コマンドが正しければ、次のステップに自動的に進みます
5. 間違ったコマンドを入力すると、ヒントが表示されます

**学習するコマンド:**
- `git clone` - リポジトリのクローン
- `git checkout -b` - ブランチの作成と切り替え
- `git add` - 変更のステージング
- `git commit` - コミットの作成
- `git push` - リモートへのプッシュ

### セカンドステージ: GUIベース

ターミナルステージをクリアすると、VS Codeのような画面操作で同じことを学習できます：

- **左サイドバー**: ファイルの確認やソース管理
- **中央エディタ**: ファイルの編集
- **ステージング**: 変更ファイルの「+」ボタンをクリック
- **コミット**: メッセージを入力して「コミット」ボタン
- **プッシュ**: 「プッシュ」ボタンをクリック

### リセット機能

- GUIステージの最終ステップでも案内されるとおり、ページをリロードして最初からやり直すこともできます

## 🛠️ 技術スタック

### フロントエンド
- **React 18** - UIライブラリ
- **TypeScript** - 型安全な開発
- **Vite** - 高速ビルドツール
- **Tailwind CSS 4** - スタイリング（VS Code Light Modernテーマ。テーマは `src/styles/index.css` の `@theme` で定義）
- **Zustand** - 状態管理

### Git実装
- **isomorphic-git** - ブラウザで動作するGit実装
- **LightningFS** - ブラウザ内の仮想ファイルシステム

### テスト
- **Vitest** - ユニット・統合テスト
- **React Testing Library** - コンポーネントテスト

## 📁 プロジェクト構造

```
src/
├── components/          # UIコンポーネント
│   ├── Layout/          # レイアウト関連
│   ├── SourceControl/   # ソース管理ビュー
│   ├── Explorer/        # ファイルエクスプローラー
│   └── Common/          # 共通コンポーネント
├── services/            # ビジネスロジック
│   ├── git/             # Git操作サービス
│   ├── terminal/        # ターミナル・コマンド処理
│   ├── filesystem/      # ファイルシステム
│   └── tutorial/        # チュートリアル管理
├── store/               # Zustand状態管理
├── utils/               # 共通ユーティリティ
├── types/               # TypeScript型定義
├── constants/           # 定数・初期データ
└── styles/              # グローバルスタイル
tests/
├── unit/                # ユニットテスト
├── integration/         # 統合テスト
├── components/          # コンポーネントテスト
├── fixtures/            # テスト用フィクスチャ
└── setup/               # Vitestセットアップ
```

## 🎯 学習の流れ

### ターミナルステージ（Step 1〜6）

| ステップ | 内容 | 学ぶこと |
|---------|------|---------|
| Step 0 | 初期状態 | チュートリアルの説明 |
| Step 1 | `git clone` | リポジトリのクローン |
| Step 2 | `git checkout -b` | ブランチの作成と切り替え |
| Step 3 | ファイル編集 | エディタの使い方 |
| Step 4 | `git add` | 変更のステージング |
| Step 5 | `git commit` | コミットの作成 |
| Step 6 | `git push` | リモートへのプッシュ |

### GUIステージ（Step 2-1〜6-2）

ターミナルステージと同じ操作を、VS Codeのような画面操作で学習します。各アクションの後に確認ステップを挟み、画面の状態をしっかり把握できるようになりました。

| ステップ | 内容 |
|---------|------|
| Step 2-1 | GUIで新しいブランチを作成 |
| Step 2-2 | ステータスバーでブランチ変更を確認 |
| Step 3-1 | `greeting.txt` を編集 |
| Step 3-2 | ソース管理ビューに変更が表示されたことを確認 |
| Step 4-1 | GUIでステージング |
| Step 5-1 | GUIでコミット |
| Step 6-1 | GUIでプッシュ |
| Step 6-2 | リモートブランチ一覧を確認し、完了後はリロードで再挑戦 |

## 🐛 トラブルシューティング

### 開発サーバーが起動しない

```bash
# node_modulesを削除して再インストール
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### ブラウザでエラーが表示される

- ブラウザのコンソール（F12キー）を開いてエラーを確認
- ページをリロード（Ctrl+R / Cmd+R）してみる
- リセットボタンを押してみる

### アプリが正常に動作しない

1. ブラウザのキャッシュをクリア
2. ページをリロード
3. 別のブラウザで試す（Chrome、Firefox、Edgeを推奨）

## 🤝 コントリビューション

プルリクエストを歓迎します！バグ報告や機能リクエストは、GitHubのIssuesからお願いします。

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 🙏 謝辞

- [isomorphic-git](https://isomorphic-git.org/) - ブラウザで動作するGit実装
- [VS Code](https://code.visualstudio.com/) - UIインスピレーション
- [Tailwind CSS](https://tailwindcss.com/) - スタイリングフレームワーク

---

**Git Questで、楽しくGitを学びましょう！** 🎉
