'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { ja } from 'date-fns/locale'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Transaction, Category } from '@/lib/types'

interface MonthlyData {
  month: string
  income: number
  expense: number
  balance: number
}

interface CategoryData {
  name: string
  value: number
  percentage: number
}

export default function ReportsPage() {
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [monthlyTrend, setMonthlyTrend] = useState<MonthlyData[]>([])
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryData[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchReportData()
  }, [selectedMonth])

  const fetchReportData = async () => {
    setLoading(true)
    
    // 過去6ヶ月のトレンドデータを取得
    const trendData: MonthlyData[] = []
    for (let i = 5; i >= 0; i--) {
      const targetDate = subMonths(new Date(selectedMonth), i)
      const monthStart = startOfMonth(targetDate)
      const monthEnd = endOfMonth(targetDate)
      
      const { data } = await supabase
        .from('transactions')
        .select('type, amount')
        .gte('date', format(monthStart, 'yyyy-MM-dd'))
        .lte('date', format(monthEnd, 'yyyy-MM-dd'))
      
      const income = data?.filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0
      const expense = data?.filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0
      
      trendData.push({
        month: format(targetDate, 'MM月', { locale: ja }),
        income,
        expense,
        balance: income - expense,
      })
    }
    setMonthlyTrend(trendData)
    
    // 選択月のカテゴリ別データを取得
    const monthStart = startOfMonth(new Date(selectedMonth))
    const monthEnd = endOfMonth(new Date(selectedMonth))
    
    const { data: transactions } = await supabase
      .from('transactions')
      .select(`
        *,
        category:categories(name)
      `)
      .eq('type', 'expense')
      .gte('date', format(monthStart, 'yyyy-MM-dd'))
      .lte('date', format(monthEnd, 'yyyy-MM-dd'))
    
    // カテゴリ別に集計
    const categoryMap = new Map<string, number>()
    let totalExpense = 0
    
    transactions?.forEach(t => {
      const categoryName = t.category?.name || 'その他'
      const amount = Number(t.amount)
      categoryMap.set(categoryName, (categoryMap.get(categoryName) || 0) + amount)
      totalExpense += amount
    })
    
    const categoryData = Array.from(categoryMap.entries())
      .map(([name, value]) => ({
        name,
        value,
        percentage: totalExpense > 0 ? (value / totalExpense) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value)
    
    setCategoryBreakdown(categoryData)
    setLoading(false)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
    }).format(value)
  }

  const COLORS = [
    '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8',
    '#82CA9D', '#FFC658', '#8DD1E1', '#A4DE6C', '#FFD93D',
  ]

  if (loading) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <p className="text-muted-foreground">読み込み中...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">レポート</h1>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 border rounded-md"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* 月次推移グラフ */}
          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-lg font-semibold mb-4">収支推移（過去6ヶ月）</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `¥${value.toLocaleString()}`} />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  labelStyle={{ color: '#000' }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="income" 
                  stroke="#22c55e" 
                  name="収入"
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="expense" 
                  stroke="#ef4444" 
                  name="支出"
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="balance" 
                  stroke="#3b82f6" 
                  name="収支"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* カテゴリ別円グラフ */}
          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-lg font-semibold mb-4">
              カテゴリ別支出（{format(new Date(selectedMonth), 'yyyy年MM月', { locale: ja })}）
            </h2>
            {categoryBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name} ${percentage.toFixed(1)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center">
                <p className="text-muted-foreground">データがありません</p>
              </div>
            )}
          </div>

          {/* カテゴリ別支出一覧 */}
          <div className="bg-card p-6 rounded-lg border lg:col-span-2">
            <h2 className="text-lg font-semibold mb-4">カテゴリ別支出詳細</h2>
            {categoryBreakdown.length > 0 ? (
              <div className="space-y-2">
                {categoryBreakdown.map((category, index) => (
                  <div key={category.name} className="flex items-center justify-between p-3 bg-background rounded">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span>{category.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(category.value)}</p>
                      <p className="text-sm text-muted-foreground">{category.percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">データがありません</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}