'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MonthlyChart } from '@/components/analytics/monthly-chart'
import { CategoryChart } from '@/components/analytics/category-chart'
import { ComparisonAnalysis } from '@/components/analytics/comparison-analysis'
import { PeriodSelector } from '@/components/analytics/period-selector'
import { format, startOfYear, endOfYear } from 'date-fns'

export default function AnalyticsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState({
    start: format(startOfYear(new Date()), 'yyyy-MM-dd'),
    end: format(endOfYear(new Date()), 'yyyy-MM-dd'),
    label: 'This Year'
  })

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">データ分析</h1>
          <p className="text-muted-foreground">
            収支の詳細な分析とレポートを確認できます
          </p>
        </div>
        <PeriodSelector
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
        />
      </div>

      <Tabs defaultValue="monthly" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="monthly">月次分析</TabsTrigger>
          <TabsTrigger value="category">カテゴリ分析</TabsTrigger>
          <TabsTrigger value="comparison">比較分析</TabsTrigger>
        </TabsList>

        <TabsContent value="monthly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>月次収支グラフ</CardTitle>
              <CardDescription>
                月ごとの収入・支出・差額の推移を確認できます
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MonthlyChart 
                startDate={selectedPeriod.start}
                endDate={selectedPeriod.end}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="category" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>カテゴリ別支出分析</CardTitle>
              <CardDescription>
                支出をカテゴリ別に分析します
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CategoryChart 
                startDate={selectedPeriod.start}
                endDate={selectedPeriod.end}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          <ComparisonAnalysis 
            startDate={selectedPeriod.start}
            endDate={selectedPeriod.end}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}