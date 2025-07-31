'use client'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, subYears } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { useState } from 'react'

interface PeriodSelectorProps {
  selectedPeriod: {
    start: string
    end: string
    label: string
  }
  onPeriodChange: (period: { start: string; end: string; label: string }) => void
}

export function PeriodSelector({ selectedPeriod, onPeriodChange }: PeriodSelectorProps) {
  const [isCustom, setIsCustom] = useState(false)
  const [customStartDate, setCustomStartDate] = useState<Date>()
  const [customEndDate, setCustomEndDate] = useState<Date>()

  const predefinedPeriods = [
    {
      label: 'This Month',
      start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
      end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
    },
    {
      label: 'Last Month',
      start: format(startOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd'),
      end: format(endOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd')
    },
    {
      label: 'This Year',
      start: format(startOfYear(new Date()), 'yyyy-MM-dd'),
      end: format(endOfYear(new Date()), 'yyyy-MM-dd')
    },
    {
      label: 'Last Year',
      start: format(startOfYear(subYears(new Date(), 1)), 'yyyy-MM-dd'),
      end: format(endOfYear(subYears(new Date(), 1)), 'yyyy-MM-dd')
    }
  ]

  const handlePredefinedPeriod = (period: typeof predefinedPeriods[0]) => {
    setIsCustom(false)
    onPeriodChange(period)
  }

  const handleCustomPeriod = () => {
    if (customStartDate && customEndDate) {
      onPeriodChange({
        start: format(customStartDate, 'yyyy-MM-dd'),
        end: format(customEndDate, 'yyyy-MM-dd'),
        label: 'Custom'
      })
      setIsCustom(false)
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {predefinedPeriods.map((period) => (
        <Button
          key={period.label}
          variant={selectedPeriod.label === period.label ? 'default' : 'outline'}
          size="sm"
          onClick={() => handlePredefinedPeriod(period)}
        >
          {period.label}
        </Button>
      ))}
      
      <Popover open={isCustom} onOpenChange={setIsCustom}>
        <PopoverTrigger asChild>
          <Button
            variant={selectedPeriod.label === 'Custom' ? 'default' : 'outline'}
            size="sm"
            className="gap-2"
          >
            <CalendarIcon className="h-4 w-4" />
            Custom
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">開始日</label>
              <Calendar
                mode="single"
                selected={customStartDate}
                onSelect={setCustomStartDate}
                initialFocus
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">終了日</label>
              <Calendar
                mode="single"
                selected={customEndDate}
                onSelect={setCustomEndDate}
                disabled={(date) => customStartDate ? date < customStartDate : false}
              />
            </div>
            <Button 
              onClick={handleCustomPeriod} 
              className="w-full"
              disabled={!customStartDate || !customEndDate}
            >
              適用
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}