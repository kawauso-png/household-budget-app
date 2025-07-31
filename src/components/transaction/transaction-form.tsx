'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TransactionType, Category, Subcategory, Transaction } from '@/lib/types'
import { Plus, X } from 'lucide-react'

interface TransactionFormProps {
  onSuccess?: () => void
  defaultType?: TransactionType
  editTransaction?: Transaction
  mode?: 'create' | 'edit'
}

type TaxType = 'tax_included' | 'tax_8' | 'tax_10'

export function TransactionForm({ 
  onSuccess, 
  defaultType = 'expense', 
  editTransaction, 
  mode = 'create' 
}: TransactionFormProps) {
  const [type, setType] = useState<TransactionType>(editTransaction?.type || defaultType)
  const [baseAmount, setBaseAmount] = useState(editTransaction ? editTransaction.amount.toString() : '')
  const [taxType, setTaxType] = useState<TaxType>('tax_included')
  const [finalAmount, setFinalAmount] = useState(editTransaction ? editTransaction.amount.toString() : '')
  const [categoryId, setCategoryId] = useState(editTransaction?.category_id || '')
  const [subcategoryId, setSubcategoryId] = useState(editTransaction?.subcategory_id || '')
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newSubcategoryName, setNewSubcategoryName] = useState('')
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [showNewSubcategory, setShowNewSubcategory] = useState(false)
  const [date, setDate] = useState(editTransaction ? editTransaction.date : format(new Date(), 'yyyy-MM-dd'))
  const [description, setDescription] = useState(editTransaction?.description || '')
  const [categories, setCategories] = useState<Category[]>([])
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClient()

  useEffect(() => {
    fetchCategories()
  }, [type])

  useEffect(() => {
    if (categoryId) {
      fetchSubcategories(categoryId)
    } else {
      setSubcategories([])
      setSubcategoryId('')
    }
  }, [categoryId])

  useEffect(() => {
    calculateFinalAmount()
  }, [baseAmount, taxType])

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('type', type)
      .order('name')

    if (error) {
      console.error('Error fetching categories:', error)
    } else {
      setCategories(data || [])
    }
  }

  const fetchSubcategories = async (selectedCategoryId: string) => {
    const { data, error } = await supabase
      .from('subcategories')
      .select('*')
      .eq('category_id', selectedCategoryId)
      .order('name')

    if (error) {
      console.error('Error fetching subcategories:', error)
    } else {
      setSubcategories(data || [])
    }
  }

  const calculateFinalAmount = () => {
    const base = parseFloat(baseAmount) || 0
    if (base === 0) {
      setFinalAmount('')
      return
    }

    let final = base
    switch (taxType) {
      case 'tax_included':
        final = base
        break
      case 'tax_8':
        final = Math.round(base * 1.08)
        break
      case 'tax_10':
        final = Math.round(base * 1.10)
        break
    }
    setFinalAmount(final.toString())
  }

  const createNewCategory = async () => {
    if (!newCategoryName.trim()) {
      setError('カテゴリ名を入力してください')
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('ユーザーが見つかりません')

      const { data, error } = await supabase
        .from('categories')
        .insert({
          user_id: user.id,
          name: newCategoryName.trim(),
          type,
          is_default: false,
        })
        .select()
        .single()

      if (error) throw error

      await fetchCategories()
      setCategoryId(data.id)
      setNewCategoryName('')
      setShowNewCategory(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'カテゴリの作成に失敗しました')
    }
  }

  const createNewSubcategory = async () => {
    if (!newSubcategoryName.trim()) {
      setError('サブカテゴリ名を入力してください')
      return
    }

    if (!categoryId) {
      setError('先にカテゴリを選択してください')
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('ユーザーが見つかりません')

      const { data, error } = await supabase
        .from('subcategories')
        .insert({
          user_id: user.id,
          category_id: categoryId,
          name: newSubcategoryName.trim(),
          is_default: false,
        })
        .select()
        .single()

      if (error) throw error

      await fetchSubcategories(categoryId)
      setSubcategoryId(data.id)
      setNewSubcategoryName('')
      setShowNewSubcategory(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'サブカテゴリの作成に失敗しました')
    }
  }

  const handleCategoryChange = (value: string) => {
    setCategoryId(value)
    setSubcategoryId('') // カテゴリが変わったらサブカテゴリをリセット
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!finalAmount || parseFloat(finalAmount) <= 0) {
      setError('金額を入力してください')
      return
    }
    
    if (!categoryId) {
      setError('カテゴリを選択してください')
      return
    }

    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('ユーザーが見つかりません')
      }

      if (mode === 'edit' && editTransaction) {
        const { error } = await supabase
          .from('transactions')
          .update({
            type,
            amount: parseFloat(finalAmount),
            category_id: categoryId,
            subcategory_id: subcategoryId || null,
            date,
            description: description || null,
          })
          .eq('id', editTransaction.id)

        if (error) throw error
      } else {
        const { error } = await supabase.from('transactions').insert({
          user_id: user.id,
          type,
          amount: parseFloat(finalAmount),
          category_id: categoryId,
          subcategory_id: subcategoryId || null,
          date,
          description: description || null,
        })

        if (error) throw error

        // フォームをリセット（新規作成時のみ）
        setBaseAmount('')
        setFinalAmount('')
        setTaxType('tax_included')
        setCategoryId('')
        setSubcategoryId('')
        setDescription('')
        setDate(format(new Date(), 'yyyy-MM-dd'))
      }
      
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Button
          type="button"
          variant={type === 'expense' ? 'default' : 'outline'}
          onClick={() => setType('expense')}
          className="w-full"
        >
          支出
        </Button>
        <Button
          type="button"
          variant={type === 'income' ? 'default' : 'outline'}
          onClick={() => setType('income')}
          className="w-full"
        >
          収入
        </Button>
      </div>

      <div className="space-y-2">
        <Label htmlFor="baseAmount">
          {type === 'expense' ? '基準金額' : '金額'}
        </Label>
        <Input
          id="baseAmount"
          type="number"
          placeholder="0"
          value={baseAmount}
          onChange={(e) => setBaseAmount(e.target.value)}
          required
          min="0"
          step="1"
        />
        
        {type === 'expense' && (
          <div className="space-y-2">
            <Label>税込計算</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant={taxType === 'tax_included' ? 'default' : 'outline'}
                onClick={() => setTaxType('tax_included')}
                size="sm"
              >
                税込
              </Button>
              <Button
                type="button"
                variant={taxType === 'tax_8' ? 'default' : 'outline'}
                onClick={() => setTaxType('tax_8')}
                size="sm"
              >
                8%込
              </Button>
              <Button
                type="button"
                variant={taxType === 'tax_10' ? 'default' : 'outline'}
                onClick={() => setTaxType('tax_10')}
                size="sm"
              >
                10%込
              </Button>
            </div>
            
            {finalAmount && parseFloat(finalAmount) !== parseFloat(baseAmount || '0') && (
              <div className="text-sm text-muted-foreground">
                税込金額: ¥{parseInt(finalAmount).toLocaleString()}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">カテゴリ *</Label>
        <div className="space-y-2">
          <Select value={categoryId} onValueChange={handleCategoryChange}>
            <SelectTrigger id="category">
              <SelectValue placeholder="カテゴリを選択してください" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {!showNewCategory ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowNewCategory(true)}
              className="w-full gap-2"
            >
              <Plus className="h-4 w-4" />
              新しいカテゴリを追加
            </Button>
          ) : (
            <div className="flex gap-2">
              <Input
                placeholder="新しいカテゴリ名"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    createNewCategory()
                  }
                }}
              />
              <Button
                type="button"
                size="sm"
                onClick={createNewCategory}
                disabled={!newCategoryName.trim()}
              >
                追加
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowNewCategory(false)
                  setNewCategoryName('')
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {categoryId && (
        <div className="space-y-2">
          <Label htmlFor="subcategory">サブカテゴリ</Label>
          <div className="space-y-2">
            <Select value={subcategoryId} onValueChange={setSubcategoryId}>
              <SelectTrigger id="subcategory">
                <SelectValue placeholder="サブカテゴリを選択（任意）" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">なし</SelectItem>
                {subcategories.map((subcategory) => (
                  <SelectItem key={subcategory.id} value={subcategory.id}>
                    {subcategory.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {!showNewSubcategory ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowNewSubcategory(true)}
                className="w-full gap-2"
              >
                <Plus className="h-4 w-4" />
                新しいサブカテゴリを追加
              </Button>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="新しいサブカテゴリ名"
                  value={newSubcategoryName}
                  onChange={(e) => setNewSubcategoryName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      createNewSubcategory()
                    }
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={createNewSubcategory}
                  disabled={!newSubcategoryName.trim()}
                >
                  追加
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowNewSubcategory(false)
                    setNewSubcategoryName('')
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="date">日付</Label>
        <Input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">メモ</Label>
        <Input
          id="description"
          type="text"
          placeholder="メモを入力（任意）"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {error && (
        <div className="text-sm text-destructive">{error}</div>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (mode === 'edit' ? '更新中...' : '保存中...') : (mode === 'edit' ? '更新' : '保存')}
      </Button>
    </form>
  )
}