import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const business = await prisma.business.findUnique({
    where: { userId: session.user.id },
    include: {
      _count: { select: { leagues: true, promotions: true } },
    },
  })

  if (!business) redirect('/login')

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [checkinsToday, activeLeagues, totalMembers, recentCheckins] = await Promise.all([
    prisma.checkin.count({
      where: { businessId: business.id, checkedAt: { gte: today } },
    }),
    prisma.league.count({
      where: { businessId: business.id, status: 'ACTIVE' },
    }),
    prisma.leagueMember.count({
      where: { league: { businessId: business.id } },
    }),
    prisma.checkin.findMany({
      where: { businessId: business.id },
      orderBy: { checkedAt: 'desc' },
      take: 5,
      include: { user: { select: { name: true, image: true } } },
    }),
  ])

  const hasLeagues = business._count.leagues > 0

  return (
    <div className="px-4 md:px-8 pt-4 md:pt-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <p className="text-lt-muted2 text-sm font-condensed">Dashboard</p>
        <h1 className="text-lt-white font-bebas text-3xl md:text-4xl leading-tight">{business.name}</h1>
      </div>

      {/* Banner Polla Mundialista */}
      <Link
        href="/mundial"
        className="block rounded-card bg-gradient-to-r from-lt-green/20 to-lt-blue/10 border border-lt-green/40 px-4 py-3"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lt-green text-[11px] font-condensed uppercase tracking-widest">
              Mundial 2026
            </p>
            <p className="text-lt-white font-bebas text-2xl leading-none">Polla Mundialista</p>
            <p className="text-lt-muted2 text-xs">Participa y compite por el pozo →</p>
          </div>
          <span className="text-3xl">🏆</span>
        </div>
      </Link>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Check-ins hoy" value={checkinsToday} icon="📍" accent />
        <StatCard label="Ligas activas" value={activeLeagues} icon="🏆" />
        <StatCard label="Miembros totales" value={totalMembers} icon="👥" />
        <StatCard label="Promociones" value={business._count.promotions} icon="📢" />
      </div>

      {hasLeagues ? (
        <>
          {/* Recent Check-ins */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lt-white font-condensed text-lg font-700 uppercase tracking-wide">
                Check-ins recientes
              </h2>
            </div>
            {recentCheckins.length > 0 ? (
              <div className="space-y-2">
                {recentCheckins.map((c) => (
                  <div
                    key={c.id}
                    className="bg-lt-card rounded-btn border border-[rgba(255,255,255,0.07)] px-4 py-3 flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-lt-card2 flex items-center justify-center flex-shrink-0">
                      <span className="font-bebas text-sm text-lt-muted2">
                        {(c.user.name ?? '?').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-condensed text-sm text-lt-white truncate">{c.user.name ?? 'Anónimo'}</p>
                    </div>
                    <span className="font-condensed text-xs text-lt-muted2 flex-shrink-0">
                      {formatTime(c.checkedAt)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-lt-card rounded-card border border-[rgba(255,255,255,0.07)] p-6 text-center">
                <p className="text-lt-muted2 font-condensed text-sm">Sin check-ins aún</p>
              </div>
            )}
          </section>

          {/* Quick Actions */}
          <div className="grid grid-cols-3 gap-3">
            <Link
              href="/dashboard/ligas"
              className="bg-lt-card rounded-card border border-[rgba(255,255,255,0.07)] p-4 text-center hover:border-lt-amber/30 transition-colors"
            >
              <span className="text-2xl block mb-2">🏆</span>
              <p className="font-condensed text-sm font-700 text-lt-white">Ver ligas</p>
            </Link>
            <Link
              href="/dashboard/audiencia"
              className="bg-lt-card rounded-card border border-[rgba(255,255,255,0.07)] p-4 text-center hover:border-lt-amber/30 transition-colors"
            >
              <span className="text-2xl block mb-2">👥</span>
              <p className="font-condensed text-sm font-700 text-lt-white">Audiencia</p>
            </Link>
            <Link
              href="/dashboard/config"
              className="bg-lt-card rounded-card border border-[rgba(255,255,255,0.07)] p-4 text-center hover:border-lt-amber/30 transition-colors"
            >
              <span className="text-2xl block mb-2">⚙️</span>
              <p className="font-condensed text-sm font-700 text-lt-white">Mi negocio</p>
            </Link>
          </div>
        </>
      ) : (
        /* Empty state — Welcome card */
        <div className="bg-lt-card rounded-card border border-lt-amber/20 p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-lt-amber/15 border border-lt-amber/30 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🏟️</span>
          </div>
          <h2 className="font-bebas text-2xl text-lt-white mb-2">Bienvenido a La Tribuna</h2>
          <p className="text-lt-muted2 font-barlow text-sm leading-relaxed max-w-md mx-auto mb-6">
            Crea tu primera liga para que tus clientes jueguen trivia los días de partido.
            Fideliza, llena tu local y genera engagement como nunca antes.
          </p>
          <Link
            href="/dashboard/ligas/nueva"
            className="inline-flex items-center gap-2 bg-lt-amber text-lt-black font-condensed font-700 text-sm px-6 py-3 rounded-btn active:scale-[0.97] transition-all"
          >
            <span>+</span>
            Crear mi primera liga
          </Link>
        </div>
      )}
    </div>
  )
}

// ── Components ──────────────────────────────────────────────
function StatCard({
  label, value, icon, accent,
}: {
  label: string; value: number; icon: string; accent?: boolean
}) {
  return (
    <div className="bg-lt-card rounded-card border border-[rgba(255,255,255,0.07)] p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xl">{icon}</span>
      </div>
      <p className={`font-bebas text-3xl leading-none ${accent ? 'text-lt-amber' : 'text-lt-white'}`}>
        {value}
      </p>
      <p className="font-condensed text-xs text-lt-muted2 mt-1">{label}</p>
    </div>
  )
}

function formatTime(date: Date) {
  return new Date(date).toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Bogota',
  })
}
