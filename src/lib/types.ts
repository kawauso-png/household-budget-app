export type TransactionType = 'income' | 'expense'

export interface Category {
  id: string
  user_id: string
  name: string
  type: TransactionType
  icon?: string
  color?: string
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface Transaction {
  id: string
  user_id: string
  category_id: string | null
  type: TransactionType
  amount: number
  date: string
  description?: string
  created_at: string
  updated_at: string
  category?: Category
}

export interface Profile {
  id: string
  email: string
  display_name?: string
  created_at: string
  updated_at: string
}