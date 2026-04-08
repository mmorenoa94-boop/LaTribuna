import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { XPBar } from '@/components/hincha/XPBar'
import { XPExplainer } from '@/components/hincha/XPExplainer'
import { AchievementsGrid } from '@/components/hincha/AchievementsGrid'
import { LeagueCard } from '@/components/hincha/LeagueCard'
import { PromoBanner } from '@/components/hincha/PromoBanner'
import { NotifBanner } from '@/components/hincha/NotifBanner'
// PushPrompt disabled — SW registration issues on production, using in-app toasts instead
// import { PushPrompt } from '@/components/hincha/PushPrompt'
import type { LeagueWithDetails } from '@/types'
import Link from 'next/link'

export default async function HomePage() {
  const session = await auth()
  if (!session) return null

  const [user, myLeagues] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, level: true, xp: true, streak: true },
    }),
    prisma.leagueMember.findMany({
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
      take: 3,
    }),
  ])

  return (
    <div className="px-4 pt-4 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-lt-muted2 text-sm font-condensed">Bienvenido de vuelta</p>
          <h1 className="text-lt-white font-bebas text-3xl leading-tight">{user?.name}</h1>
          {user?.streak ? (
            <p className="text-lt-amber text-xs font-condensed mt-0.5">
              🔥 {user.streak} días de racha
            </p>
          ) : null}
        </div>
        <div className="text-right">
          <p className="text-lt-muted2 text-xs font-condensed">Nivel</p>
          <p className="text-lt-green font-bebas text-4xl leading-none">{user?.level}</p>
        </div>
      </div>

      {/* XP Bar */}
      {user && (
        <>
          <XPBar xp={user.xp} level={user.level} />
          <XPExplainer />
        </>
      )}

      {/* Achievements */}
      <AchievementsGrid compact />

      {/* Admin notifications (reminders, messages) */}
      <NotifBanner />

      {/* Promotion banners */}
      <PromoBanner />

      {/* Mis ligas */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lt-white font-condensed text-lg font-700 uppercase tracking-wide">
            Mis ligas
          </h2>
          <Link href="/ligas" className="text-lt-green text-sm font-condensed">
            Ver todas →
          </Link>
        </div>
        {myLeagues.length > 0 ? (
          <div className="space-y-2">
            {myLeagues.map(({ league, totalPoints }) => (
              <LeagueCard key={league.id} league={league as LeagueWithDetails} userPoints={totalPoints} />
            ))}
          </div>
        ) : (
          <div className="bg-lt-card rounded-card border border-dashed border-lt-muted p-6 text-center">
            <p className="text-lt-muted2 font-condensed text-sm mb-3">
              Aún no estás en ninguna liga
            </p>
            <Link
              href="/ligas"
              className="inline-block bg-lt-green text-lt-black font-condensed font-700 text-sm px-4 py-2 rounded-btn"
            >
              Unirme a una liga
            </Link>
          </div>
        )}
      </section>
    </div>
  )
}
