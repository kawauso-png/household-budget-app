# 本番環境デプロイガイド

## 🚀 簡単デプロイ（推奨）: Vercel

### 1. 事前準備
```bash
# コードをGitHubにアップロード
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/[your-username]/household-budget-app.git
git push -u origin main
```

### 2. Vercelでデプロイ
1. [Vercel](https://vercel.com) でアカウント作成
2. 「New Project」→ GitHubリポジトリ選択
3. 環境変数設定:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://muycqtyljhzrsfktpexu.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
   ```
4. Deploy

### 3. Supabase設定更新
1. Supabase Dashboard → Settings → Authentication
2. Site URL: `https://your-app.vercel.app`
3. Redirect URLs: `https://your-app.vercel.app/**`

## 📱 PWA化（スマホアプリ風）

アプリは既にPWA対応済みです：
- スマホのブラウザでアクセス
- 「ホーム画面に追加」でアプリ化
- オフライン対応（一部機能）

## 🔧 その他のデプロイ方法

### Netlify
1. [Netlify](https://netlify.com) でアカウント作成
2. GitHubリポジトリ連携
3. Build command: `npm run build`
4. Publish directory: `out`
5. 環境変数設定

### 自前サーバー
```bash
# プロダクションビルド
npm run build
npm start

# 永続化（PM2使用）
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## ✅ デプロイ後の確認項目

- [ ] ユーザー登録ができる
- [ ] ログイン・ログアウトができる
- [ ] 取引の登録・編集・削除ができる
- [ ] カテゴリ管理ができる
- [ ] ダッシュボードで期間指定ができる
- [ ] レスポンシブデザインが機能する
- [ ] PWA化でホーム画面追加ができる

## 🛠 トラブルシューティング

### 認証エラー
- SupabaseのSite URLとRedirect URLsを確認
- 環境変数が正しく設定されているか確認

### ビルドエラー
```bash
npm run build
```
でローカルでビルドテスト

### データベースエラー
- Supabaseのテーブルが全て作成されているか確認
- RLSポリシーが設定されているか確認

## 📊 パフォーマンス最適化

- 画像最適化済み
- コード分割済み
- PWAキャッシュ対応
- Gzip圧縮有効

## 🔐 セキュリティ

- 環境変数での認証情報管理
- Supabase RLS（行レベルセキュリティ）
- HTTPS強制（Vercel自動）
- CSP設定（Next.js標準）