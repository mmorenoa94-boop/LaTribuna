import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Sidebar } from '@/components/negocio/Sidebar'
import Providers from '@/app/providers'

export default async function NegocioLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')
  if (session.user.role !== 'NEGOCIO') redirect('/home')

  const business = await prisma.business.findUnique({
    where: { userId: session.user.id },
    select: { name: true, logoUrl: true },
  })

  if (!business) redirect('/login')

  return (
    <Providers session={session}>
      <div className="flex min-h-screen bg-glow-amber">
        <Sidebar businessName={business.name} businessLogo={business.logoUrl} />
        <main className="flex-1 md:ml-60 pb-20 md:pb-0">
          <div className="max-w-3xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </Providers>
  )
}
