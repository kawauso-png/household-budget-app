'use client'

interface ComparisonAnalysisProps {
  startDate: string
  endDate: string
}

export function ComparisonAnalysis({ startDate, endDate }: ComparisonAnalysisProps) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-muted-foreground">比較分析（次回実装予定）</div>
    </div>
  )
}