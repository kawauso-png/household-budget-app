'use client'

import { useEffect } from 'react'
import { ensureDefaultCategories } from '@/lib/default-categories'

interface DefaultCategoryEnsurerProps {
  userId: string
}

export function DefaultCategoryEnsurer({ userId }: DefaultCategoryEnsurerProps) {
  useEffect(() => {
    if (userId) {
      ensureDefaultCategories(userId)
    }
  }, [userId])

  // このコンポーネントは何もレンダリングしない
  return null
}