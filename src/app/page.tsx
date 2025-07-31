import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h1 className="text-4xl font-bold">家計簿アプリ</h1>
          <p className="mt-2 text-muted-foreground">
            シンプルで使いやすい家計管理ツール
          </p>
        </div>
        
        <div className="space-y-4">
          <Link href="/signup" className="block">
            <Button className="w-full" size="lg">
              無料で始める
            </Button>
          </Link>
          
          <Link href="/login" className="block">
            <Button variant="outline" className="w-full" size="lg">
              ログイン
            </Button>
          </Link>
        </div>
      </div>
    </main>
  )
}