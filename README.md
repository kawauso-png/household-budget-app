# 家計簿アプリ

Next.js + Supabaseで構築されたシンプルな家計簿アプリケーション

## セットアップ手順

### 1. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com)にアクセスしてアカウントを作成
2. 新しいプロジェクトを作成
3. プロジェクトのURLとanon keyを取得

### 2. 環境変数の設定

`.env.local.example`を`.env.local`にコピーして、Supabaseの認証情報を設定：

```bash
cp .env.local.example .env.local
```

`.env.local`ファイルを編集：
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. データベースのセットアップ

`database-schema.sql`の内容をSupabaseのSQL Editorで実行

### 4. 依存関係のインストールと起動

```bash
npm install
npm run dev
```

## 機能

### コア機能
- 収支の記録（収入・支出）
- カテゴリ管理
- 月次・年次レポート
- マルチデバイス対応

### 技術スタック
- **フロントエンド**: Next.js 15, React 19, TypeScript
- **スタイリング**: Tailwind CSS
- **バックエンド**: Supabase (認証, データベース, ストレージ)
- **データベース**: PostgreSQL 