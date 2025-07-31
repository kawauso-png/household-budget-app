-- 削除されたデフォルトカテゴリを記録するテーブル
CREATE TABLE deleted_default_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  category_name TEXT NOT NULL,
  category_type TEXT CHECK (category_type IN ('income', 'expense')) NOT NULL,
  deleted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, category_name, category_type)
);

-- インデックス
CREATE INDEX idx_deleted_default_categories_user_id ON deleted_default_categories(user_id);

-- RLS (Row Level Security) ポリシー
ALTER TABLE deleted_default_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own deleted categories" ON deleted_default_categories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own deleted categories" ON deleted_default_categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);