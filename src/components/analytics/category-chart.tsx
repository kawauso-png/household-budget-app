'use client'

interface CategoryChartProps {
  startDate: string
  endDate: string
}

export function CategoryChart({ startDate, endDate }: CategoryChartProps) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-muted-foreground">カテゴリ別チャート（次回実装予定）</div>
    </div>
  )
}