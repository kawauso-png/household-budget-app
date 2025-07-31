'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TransactionList } from '@/components/transaction/transaction-list'
import { PeriodSelector, DateRange, PeriodType } from '@/components/dashboard/period-selector'
import { CategoryBreakdown } from '@/components/dashboard/category-breakdown'
import { startOfMonth, endOfMonth, format } from 'date-fns'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function DashboardPage() {
  const [monthlyData, setMonthlyData] = useState({
    income: 0,
    expense: 0,
    balance: 0,
  })
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('thisMonth')
  const [dateRange, setDateRange] = useState<DateRange>({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchMonthlyData()
  }, [dateRange])

  const fetchMonthlyData = async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select('type, amount')
      .gte('date', dateRange.start)
      .lte('date', dateRange.end)

    if (error) {
      console.error('Error fetching monthly data:', error)
    } else {
      const income = data
        ?.filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0
      
      const expense = data
        ?.filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0

      setMonthlyData({
        income,
        expense,
        balance: income - expense,
      })
    }
    
    setLoading(false)
  }

  const handlePeriodChange = (period: PeriodType, range: DateRange) => {
    setSelectedPeriod(period)
    setDateRange(range)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(amount)
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">ダッシュボード</h1>
        
        <div className="mb-8">
          <PeriodSelector
            selectedPeriod={selectedPeriod}
            dateRange={dateRange}
            onPeriodChange={handlePeriodChange}
          />
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-lg font-semibold mb-2">収支</h2>
            <p className={`text-3xl font-bold ${
              monthlyData.balance >= 0 ? 'text-foreground' : 'text-destructive'
            }`}>
              {loading ? '...' : formatCurrency(monthlyData.balance)}
            </p>
          </div>
          
          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-lg font-semibold mb-2">支出</h2>
            <p className="text-3xl font-bold text-destructive">
              {loading ? '...' : formatCurrency(monthlyData.expense)}
            </p>
          </div>
          
          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-lg font-semibold mb-2">収入</h2>
            <p className="text-3xl font-bold text-green-600">
              {loading ? '...' : formatCurrency(monthlyData.income)}
            </p>
          </div>
        </div>

        <Tabs defaultValue="category" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="category">カテゴリ別詳細</TabsTrigger>
            <TabsTrigger value="recent">最近の取引</TabsTrigger>
          </TabsList>
          
          <TabsContent value="category" className="mt-6">
            <CategoryBreakdown dateRange={dateRange} />
          </TabsContent>
          
          <TabsContent value="recent" className="mt-6">
            <TransactionList limit={20} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}