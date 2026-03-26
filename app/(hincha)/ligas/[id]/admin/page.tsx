import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AdminPanel } from './_components/AdminPanel'

interface Props {
  params: { id: string }
  searchParams: { matchId?: string }
}

export default async function AdminPage({ params, searchParams }: Props) {
  const session = await auth()
  if (!session) redirect('/login')

  // Solo el creador puede acceder
  const league = await prisma.league.findUnique({
    where: { id: params.id },
    select: { id: true, name: true, description: true, maxMembers: true, allowRemote: true, creatorId: true, bannerUrl: true, themeColor: true, businessId: true },
  })

  if (!league || league.creatorId !== session.user.id) {
    redirect(`/ligas/${params.id}`)
  }

  // Cargar partidos iniciales
  const leagueMatches = await prisma.leagueMatch.findMany({
    where: { leagueId: params.id },
    include: { match: true },
    orderBy: { match: { kickoffAt: 'asc' } },
  })

  const matchIds = leagueMatches.map((lm) => lm.matchId)
  const qCounts = matchIds.length
    ? await prisma.leagueQuestion.groupBy({
        by: ['matchId'],
        where: { leagueId: params.id, matchId: { in: matchIds } },
        _count: { id: true },
      })
    : []
  const countMap = Object.fromEntries(qCounts.map((q) => [q.matchId, q._count.id]))

  const initialMatches = leagueMatches.map((lm) => ({
    id: lm.match.id,
    homeTeam: lm.match.homeTeam,
    awayTeam: lm.match.awayTeam,
    competition: lm.match.competition,
    venue: lm.match.venue,
    kickoffAt: lm.match.kickoffAt.toISOString(),
    status: lm.match.status,
    questionCount: countMap[lm.matchId] ?? 0,
  }))

  // Cargar preguntas si viene matchId en la URL
  const matchId = searchParams.matchId ?? null
  let initialQuestions: object[] = []
  if (matchId) {
    const qs = await prisma.leagueQuestion.findMany({
      where: { leagueId: params.id, matchId },
      orderBy: { orderIndex: 'asc' },
      include: { _count: { select: { answers: true } } },
    })
    initialQuestions = qs.map((q) => ({
      ...q,
      options: q.options as string[],
      openAt: q.openAt?.toISOString() ?? null,
      closedAt: q.closedAt?.toISOString() ?? null,
      resolvedAt: q.resolvedAt?.toISOString() ?? null,
    }))
  }

  return (
    <AdminPanel
      leagueId={params.id}
      leagueName={league.name}
      leagueDescription={league.description}
      leagueMaxMembers={league.maxMembers}
      leagueAllowRemote={league.allowRemote}
      creatorId={league.creatorId}
      sessionUserId={session.user.id}
      initialMatches={initialMatches}
      initialQuestions={initialQuestions as Parameters<typeof AdminPanel>[0]['initialQuestions']}
      initialMatchId={matchId}
      initialBannerUrl={league.bannerUrl ?? null}
      initialThemeColor={league.themeColor ?? '#00E676'}
      hasLinkedBusiness={!!league.businessId}
    />
  )
}
