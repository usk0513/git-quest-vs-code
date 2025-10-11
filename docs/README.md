# Git Quest - ドキュメント

このディレクトリには、Git Questアプリケーションの仕様・設計・実装に関するドキュメントが含まれています。

## 📚 ドキュメント一覧

### 仕様書（Specifications）

- **[要件定義書](./specifications/requirements.md)** - プロジェクトの目的、機能要件、非機能要件

### 設計書（Design）

- **[アーキテクチャ設計書](./design/architecture.md)** - システム全体のアーキテクチャ、サービス層設計、データフロー
- **[テスト戦略・設計書](./design/test-strategy.md)** - テスト戦略、ユニット/統合/E2Eテストの設計

### 実装（Implementation）

- **[実装ガイド](./implementation/implementation-guide.md)** - 段階的な実装手順、コード例、注意点

## 🎯 ドキュメントの読み方

### 初めての方
1. **[要件定義書](./specifications/requirements.md)** を読んで、プロジェクトの全体像を理解
2. **[アーキテクチャ設計書](./design/architecture.md)** で技術的な設計を把握
3. **[実装ガイド](./implementation/implementation-guide.md)** を参照しながら開発開始

### 開発者
- 機能追加時: [アーキテクチャ設計書](./design/architecture.md) でサービス層の依存関係を確認
- テスト追加時: [テスト戦略・設計書](./design/test-strategy.md) でテストケースを参照
- バグ修正時: [実装ガイド](./implementation/implementation-guide.md) のよくある間違いを確認

### レビュアー
- [要件定義書](./specifications/requirements.md) で仕様の妥当性を確認
- [アーキテクチャ設計書](./design/architecture.md) で設計の一貫性を確認

## 📖 主要な概念

### サービス層アーキテクチャ

Git Questは、サービス指向アーキテクチャを採用しています：

```
UIコンポーネント
  ↓
状態管理（Zustand）
  ↓
サービス層（TutorialService, GitService等）
  ↓
外部ライブラリ（isomorphic-git, LightningFS）
```

詳細は [アーキテクチャ設計書](./design/architecture.md) を参照してください。

### チュートリアルの進行

チュートリアルは「コマンド実行 → バリデーション → ステップ検証 → 自動進行」のフローで進みます。

詳細は [要件定義書](./specifications/requirements.md) の「学習フロー仕様」を参照してください。

### テスト戦略

ユニットテスト、統合テスト、コンポーネントテスト、E2Eテストの4レベルでテストを実施します。

詳細は [テスト戦略・設計書](./design/test-strategy.md) を参照してください。

## 🔗 関連ドキュメント

- **[README.md](../README.md)** - プロジェクトの概要と起動方法
- **[CLAUDE.md](../CLAUDE.md)** - AI アシスタント向けのガイドライン

## 📝 ドキュメントの更新

ドキュメントは実装の進捗に合わせて更新してください：

1. 新しい機能を追加する際は、要件定義書と設計書を更新
2. アーキテクチャを変更する際は、必ずアーキテクチャ設計書を更新
3. 新しいテストパターンを追加する際は、テスト戦略書を更新

## 🤝 貢献

ドキュメントの改善提案や誤字の修正は、GitHubのPull Requestでお願いします。

---

**最終更新:** 2025年10月
