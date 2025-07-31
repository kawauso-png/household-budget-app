'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { Category, TransactionType } from '@/lib/types'
import { recordDeletedDefaultCategory } from '@/lib/default-categories'

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedType, setSelectedType] = useState<TransactionType>('expense')
  const [open, setOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchCategories()
  }, [selectedType])

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('type', selectedType)
      .order('name')

    if (error) {
      console.error('Error fetching categories:', error)
    } else {
      setCategories(data || [])
    }
  }

  const handleSave = async () => {
    if (!newCategoryName.trim()) {
      setError('カテゴリ名を入力してください')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('ユーザーが見つかりません')

      if (editingCategory) {
        // 更新
        const { error } = await supabase
          .from('categories')
          .update({ name: newCategoryName.trim() })
          .eq('id', editingCategory.id)

        if (error) throw error
      } else {
        // 新規作成
        const { error } = await supabase
          .from('categories')
          .insert({
            user_id: user.id,
            name: newCategoryName.trim(),
            type: selectedType,
            is_default: false,
          })

        if (error) throw error
      }

      await fetchCategories()
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'カテゴリの保存に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (category: Category) => {
    // このカテゴリを使用している取引があるかチェック
    const { data: transactions } = await supabase
      .from('transactions')
      .select('id')
      .eq('category_id', category.id)
      .limit(1)

    let confirmMessage = ''
    if (category.is_default) {
      if (transactions && transactions.length > 0) {
        confirmMessage = `「${category.name}」はデフォルトカテゴリで、使用している取引があります。削除すると、これらの取引のカテゴリは「未分類」になります。\n\n※ 一度削除したデフォルトカテゴリは自動で再作成されません。\n\n本当に削除しますか？`
      } else {
        confirmMessage = `「${category.name}」はデフォルトカテゴリです。\n\n※ 一度削除したデフォルトカテゴリは自動で再作成されません。\n\n本当に削除しますか？`
      }
    } else {
      if (transactions && transactions.length > 0) {
        confirmMessage = `「${category.name}」カテゴリを使用している取引があります。削除すると、これらの取引のカテゴリは「未分類」になります。削除しますか？`
      } else {
        confirmMessage = `「${category.name}」カテゴリを削除しますか？`
      }
    }

    if (!confirm(confirmMessage)) {
      return
    }

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', category.id)

      if (error) throw error

      // カテゴリ削除成功後に削除記録を保存（デフォルトカテゴリの場合）
      if (category.is_default) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          // これは非同期で実行し、エラーがあってもカテゴリ削除は成功とする
          recordDeletedDefaultCategory(user.id, category.name, category.type).catch(err => {
            console.warn('Failed to record deleted default category, but category deletion succeeded:', err)
          })
        }
      }

      await fetchCategories()
    } catch (error) {
      console.error('削除に失敗しました:', error)
      alert('削除に失敗しました')
    }
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setNewCategoryName(category.name)
    setOpen(true)
  }

  const handleNew = () => {
    setEditingCategory(null)
    setNewCategoryName('')
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    setEditingCategory(null)
    setNewCategoryName('')
    setError(null)
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">カテゴリ管理</h1>
          <Button onClick={handleNew} className="gap-2">
            <Plus className="h-4 w-4" />
            新規追加
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <Button
            variant={selectedType === 'expense' ? 'default' : 'outline'}
            onClick={() => setSelectedType('expense')}
          >
            支出カテゴリ
          </Button>
          <Button
            variant={selectedType === 'income' ? 'default' : 'outline'}
            onClick={() => setSelectedType('income')}
          >
            収入カテゴリ
          </Button>
        </div>

        <div className="space-y-2">
          {categories.map((category) => (
            <div
              key={category.id}
              className="flex items-center justify-between p-4 bg-card rounded-lg border"
            >
              <div className="flex items-center gap-3">
                <span className="font-medium">{category.name}</span>
                {category.is_default && (
                  <span className="text-xs bg-muted px-2 py-1 rounded">
                    デフォルト
                  </span>
                )}
              </div>
              
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(category)}
                  className="h-8 w-8 p-0"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(category)}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <Dialog open={open} onOpenChange={(open) => {
          if (!open) handleClose()
          else setOpen(true)
        }}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? 'カテゴリを編集' : 'カテゴリを追加'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="categoryName">カテゴリ名</Label>
                <Input
                  id="categoryName"
                  placeholder="カテゴリ名を入力"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleSave()
                    }
                  }}
                />
              </div>

              <div className="text-sm text-muted-foreground">
                種類: {selectedType === 'expense' ? '支出' : '収入'}
                {editingCategory?.is_default && (
                  <span className="block text-blue-600 mt-1">
                    ※ デフォルトカテゴリの名前を変更できます
                  </span>
                )}
              </div>

              {error && (
                <div className="text-sm text-destructive">{error}</div>
              )}

              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={loading} className="flex-1">
                  {loading ? '保存中...' : (editingCategory ? '更新' : '追加')}
                </Button>
                <Button variant="outline" onClick={handleClose}>
                  キャンセル
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}