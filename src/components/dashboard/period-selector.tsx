'use client'

import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, subYears } from 'date-fns'
import { ja } from 'date-fns/locale'
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

export type PeriodType = 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear' | 'custom'

export interface DateRange {
  start: string
  end: string
}

interface PeriodSelectorProps {
  selectedPeriod: PeriodType
  dateRange: DateRange
  onPeriodChange: (period: PeriodType, range: DateRange) => void
}

export function PeriodSelector({ selectedPeriod, dateRange, onPeriodChange }: PeriodSelectorProps) {
  const getPeriodRange = (period: PeriodType): DateRange => {
    const now = new Date()
    
    switch (period) {
      case 'thisMonth':
        return {
          start: format(startOfMonth(now), 'yyyy-MM-dd'),
          end: format(endOfMonth(now), 'yyyy-MM-dd')
        }
      case 'lastMonth':
        const lastMonth = subMonths(now, 1)
        return {
          start: format(startOfMonth(lastMonth), 'yyyy-MM-dd'),
          end: format(endOfMonth(lastMonth), 'yyyy-MM-dd')
        }
      case 'thisYear':
        return {
          start: format(startOfYear(now), 'yyyy-MM-dd'),
          end: format(endOfYear(now), 'yyyy-MM-dd')
        }
      case 'lastYear':
        const lastYear = subYears(now, 1)
        return {
          start: format(startOfYear(lastYear), 'yyyy-MM-dd'),
          end: format(endOfYear(lastYear), 'yyyy-MM-dd')
        }
      case 'custom':
      default:
        return dateRange
    }
  }

  const handlePeriodChange = (period: PeriodType) => {
    const range = getPeriodRange(period)
    onPeriodChange(period, range)
  }

  const handleCustomDateChange = (field: 'start' | 'end', value: string) => {
    const newRange = { ...dateRange, [field]: value }
    onPeriodChange('custom', newRange)
  }

  const getPeriodLabel = (period: PeriodType): string => {
    switch (period) {
      case 'thisMonth':
        return '今月'
      case 'lastMonth':
        return '先月'
      case 'thisYear':
        return '今年'
      case 'lastYear':
        return '昨年'
      case 'custom':
        return 'カスタム'
      default:
        return '今月'
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Label>期間:</Label>
        <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="thisMonth">今月</SelectItem>
            <SelectItem value="lastMonth">先月</SelectItem>
            <SelectItem value="thisYear">今年</SelectItem>
            <SelectItem value="lastYear">昨年</SelectItem>
            <SelectItem value="custom">カスタム</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {selectedPeriod === 'custom' && (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="startDate">開始日:</Label>
            <Input
              id="startDate"
              type="date"
              value={dateRange.start}
              onChange={(e) => handleCustomDateChange('start', e.target.value)}
              className="w-auto"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="endDate">終了日:</Label>
            <Input
              id="endDate"
              type="date"
              value={dateRange.end}
              onChange={(e) => handleCustomDateChange('end', e.target.value)}
              className="w-auto"
            />
          </div>
        </div>
      )}

      <div className="text-sm text-muted-foreground">
        {format(new Date(dateRange.start), 'yyyy年MM月dd日', { locale: ja })} 〜 {format(new Date(dateRange.end), 'yyyy年MM月dd日', { locale: ja })}
      </div>
    </div>
  )
}