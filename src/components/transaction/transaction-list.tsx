'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import { Transaction } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Edit, Trash2 } from 'lucide-react'

interface TransactionListProps {
  limit?: number
  onUpdate?: () => void
  onEdit?: (transaction: Transaction) => void
  onDelete?: (transaction: Transaction) => void
}

export function TransactionList({ limit, onUpdate, onEdit, onDelete }: TransactionListProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchTransactions()
  }, [limit])

  const fetchTransactions = async () => {
    setLoading(true)
    
    let query = supabase
      .from('transactions')
      .select(`
        *,
        category:categories(name, type)
      `)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })

    if (limit) {
      query = query.limit(limit)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching transactions:', error)
    } else {
      setTransactions(data || [])
    }
    
    setLoading(false)
  }

  const formatAmount = (amount: number, type: 'income' | 'expense') => {
    const formattedAmount = new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(amount)

    return type === 'expense' ? `-${formattedAmount}` : `+${formattedAmount}`
  }

  if (loading) {
    return (
      <div className="text-center py-4">
        <p className="text-muted-foreground">読み込み中...</p>
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-muted-foreground">取引がありません</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {transactions.map((transaction) => (
        <div
          key={transaction.id}
          className="flex items-center justify-between p-4 bg-card rounded-lg border"
        >
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">
                {transaction.category?.name || 'カテゴリなし'}
              </span>
              {transaction.description && (
                <span className="text-sm text-muted-foreground">
                  {transaction.description}
                </span>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              {format(new Date(transaction.date), 'yyyy年MM月dd日', { locale: ja })}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div
              className={`text-lg font-semibold ${
                transaction.type === 'expense' ? 'text-destructive' : 'text-green-600'
              }`}
            >
              {formatAmount(transaction.amount, transaction.type)}
            </div>
            
            {(onEdit || onDelete) && (
              <div className="flex gap-1">
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(transaction)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(transaction)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}