import { createClient } from '@/lib/supabase/client'

interface DefaultSubcategory {
  categoryName: string
  subcategoryName: string
  type: 'income' | 'expense'
}

// デフォルトサブカテゴリの定義
const DEFAULT_SUBCATEGORIES: DefaultSubcategory[] = [
  // 支出カテゴリのサブカテゴリ
  { categoryName: '食費', subcategoryName: '外食', type: 'expense' },
  { categoryName: '食費', subcategoryName: '食材', type: 'expense' },
  { categoryName: '食費', subcategoryName: 'お弁当', type: 'expense' },
  { categoryName: '食費', subcategoryName: 'お菓子・飲み物', type: 'expense' },
  
  { categoryName: '交通費', subcategoryName: '電車', type: 'expense' },
  { categoryName: '交通費', subcategoryName: 'バス', type: 'expense' },
  { categoryName: '交通費', subcategoryName: 'タクシー', type: 'expense' },
  { categoryName: '交通費', subcategoryName: 'ガソリン', type: 'expense' },
  
  { categoryName: '娯楽費', subcategoryName: '映画・動画', type: 'expense' },
  { categoryName: '娯楽費', subcategoryName: 'ゲーム', type: 'expense' },
  { categoryName: '娯楽費', subcategoryName: 'スポーツ', type: 'expense' },
  { categoryName: '娯楽費', subcategoryName: '読書', type: 'expense' },
  
  { categoryName: '日用品', subcategoryName: '洗剤・掃除用品', type: 'expense' },
  { categoryName: '日用品', subcategoryName: 'ティッシュ・トイレットペーパー', type: 'expense' },
  { categoryName: '日用品', subcategoryName: 'バス・シャンプー', type: 'expense' },
  
  { categoryName: '光熱費', subcategoryName: '電気代', type: 'expense' },
  { categoryName: '光熱費', subcategoryName: 'ガス代', type: 'expense' },
  { categoryName: '光熱費', subcategoryName: '水道代', type: 'expense' },
  
  { categoryName: '通信費', subcategoryName: '携帯電話', type: 'expense' },
  { categoryName: '通信費', subcategoryName: 'インターネット', type: 'expense' },
  { categoryName: '通信費', subcategoryName: 'サブスクリプション', type: 'expense' },
  
  { categoryName: '医療費', subcategoryName: '病院', type: 'expense' },
  { categoryName: '医療費', subcategoryName: '薬局', type: 'expense' },
  { categoryName: '医療費', subcategoryName: '健康診断', type: 'expense' },
  
  { categoryName: '教育費', subcategoryName: '書籍', type: 'expense' },
  { categoryName: '教育費', subcategoryName: 'オンライン学習', type: 'expense' },
  { categoryName: '教育費', subcategoryName: 'セミナー・講座', type: 'expense' },
  
  { categoryName: '衣類', subcategoryName: '洋服', type: 'expense' },
  { categoryName: '衣類', subcategoryName: '靴', type: 'expense' },
  { categoryName: '衣類', subcategoryName: 'アクセサリー', type: 'expense' },
  
  { categoryName: 'その他支出', subcategoryName: 'プレゼント', type: 'expense' },
  { categoryName: 'その他支出', subcategoryName: '寄付', type: 'expense' },
  
  // 収入カテゴリのサブカテゴリ
  { categoryName: '給与', subcategoryName: '基本給', type: 'income' },
  { categoryName: '給与', subcategoryName: '残業代', type: 'income' },
  { categoryName: '給与', subcategoryName: 'ボーナス', type: 'income' },
  { categoryName: '給与', subcategoryName: '交通費支給', type: 'income' },
  
  { categoryName: '副収入', subcategoryName: 'フリーランス', type: 'income' },
  { categoryName: '副収入', subcategoryName: 'アルバイト', type: 'income' },
  { categoryName: '副収入', subcategoryName: '投資収益', type: 'income' },
  
  { categoryName: 'その他収入', subcategoryName: 'お祝い金', type: 'income' },
  { categoryName: 'その他収入', subcategoryName: '還付金', type: 'income' },
  { categoryName: 'その他収入', subcategoryName: 'ポイント・キャッシュバック', type: 'income' },
]

export async function createDefaultSubcategoriesForUser(userId: string) {
  const supabase = createClient()
  
  try {
    // ユーザーの作成日時を確認（新規ユーザーのみデフォルトサブカテゴリを作成）
    const { data: profile } = await supabase
      .from('profiles')
      .select('created_at')
      .eq('id', userId)
      .single()

    if (!profile) return

    const createdAt = new Date(profile.created_at)
    const now = new Date()
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)

    // 5分以内に作成されたユーザーのみが対象
    if (createdAt < fiveMinutesAgo) return

    // ユーザーのカテゴリを取得
    const { data: categories } = await supabase
      .from('categories')
      .select('id, name, type')
      .eq('user_id', userId)

    if (!categories) return

    // カテゴリ名でマッピングを作成
    const categoryMap = new Map(
      categories.map(cat => [`${cat.name}-${cat.type}`, cat.id])
    )

    // デフォルトサブカテゴリを作成
    const subcategoriesToCreate = DEFAULT_SUBCATEGORIES
      .map(def => {
        const categoryId = categoryMap.get(`${def.categoryName}-${def.type}`)
        if (!categoryId) return null

        return {
          user_id: userId,
          category_id: categoryId,
          name: def.subcategoryName,
          is_default: true
        }
      })
      .filter(Boolean)

    if (subcategoriesToCreate.length > 0) {
      await supabase
        .from('subcategories')
        .insert(subcategoriesToCreate)
    }

  } catch (error) {
    console.error('Error creating default subcategories:', error)
  }
}

export async function checkAndCreateDefaultSubcategories() {
  const supabase = createClient()
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await createDefaultSubcategoriesForUser(user.id)
  } catch (error) {
    console.error('Error in checkAndCreateDefaultSubcategories:', error)
  }
}