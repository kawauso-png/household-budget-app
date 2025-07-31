'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts'
import { format, eachMonthOfInterval, parseISO } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface MonthlyChartProps {
  startDate: string
  endDate: string
}

interface MonthlyData {
  month: string
  income: number
  expense: number
  balance: number
}

export function MonthlyChart({ startDate, endDate }: MonthlyChartProps) {
  const [data, setData] = useState<MonthlyData[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchMonthlyData()
  }, [startDate, endDate])

  const fetchMonthlyData = async () => {
    setLoading(true)
    
    try {
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date')

      if (error) throw error

      // 月ごとのデータを集計
      const months = eachMonthOfInterval({
        start: parseISO(startDate),
        end: parseISO(endDate)
      })

      const monthlyData: MonthlyData[] = months.map(month => {
        const monthStr = format(month, 'yyyy-MM')
        const monthTransactions = transactions?.filter(t => 
          t.date.startsWith(monthStr)
        ) || []

        const income = monthTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0)
        
        const expense = monthTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0)

        return {
          month: format(month, 'yyyy/MM'),
          income,
          expense,
          balance: income - expense
        }
      })

      setData(monthlyData)
    } catch (error) {
      console.error('Error fetching monthly data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return `¥${Math.abs(value).toLocaleString()}`
  }

  const formatTooltip = (value: number, name: string) => {
    const label = name === 'income' ? '収入' : name === 'expense' ? '支出' : '差額'
    return [`¥${value.toLocaleString()}`, label]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">データを読み込んでいます...</div>
      </div>
    )
  }

  return (
    <Tabs defaultValue="bar" className="w-full">
      <TabsList>
        <TabsTrigger value="bar">棒グラフ</TabsTrigger>
        <TabsTrigger value="line">折れ線グラフ</TabsTrigger>
      </TabsList>

      <TabsContent value="bar">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={formatCurrency} />
              <Tooltip formatter={formatTooltip} />
              <Legend />
              <Bar dataKey="income" fill="#22c55e" name="収入" />
              <Bar dataKey="expense" fill="#ef4444" name="支出" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </TabsContent>

      <TabsContent value="line">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={formatCurrency} />
              <Tooltip formatter={formatTooltip} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="income" 
                stroke="#22c55e" 
                strokeWidth={2}
                name="収入"
              />
              <Line 
                type="monotone" 
                dataKey="expense" 
                stroke="#ef4444" 
                strokeWidth={2}
                name="支出"
              />
              <Line 
                type="monotone" 
                dataKey="balance" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="差額"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </TabsContent>
    </Tabs>
  )
}