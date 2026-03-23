import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export default async function LigasNegocioPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const business = await prisma.business.findUnique({
    where: { userId: session.user.id },
  })
  if (!business) redirect('/login')

  const leagues = await prisma.league.findMany({
    where: { businessId: business.id },
    include: {
      _count: { select: { members: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const STATUS_MAP: Record<string, { label: string; color: string }> = {
    ACTIVE:    { label: 'Activa',     color: 'text-lt-green' },
    FINISHED:  { label: 'Finalizada', color: 'text-lt-muted2' },
    CANCELLED: { label: 'Cancelada',  color: 'text-lt-red' },
  }

  return (
    <div className="px-4 md:px-8 pt-4 md:pt-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lt-muted2 text-sm font-condensed">Gestión</p>
          <h1 className="text-lt-white font-bebas text-3xl leading-tight">Mis Ligas</h1>
        </div>
        <Link
          href="/dashboard/ligas/nueva"
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-btn bg-lt-amber text-lt-black font-condensed text-sm font-700 active:scale-95 transition-all"
        >
          <span className="text-lg leading-none">+</span>
          Nueva liga
        </Link>
      </div>

      {leagues.length === 0 ? (
        <div className="bg-lt-card rounded-card border border-[rgba(255,255,255,0.07)] p-8 text-center">
          <span className="text-4xl block mb-3">🏆</span>
          <p className="font-condensed text-base text-lt-white font-700">Sin ligas todavía</p>
          <p className="text-lt-muted2 font-barlow text-sm mt-1 mb-5">
            Crea tu primera liga para que tus clientes compitan
          </p>
          <Link
            href="/dashboard/ligas/nueva"
            className="inline-block bg-lt-amber text-lt-black font-condensed font-700 text-sm px-5 py-2.5 rounded-btn"
          >
            Crear liga
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {leagues.map((league) => {
            const st = STATUS_MAP[league.status] ?? { label: league.status, color: 'text-lt-muted2' }
            return (
              <Link
                key={league.id}
                href={`/dashboard/ligas/${league.id}`}
                className="block bg-lt-card rounded-card border border-[rgba(255,255,255,0.07)] p-4 hover:border-lt-amber/30 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-condensed text-base font-700 text-lt-white truncate flex-1">
                    {league.name}
                  </h3>
                  <span className={cn('font-condensed text-xs font-700 ml-3 flex-shrink-0', st.color)}>
                    {st.label}
                  </span>
                </div>
                {league.description && (
                  <p className="text-lt-muted2 font-barlow text-xs mb-2 truncate">{league.description}</p>
                )}
                <div className="flex items-center gap-4">
                  <span className="font-condensed text-xs text-lt-muted2">
                    👥 {league._count.members}/{league.maxMembers}
                  </span>
                  <span className="font-condensed text-xs text-lt-muted2">
                    Código: <span className="text-lt-amber font-700">{league.inviteCode}</span>
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
