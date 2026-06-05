import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import Providers from '@/app/providers'

export default async function MundialLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <Providers session={session}>
      <div className="flex flex-col min-h-screen bg-lt-black">
        <main className="flex-1 pb-24">{children}</main>
      </div>
    </Providers>
  )
}
