-- サブカテゴリ機能を完全に削除するSQL

-- transactionsテーブルからsubcategory_idカラムを削除
ALTER TABLE transactions DROP COLUMN IF EXISTS subcategory_id;

-- サブカテゴリテーブルを削除
DROP TABLE IF EXISTS subcategories;

-- 削除されたデフォルトサブカテゴリテーブルを削除
DROP TABLE IF EXISTS deleted_default_subcategories;

-- サブカテゴリ用の関数を削除
DROP FUNCTION IF EXISTS create_default_subcategories_for_user(UUID);

-- サブカテゴリ用のインデックスを削除（既に削除されているはずですが念のため）
DROP INDEX IF EXISTS idx_subcategories_user_id;
DROP INDEX IF EXISTS idx_subcategories_category_id;
DROP INDEX IF EXISTS idx_transactions_subcategory_id;