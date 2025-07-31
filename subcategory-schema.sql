-- サブカテゴリテーブルの作成
CREATE TABLE subcategories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- サブカテゴリのRLSポリシー
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のサブカテゴリのみアクセス可能
CREATE POLICY "Users can view own subcategories" ON subcategories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subcategories" ON subcategories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subcategories" ON subcategories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own subcategories" ON subcategories
  FOR DELETE USING (auth.uid() = user_id);

-- transactionsテーブルにサブカテゴリIDカラムを追加
ALTER TABLE transactions ADD COLUMN subcategory_id UUID REFERENCES subcategories(id) ON DELETE SET NULL;

-- インデックスの追加（パフォーマンス向上）
CREATE INDEX idx_subcategories_user_id ON subcategories(user_id);
CREATE INDEX idx_subcategories_category_id ON subcategories(category_id);
CREATE INDEX idx_transactions_subcategory_id ON transactions(subcategory_id);

-- updated_atの自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_subcategories_updated_at BEFORE UPDATE ON subcategories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- デフォルトサブカテゴリを作成する関数
CREATE OR REPLACE FUNCTION create_default_subcategories_for_user(target_user_id UUID)
RETURNS void AS $$
BEGIN
  -- 支出カテゴリのサブカテゴリ
  INSERT INTO subcategories (user_id, category_id, name, is_default)
  SELECT 
    target_user_id,
    c.id,
    subcategory_name,
    true
  FROM categories c
  CROSS JOIN (
    VALUES 
      ('食費', '外食'),
      ('食費', '食材'),
      ('食費', 'お弁当'),
      ('食費', 'お菓子・飲み物'),
      ('交通費', '電車'),
      ('交通費', 'バス'),
      ('交通費', 'タクシー'),
      ('交通費', 'ガソリン'),
      ('娯楽費', '映画・動画'),
      ('娯楽費', 'ゲーム'),
      ('娯楽費', 'スポーツ'),
      ('娯楽費', '読書'),
      ('日用品', '洗剤・掃除用品'),
      ('日用品', 'ティッシュ・トイレットペーパー'),
      ('日用品', 'バス・シャンプー'),
      ('光熱費', '電気代'),
      ('光熱費', 'ガス代'),
      ('光熱費', '水道代'),
      ('通信費', '携帯電話'),
      ('通信費', 'インターネット'),
      ('通信費', 'サブスクリプション'),
      ('医療費', '病院'),
      ('医療費', '薬局'),
      ('医療費', '健康診断'),
      ('教育費', '書籍'),
      ('教育費', 'オンライン学習'),
      ('教育費', 'セミナー・講座'),
      ('衣類', '洋服'),
      ('衣類', '靴'),
      ('衣類', 'アクセサリー'),
      ('その他支出', 'プレゼント'),
      ('その他支出', '寄付'),
      ('給与', '基本給'),
      ('給与', '残業代'),
      ('給与', 'ボーナス'),
      ('給与', '交通費支給'),
      ('副収入', 'フリーランス'),
      ('副収入', 'アルバイト'),
      ('副収入', '投資収益'),
      ('その他収入', 'お祝い金'),
      ('その他収入', '還付金'),
      ('その他収入', 'ポイント・キャッシュバック')
  ) AS default_subs(category_name, subcategory_name)
  WHERE c.user_id = target_user_id 
    AND c.name = default_subs.category_name
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- 削除されたデフォルトサブカテゴリを記録するテーブル
CREATE TABLE deleted_default_subcategories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subcategory_name TEXT NOT NULL,
  category_id UUID NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE deleted_default_subcategories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own deleted default subcategories" ON deleted_default_subcategories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own deleted default subcategories" ON deleted_default_subcategories
  FOR INSERT WITH CHECK (auth.uid() = user_id);