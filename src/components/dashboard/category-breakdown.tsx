'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TransactionType, Transaction } from '@/lib/types'
import { DateRange } from './period-selector'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface CategoryData {
  category_name: string
  total_amount: number
  transaction_count: number
  transactions: Transaction[]
}

interface CategoryBreakdownProps {
  dateRange: DateRange
}

export function CategoryBreakdown({ dateRange }: CategoryBreakdownProps) {
  const [expenseData, setExpenseData] = useState<CategoryData[]>([])
  const [incomeData, setIncomeData] = useState<CategoryData[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchCategoryData()
  }, [dateRange])

  const fetchCategoryData = async () => {
    setLoading(true)
    
    try {
      // 指定期間の取引を取得
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select(`
          *,
          category:categories(name, type)
        `)
        .gte('date', dateRange.start)
        .lte('date', dateRange.end)
        .order('date', { ascending: false })

      if (error) throw error

      // カテゴリ別に集計
      const categoryMap = new Map<string, CategoryData>()
      
      transactions?.forEach(transaction => {
        const categoryName = transaction.category?.name || 'その他'
        const key = `${transaction.type}_${categoryName}`
        
        if (!categoryMap.has(key)) {
          categoryMap.set(key, {
            category_name: categoryName,
            total_amount: 0,
            transaction_count: 0,
            transactions: []
          })
        }
        
        const categoryData = categoryMap.get(key)!
        categoryData.total_amount += Number(transaction.amount)
        categoryData.transaction_count += 1
        categoryData.transactions.push(transaction as Transaction)
      })

      // 支出と収入に分離
      const expenses: CategoryData[] = []
      const income: CategoryData[] = []
      
      categoryMap.forEach((data, key) => {
        if (key.startsWith('expense_')) {
          expenses.push(data)
        } else if (key.startsWith('income_')) {
          income.push(data)
        }
      })

      // 金額順にソート
      expenses.sort((a, b) => b.total_amount - a.total_amount)
      income.sort((a, b) => b.total_amount - a.total_amount)

      setExpenseData(expenses)
      setIncomeData(income)
    } catch (error) {
      console.error('Error fetching category data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const CategoryList = ({ data, type }: { data: CategoryData[], type: TransactionType }) => (
    <div className="space-y-3">
      {data.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          データがありません
        </div>
      ) : (
        data.map((category, index) => (
          <div key={`${type}_${category.category_name}`} className="bg-card rounded-lg border p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-lg">{category.category_name}</h3>
              <div className="text-right">
                <div className={`text-xl font-bold ${
                  type === 'expense' ? 'text-destructive' : 'text-green-600'
                }`}>
                  {formatCurrency(category.total_amount)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {category.transaction_count}件の取引
                </div>
              </div>
            </div>
            
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {category.transactions.slice(0, 5).map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between text-sm bg-background rounded p-2">
                  <div className="flex-1">
                    <div>{transaction.description || '説明なし'}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(transaction.date).toLocaleDateString('ja-JP')}
                    </div>
                  </div>
                  <div className="font-medium">
                    {formatCurrency(transaction.amount)}
                  </div>
                </div>
              ))}
              {category.transactions.length > 5 && (
                <div className="text-sm text-muted-foreground text-center py-1">
                  他 {category.transactions.length - 5} 件...
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  )

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-muted-foreground">読み込み中...</div>
      </div>
    )
  }

  return (
    <Tabs defaultValue="expense" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="expense">
          支出 ({expenseData.reduce((sum, cat) => sum + cat.total_amount, 0).toLocaleString()}円)
        </TabsTrigger>
        <TabsTrigger value="income">
          収入 ({incomeData.reduce((sum, cat) => sum + cat.total_amount, 0).toLocaleString()}円)
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="expense">
        <CategoryList data={expenseData} type="expense" />
      </TabsContent>
      
      <TabsContent value="income">
        <CategoryList data={incomeData} type="income" />
      </TabsContent>
    </Tabs>
  )
}