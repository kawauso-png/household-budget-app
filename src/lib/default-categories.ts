import { createClient } from '@/lib/supabase/client'
import { TransactionType } from '@/lib/types'

export interface DefaultCategory {
  name: string
  type: TransactionType
}

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  // 支出カテゴリ
  { name: '食費', type: 'expense' },
  { name: '日用品', type: 'expense' },
  { name: '交通費', type: 'expense' },
  { name: '光熱費', type: 'expense' },
  { name: '住居費', type: 'expense' },
  { name: '医療費', type: 'expense' },
  { name: '教育費', type: 'expense' },
  { name: '娯楽費', type: 'expense' },
  { name: 'その他', type: 'expense' },
  
  // 収入カテゴリ
  { name: '給与', type: 'income' },
  { name: '賞与', type: 'income' },
  { name: 'その他収入', type: 'income' },
]

export async function ensureDefaultCategories(userId: string) {
  const supabase = createClient()
  
  try {
    // ユーザーがいつ作成されたかをチェック（新規ユーザーかどうかの判定）
    const { data: profile } = await supabase
      .from('profiles')
      .select('created_at')
      .eq('id', userId)
      .single()
    
    if (!profile) {
      console.log('Profile not found, skipping default category creation')
      return
    }
    
    // プロファイル作成から5分以内なら新規ユーザーとみなす
    const profileCreatedAt = new Date(profile.created_at)
    const now = new Date()
    const isNewUser = (now.getTime() - profileCreatedAt.getTime()) < 5 * 60 * 1000 // 5分
    
    if (!isNewUser) {
      console.log('Not a new user, skipping default category creation')
      return
    }
    
    // 既存のデフォルトカテゴリを取得
    const { data: existingCategories } = await supabase
      .from('categories')
      .select('name, type')
      .eq('user_id', userId)
      .eq('is_default', true)
    
    const existingSet = new Set(
      existingCategories?.map(cat => `${cat.name}_${cat.type}`) || []
    )
    
    // 不足しているデフォルトカテゴリを特定
    const missingCategories = DEFAULT_CATEGORIES.filter(
      defaultCat => !existingSet.has(`${defaultCat.name}_${defaultCat.type}`)
    )
    
    // 不足しているカテゴリを作成（新規ユーザーのみ）
    if (missingCategories.length > 0) {
      const categoriesToInsert = missingCategories.map(cat => ({
        user_id: userId,
        name: cat.name,
        type: cat.type,
        is_default: true,
      }))
      
      const { error } = await supabase
        .from('categories')
        .insert(categoriesToInsert)
      
      if (error) {
        console.error('Error creating default categories:', error)
      } else {
        console.log(`Created ${missingCategories.length} default categories for new user`)
      }
    }
  } catch (error) {
    console.error('Error in ensureDefaultCategories:', error)
  }
}

export async function recordDeletedDefaultCategory(userId: string, categoryName: string, categoryType: TransactionType) {
  const supabase = createClient()
  
  try {
    const { error } = await supabase
      .from('deleted_default_categories')
      .insert({
        user_id: userId,
        category_name: categoryName,
        category_type: categoryType,
      })
    
    if (error) {
      // 23505は重複エラー（既に記録済み）、42P01はテーブルが存在しないエラー
      if (error.code === '23505') {
        console.log(`Category ${categoryName} already recorded as deleted for user`)
      } else if (error.code === '42P01') {
        console.warn('deleted_default_categories table does not exist. Please run the database migration.')
      } else {
        console.error('Error recording deleted default category:', {
          code: error.code,
          message: error.message,
          details: error.details
        })
      }
    } else {
      console.log(`Recorded deletion of default category: ${categoryName}`)
    }
  } catch (error) {
    console.error('Error in recordDeletedDefaultCategory:', error)
  }
}