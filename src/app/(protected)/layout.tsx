import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navigation } from '@/components/layout/navigation'
import { DefaultCategoryEnsurer } from '@/components/default-category-ensurer'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <>
      <DefaultCategoryEnsurer userId={user.id} />
      <Navigation />
      {children}
    </>
  )
}