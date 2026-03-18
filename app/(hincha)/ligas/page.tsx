import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { LeagueCard } from '@/components/hincha/LeagueCard'
import { LigasActions } from './_components/LigasActions'
import Link from 'next/link'
import type { LeagueWithDetails } from '@/types'

export default async function LigasPage() {
  const session = await auth()
  if (!session) return null

  const memberships = await prisma.leagueMember.findMany({
    where: { userId: session.user.id },
    include: {
      league: {
        include: {
          business: { select: { id: true, name: true, logoUrl: true } },
          _count: { select: { members: true } },
        },
      },
    },
    orderBy: { joinedAt: 'desc' },
  })

  const myLeagues = memberships.map((m) => ({
    league: m.league as unknown as LeagueWithDetails,
    userPoints: m.totalPoints,
  }))

  const active = myLeagues.filter(({ league }) => league.status === 'ACTIVE')
  const finished = myLeagues.filter(({ league }) => league.status !== 'ACTIVE')

  return (
    <div className="px-4 pt-4 pb-6 space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lt-white font-bebas text-4xl leading-none tracking-wide">MIS LIGAS</h1>
          <p className="text-lt-muted2 font-condensed text-sm mt-0.5">
            {active.length} liga{active.length !== 1 ? 's' : ''} activa{active.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="bg-lt-card2 border border-lt-muted rounded-card px-3 py-2 text-center min-w-[52px]">
          <p className="text-lt-green font-bebas text-3xl leading-none">{myLeagues.length}</p>
          <p className="text-lt-muted2 text-[10px] font-condensed uppercase tracking-wide">total</p>
        </div>
      </div>

      {/* Acciones: Crear + Unirse */}
      <LigasActions role={session.user.role} />

      {/* Ligas activas */}
      {active.length > 0 ? (
        <section className="space-y-3">
          <SectionTitle label="Activas" count={active.length} />
          {active.map(({ league, userPoints }) => (
            <LeagueCard key={league.id} league={league} userPoints={userPoints} />
          ))}
        </section>
      ) : (
        <EmptyState />
      )}

      {/* Ligas terminadas */}
      {finished.length > 0 && (
        <section className="space-y-3">
          <SectionTitle label="Finalizadas" count={finished.length} muted />
          {finished.map(({ league, userPoints }) => (
            <LeagueCard
              key={league.id}
              league={league}
              userPoints={userPoints}
              className="opacity-60"
            />
          ))}
        </section>
      )}

      {/* CTA explorar públicas */}
      <Link
        href="/ligas/publicas"
        className="flex items-center justify-between w-full bg-lt-card border border-dashed border-lt-muted rounded-card px-4 py-4 group hover:border-lt-green/40 transition-colors"
      >
        <div>
          <p className="text-lt-white font-condensed text-base font-700">
            Explorar ligas públicas
          </p>
          <p className="text-lt-muted2 text-xs font-barlow mt-0.5">
            Descubre ligas de otros hinchas y negocios
          </p>
        </div>
        <span className="text-lt-green text-xl group-hover:translate-x-1 transition-transform">
          →
        </span>
      </Link>
    </div>
  )
}

function SectionTitle({ label, count, muted }: { label: string; count: number; muted?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <h2 className={`font-condensed text-sm font-700 uppercase tracking-widest ${muted ? 'text-lt-muted2' : 'text-lt-white'}`}>
        {label}
      </h2>
      <span className={`text-xs font-condensed px-1.5 py-0.5 rounded-full ${muted ? 'bg-lt-card2 text-lt-muted2' : 'bg-lt-green/15 text-lt-green'}`}>
        {count}
      </span>
      <div className="flex-1 h-px bg-[rgba(255,255,255,0.05)]" />
    </div>
  )
}

function EmptyState() {
  return (
    <div className="bg-lt-card rounded-card border border-dashed border-lt-muted p-8 text-center space-y-3">
      <div className="text-4xl">🏆</div>
      <div>
        <p className="text-lt-white font-condensed text-lg font-700">
          Aún no estás en ninguna liga
        </p>
        <p className="text-lt-muted2 text-sm font-barlow mt-1 leading-snug">
          Crea la tuya o únete con un código de invitación
        </p>
      </div>
    </div>
  )
}
