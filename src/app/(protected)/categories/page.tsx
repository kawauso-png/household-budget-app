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
import { Plus, Edit, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import { Category, Subcategory, TransactionType } from '@/lib/types'
import { recordDeletedDefaultCategory } from '@/lib/default-categories'

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [subcategories, setSubcategories] = useState<Record<string, Subcategory[]>>({})
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [selectedType, setSelectedType] = useState<TransactionType>('expense')
  const [open, setOpen] = useState(false)
  const [subcategoryOpen, setSubcategoryOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null)
  const [selectedCategoryForSub, setSelectedCategoryForSub] = useState<Category | null>(null)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newSubcategoryName, setNewSubcategoryName] = useState('')
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
      if (data) {
        await fetchSubcategories(data.map(c => c.id))
      }
    }
  }

  const fetchSubcategories = async (categoryIds: string[]) => {
    if (categoryIds.length === 0) return

    const { data, error } = await supabase
      .from('subcategories')
      .select('*')
      .in('category_id', categoryIds)
      .order('name')

    if (error) {
      console.error('Error fetching subcategories:', error)
    } else {
      const groupedSubs = (data || []).reduce((acc, sub) => {
        if (!acc[sub.category_id]) {
          acc[sub.category_id] = []
        }
        acc[sub.category_id].push(sub)
        return acc
      }, {} as Record<string, Subcategory[]>)
      
      setSubcategories(groupedSubs)
    }
  }

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  const handleSaveCategory = async () => {
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
        const { error } = await supabase
          .from('categories')
          .update({ name: newCategoryName.trim() })
          .eq('id', editingCategory.id)

        if (error) throw error
      } else {
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

  const handleSaveSubcategory = async () => {
    if (!newSubcategoryName.trim()) {
      setError('サブカテゴリ名を入力してください')
      return
    }

    if (!selectedCategoryForSub) {
      setError('カテゴリが選択されていません')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('ユーザーが見つかりません')

      if (editingSubcategory) {
        const { error } = await supabase
          .from('subcategories')
          .update({ name: newSubcategoryName.trim() })
          .eq('id', editingSubcategory.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('subcategories')
          .insert({
            user_id: user.id,
            category_id: selectedCategoryForSub.id,
            name: newSubcategoryName.trim(),
            is_default: false,
          })

        if (error) throw error
      }

      await fetchCategories()
      handleSubcategoryClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'サブカテゴリの保存に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCategory = async (category: Category) => {
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

    if (!confirm(confirmMessage)) return

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', category.id)

      if (error) throw error

      if (category.is_default) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
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

  const handleDeleteSubcategory = async (subcategory: Subcategory) => {
    const { data: transactions } = await supabase
      .from('transactions')
      .select('id')
      .eq('subcategory_id', subcategory.id)
      .limit(1)

    let confirmMessage = ''
    if (transactions && transactions.length > 0) {
      confirmMessage = `「${subcategory.name}」サブカテゴリを使用している取引があります。削除しますか？`
    } else {
      confirmMessage = `「${subcategory.name}」サブカテゴリを削除しますか？`
    }

    if (!confirm(confirmMessage)) return

    try {
      const { error } = await supabase
        .from('subcategories')
        .delete()
        .eq('id', subcategory.id)

      if (error) throw error
      await fetchCategories()
    } catch (error) {
      console.error('削除に失敗しました:', error)
      alert('削除に失敗しました')
    }
  }

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category)
    setNewCategoryName(category.name)
    setOpen(true)
  }

  const handleEditSubcategory = (subcategory: Subcategory, category: Category) => {
    setEditingSubcategory(subcategory)
    setSelectedCategoryForSub(category)
    setNewSubcategoryName(subcategory.name)
    setSubcategoryOpen(true)
  }

  const handleNewCategory = () => {
    setEditingCategory(null)
    setNewCategoryName('')
    setOpen(true)
  }

  const handleNewSubcategory = (category: Category) => {
    setEditingSubcategory(null)
    setSelectedCategoryForSub(category)
    setNewSubcategoryName('')
    setSubcategoryOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    setEditingCategory(null)
    setNewCategoryName('')
    setError(null)
  }

  const handleSubcategoryClose = () => {
    setSubcategoryOpen(false)
    setEditingSubcategory(null)
    setSelectedCategoryForSub(null)
    setNewSubcategoryName('')
    setError(null)
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">カテゴリ管理</h1>
          <Button onClick={handleNewCategory} className="gap-2">
            <Plus className="h-4 w-4" />
            カテゴリ追加
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
            <div key={category.id} className="border rounded-lg">
              {/* メインカテゴリ */}
              <div className="flex items-center justify-between p-4 bg-card">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleCategory(category.id)}
                    className="hover:bg-muted p-1 rounded"
                  >
                    {subcategories[category.id]?.length > 0 ? (
                      expandedCategories.has(category.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )
                    ) : (
                      <div className="h-4 w-4" />
                    )}
                  </button>
                  <span className="font-medium">{category.name}</span>
                  {category.is_default && (
                    <span className="text-xs bg-muted px-2 py-1 rounded">
                      デフォルト
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    ({subcategories[category.id]?.length || 0}個のサブカテゴリ)
                  </span>
                </div>
                
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleNewSubcategory(category)}
                    className="h-8 px-2 text-xs"
                  >
                    サブ追加
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditCategory(category)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteCategory(category)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* サブカテゴリ */}
              {expandedCategories.has(category.id) && subcategories[category.id] && (
                <div className="border-t bg-muted/20">
                  {subcategories[category.id].map((subcategory) => (
                    <div
                      key={subcategory.id}
                      className="flex items-center justify-between p-3 pl-12 border-b last:border-b-0"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm">{subcategory.name}</span>
                        {subcategory.is_default && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            デフォルト
                          </span>
                        )}
                      </div>
                      
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditSubcategory(subcategory, category)}
                          className="h-6 w-6 p-0"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSubcategory(subcategory)}
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* カテゴリ編集ダイアログ */}
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
                      handleSaveCategory()
                    }
                  }}
                />
              </div>

              <div className="text-sm text-muted-foreground">
                種類: {selectedType === 'expense' ? '支出' : '収入'}
              </div>

              {error && (
                <div className="text-sm text-destructive">{error}</div>
              )}

              <div className="flex gap-2">
                <Button onClick={handleSaveCategory} disabled={loading} className="flex-1">
                  {loading ? '保存中...' : (editingCategory ? '更新' : '追加')}
                </Button>
                <Button variant="outline" onClick={handleClose}>
                  キャンセル
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* サブカテゴリ編集ダイアログ */}
        <Dialog open={subcategoryOpen} onOpenChange={(open) => {
          if (!open) handleSubcategoryClose()
          else setSubcategoryOpen(true)
        }}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingSubcategory ? 'サブカテゴリを編集' : 'サブカテゴリを追加'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subcategoryName">サブカテゴリ名</Label>
                <Input
                  id="subcategoryName"
                  placeholder="サブカテゴリ名を入力"
                  value={newSubcategoryName}
                  onChange={(e) => setNewSubcategoryName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleSaveSubcategory()
                    }
                  }}
                />
              </div>

              <div className="text-sm text-muted-foreground">
                親カテゴリ: {selectedCategoryForSub?.name}
              </div>

              {error && (
                <div className="text-sm text-destructive">{error}</div>
              )}

              <div className="flex gap-2">
                <Button onClick={handleSaveSubcategory} disabled={loading} className="flex-1">
                  {loading ? '保存中...' : (editingSubcategory ? '更新' : '追加')}
                </Button>
                <Button variant="outline" onClick={handleSubcategoryClose}>
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