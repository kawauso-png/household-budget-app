'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts'
import { format, subMonths, subYears, startOfMonth, endOfMonth, parseISO } from 'date-fns'
import { TrendingUp, TrendingDown, Minus, ArrowUp, ArrowDown } from 'lucide-react'

interface ComparisonAnalysisProps {
  startDate: string
  endDate: string
}

interface ComparisonData {
  period: string
  income: number
  expense: number
  balance: number
}

interface SummaryData {
  currentIncome: number
  currentExpense: number
  currentBalance: number
  previousIncome: number
  previousExpense: number
  previousBalance: number
  incomeChange: number
  incomeChangePercent: number
  expenseChange: number
  expenseChangePercent: number
  balanceChange: number
  balanceChangePercent: number
}

export function ComparisonAnalysis({ startDate, endDate }: ComparisonAnalysisProps) {
  const [comparisonData, setComparisonData] = useState<ComparisonData[]>([])
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchComparisonData()
  }, [startDate, endDate])

  const fetchComparisonData = async () => {
    setLoading(true)
    
    try {
      // 現在の期間と前期間を計算
      const currentStart = parseISO(startDate)
      const currentEnd = parseISO(endDate)
      
      // 前年同期間を計算
      const previousStart = subYears(currentStart, 1)
      const previousEnd = subYears(currentEnd, 1)

      // 現在期間のデータを取得
      const { data: currentTransactions, error: currentError } = await supabase
        .from('transactions')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)

      if (currentError) throw currentError

      // 前年同期間のデータを取得
      const { data: previousTransactions, error: previousError } = await supabase
        .from('transactions')
        .select('*')
        .gte('date', format(previousStart, 'yyyy-MM-dd'))
        .lte('date', format(previousEnd, 'yyyy-MM-dd'))

      if (previousError) throw previousError

      // データを集計
      const calculateTotals = (transactions: any[]) => {
        const income = transactions
          ?.filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0) || 0
        
        const expense = transactions
          ?.filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0) || 0

        return { income, expense, balance: income - expense }
      }

      const current = calculateTotals(currentTransactions || [])
      const previous = calculateTotals(previousTransactions || [])

      // 変化率を計算
      const calculateChange = (current: number, previous: number) => {
        const change = current - previous
        const changePercent = previous !== 0 ? Math.round((change / previous) * 100) : 0
        return { change, changePercent }
      }

      const incomeChange = calculateChange(current.income, previous.income)
      const expenseChange = calculateChange(current.expense, previous.expense)
      const balanceChange = calculateChange(current.balance, previous.balance)

      setSummaryData({
        currentIncome: current.income,
        currentExpense: current.expense,
        currentBalance: current.balance,
        previousIncome: previous.income,
        previousExpense: previous.expense,
        previousBalance: previous.balance,
        incomeChange: incomeChange.change,
        incomeChangePercent: incomeChange.changePercent,
        expenseChange: expenseChange.change,
        expenseChangePercent: expenseChange.changePercent,
        balanceChange: balanceChange.change,
        balanceChangePercent: balanceChange.changePercent,
      })

      // 比較用チャートデータを作成
      setComparisonData([
        {
          period: '前年同期',
          income: previous.income,
          expense: previous.expense,
          balance: previous.balance
        },
        {
          period: '今期',
          income: current.income,
          expense: current.expense,
          balance: current.balance
        }
      ])

    } catch (error) {
      console.error('Error fetching comparison data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return `¥${Math.abs(value).toLocaleString()}`
  }

  const getChangeIcon = (value: number) => {
    if (value > 0) return <ArrowUp className="h-4 w-4 text-green-500" />
    if (value < 0) return <ArrowDown className="h-4 w-4 text-red-500" />
    return <Minus className="h-4 w-4 text-gray-500" />
  }

  const getChangeColor = (value: number, isExpense = false) => {
    if (value === 0) return 'text-gray-500'
    if (isExpense) {
      return value > 0 ? 'text-red-500' : 'text-green-500'
    }
    return value > 0 ? 'text-green-500' : 'text-red-500'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">データを読み込んでいます...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* サマリーカード */}
      {summaryData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">収入</CardTitle>
              {getChangeIcon(summaryData.incomeChange)}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summaryData.currentIncome)}</div>
              <div className={`text-xs ${getChangeColor(summaryData.incomeChange)}`}>
                {summaryData.incomeChangePercent > 0 && '+'}
                {summaryData.incomeChangePercent}% 前年同期比
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                前年: {formatCurrency(summaryData.previousIncome)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">支出</CardTitle>
              {getChangeIcon(summaryData.expenseChange)}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summaryData.currentExpense)}</div>
              <div className={`text-xs ${getChangeColor(summaryData.expenseChange, true)}`}>
                {summaryData.expenseChangePercent > 0 && '+'}
                {summaryData.expenseChangePercent}% 前年同期比
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                前年: {formatCurrency(summaryData.previousExpense)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">収支差額</CardTitle>
              {getChangeIcon(summaryData.balanceChange)}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summaryData.currentBalance >= 0 ? '+' : '-'}
                {formatCurrency(summaryData.currentBalance)}
              </div>
              <div className={`text-xs ${getChangeColor(summaryData.balanceChange)}`}>
                {summaryData.balanceChangePercent > 0 && '+'}
                {summaryData.balanceChangePercent}% 前年同期比
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                前年: {summaryData.previousBalance >= 0 ? '+' : '-'}
                {formatCurrency(summaryData.previousBalance)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 比較チャート */}
      <Card>
        <CardHeader>
          <CardTitle>前年同期比較</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis tickFormatter={formatCurrency} />
                <Tooltip formatter={(value: number, name: string) => {
                  const label = name === 'income' ? '収入' : name === 'expense' ? '支出' : '収支差額'
                  return [`¥${value.toLocaleString()}`, label]
                }} />
                <Bar dataKey="income" fill="#22c55e" name="収入" />
                <Bar dataKey="expense" fill="#ef4444" name="支出" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}