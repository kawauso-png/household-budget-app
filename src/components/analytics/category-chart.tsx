'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface CategoryChartProps {
  startDate: string
  endDate: string
}

interface CategoryData {
  name: string
  fullName: string
  amount: number
  percentage: number
  color: string
  transactions: Array<{
    date: string
    amount: number
    description: string
  }>
}

const COLORS = [
  '#ef4444', // red-500
  '#f97316', // orange-500
  '#eab308', // yellow-500
  '#22c55e', // green-500
  '#06b6d4', // cyan-500
  '#3b82f6', // blue-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#6b7280', // gray-500
  '#f59e0b', // amber-500
]

export function CategoryChart({ startDate, endDate }: CategoryChartProps) {
  const [expenseData, setExpenseData] = useState<CategoryData[]>([])
  const [incomeData, setIncomeData] = useState<CategoryData[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchCategoryData()
  }, [startDate, endDate])

  const fetchCategoryData = async () => {
    setLoading(true)
    
    try {
      // 取引データとカテゴリデータを取得
      const { data: transactions, error: transactionError } = await supabase
        .from('transactions')
        .select(`
          *,
          categories (
            name
          )
        `)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false })

      if (transactionError) throw transactionError

      // 支出データを集計
      const expenseTransactions = transactions?.filter(t => t.type === 'expense') || []
      const incomeTransactions = transactions?.filter(t => t.type === 'income') || []

      const processTransactions = (txs: any[], type: 'expense' | 'income') => {
        const categoryMap = new Map<string, {
          amount: number
          transactions: Array<{
            date: string
            amount: number
            description: string
          }>
        }>()

        txs.forEach(tx => {
          const categoryName = tx.categories?.name || '未分類'
          const existing = categoryMap.get(categoryName) || { amount: 0, transactions: [] }
          
          existing.amount += tx.amount
          existing.transactions.push({
            date: tx.date,
            amount: tx.amount,
            description: tx.description || ''
          })
          
          categoryMap.set(categoryName, existing)
        })

        const totalAmount = Array.from(categoryMap.values()).reduce((sum, cat) => sum + cat.amount, 0)

        return Array.from(categoryMap.entries())
          .map(([name, data], index) => ({
            name: name.length > 10 ? name.substring(0, 10) + '...' : name,
            fullName: name,
            amount: data.amount,
            percentage: totalAmount > 0 ? Math.round((data.amount / totalAmount) * 100) : 0,
            color: COLORS[index % COLORS.length],
            transactions: data.transactions.sort((a, b) => b.date.localeCompare(a.date))
          }))
          .sort((a, b) => b.amount - a.amount)
      }

      setExpenseData(processTransactions(expenseTransactions, 'expense'))
      setIncomeData(processTransactions(incomeTransactions, 'income'))
    } catch (error) {
      console.error('Error fetching category data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return `¥${value.toLocaleString()}`
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.fullName || data.name}</p>
          <p className="text-sm text-muted-foreground">
            {formatCurrency(data.amount)} ({data.percentage}%)
          </p>
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">データを読み込んでいます...</div>
      </div>
    )
  }

  return (
    <Tabs defaultValue="expense" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="expense">支出分析</TabsTrigger>
        <TabsTrigger value="income">収入分析</TabsTrigger>
      </TabsList>

      <TabsContent value="expense" className="space-y-4">
        {expenseData.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 円グラフ */}
            <Card>
              <CardHeader>
                <CardTitle>支出カテゴリ割合</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="amount"
                        label={({ percentage }) => `${percentage}%`}
                      >
                        {expenseData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* 棒グラフ */}
            <Card>
              <CardHeader>
                <CardTitle>カテゴリ別支出額</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={expenseData} 
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={formatCurrency} />
                      <Tooltip 
                        formatter={(value: number) => [formatCurrency(value), '支出額']}
                        labelStyle={{ color: '#000' }}
                      />
                      <Bar dataKey="amount" fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">選択した期間に支出データがありません</div>
          </div>
        )}
      </TabsContent>

      <TabsContent value="income" className="space-y-4">
        {incomeData.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 円グラフ */}
            <Card>
              <CardHeader>
                <CardTitle>収入カテゴリ割合</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={incomeData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="amount"
                        label={({ percentage }) => `${percentage}%`}
                      >
                        {incomeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* 棒グラフ */}
            <Card>
              <CardHeader>
                <CardTitle>カテゴリ別収入額</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={incomeData} 
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={formatCurrency} />
                      <Tooltip 
                        formatter={(value: number) => [formatCurrency(value), '収入額']}
                        labelStyle={{ color: '#000' }}
                      />
                      <Bar dataKey="amount" fill="#22c55e" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">選択した期間に収入データがありません</div>
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}