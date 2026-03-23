import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { BottomNav } from '@/components/layout/BottomNav'
import Providers from '@/app/providers'

export default async function HinchaLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')
  if (session.user.role === 'NEGOCIO') redirect('/dashboard')

  return (
    <Providers session={session}>
      <div className="flex flex-col min-h-screen bg-glow-green">
        <main className="flex-1 pb-20">
          {children}
        </main>
        <BottomNav />
      </div>
    </Providers>
  )
}
