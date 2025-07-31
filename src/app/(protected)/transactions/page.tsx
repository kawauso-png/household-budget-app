'use client'

import { useState } from 'react'
import { TransactionForm } from '@/components/transaction/transaction-form'
import { TransactionList } from '@/components/transaction/transaction-list'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Plus } from 'lucide-react'
import { Transaction } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

export default function TransactionsPage() {
  const [open, setOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const supabase = createClient()

  const handleSuccess = () => {
    setOpen(false)
    setEditingTransaction(null)
    setRefreshKey(prev => prev + 1)
  }

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setOpen(true)
  }

  const handleDelete = async (transaction: Transaction) => {
    if (!confirm('この取引を削除しますか？')) return

    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transaction.id)

      if (error) throw error

      setRefreshKey(prev => prev + 1)
    } catch (error) {
      console.error('削除に失敗しました:', error)
      alert('削除に失敗しました')
    }
  }

  const handleNewTransaction = () => {
    setEditingTransaction(null)
    setOpen(true)
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">収支入力</h1>
          <Button onClick={handleNewTransaction} className="gap-2">
            <Plus className="h-4 w-4" />
            新規入力
          </Button>
        </div>

        <div key={refreshKey}>
          <TransactionList 
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>

        <Dialog open={open} onOpenChange={(open) => {
          setOpen(open)
          if (!open) setEditingTransaction(null)
        }}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingTransaction ? '収支を編集' : '収支を入力'}
              </DialogTitle>
            </DialogHeader>
            <TransactionForm 
              onSuccess={handleSuccess}
              editTransaction={editingTransaction || undefined}
              mode={editingTransaction ? 'edit' : 'create'}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}