import { redirect, notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AdminShell } from '@/components/league-admin'
import type { MatchRow, QuestionRow } from '@/components/league-admin'

export const dynamic = 'force-dynamic'

interface Props {
  params: { id: string }
  searchParams: { matchId?: string }
}

export default async function LeagueAdminPage({ params, searchParams }: Props) {
  const session = await auth()
  if (!session) redirect('/login')
  if (session.user.role !== 'NEGOCIO') redirect('/home')

  const league = await prisma.league.findUnique({
    where: { id: params.id },
    select: {
      id: true, name: true, description: true, type: true, maxMembers: true,
      allowRemote: true, allowMemberInvites: true, requireApproval: true,
      minConsumption: true, minConsumptionAmount: true,
      scoringMode: true, matchMode: true, creatorId: true,
      bannerUrl: true, themeColor: true, businessId: true,
      inviteCode: true, status: true,
      _count: { select: { members: true } },
    },
  })

  if (!league || league.creatorId !== session.user.id) notFound()

  // Load members
  const members = await prisma.leagueMember.findMany({
    where: { leagueId: league.id },
    include: { user: { select: { id: true, name: true, image: true, email: true } } },
    orderBy: [{ status: 'asc' }, { joinedAt: 'desc' }],
  })

  // Load matches
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

  const initialMatches: MatchRow[] = leagueMatches.map((lm) => ({
    id: lm.match.id,
    homeTeam: lm.match.homeTeam,
    awayTeam: lm.match.awayTeam,
    competition: lm.match.competition,
    venue: lm.match.venue,
    kickoffAt: lm.match.kickoffAt.toISOString(),
    status: lm.match.status,
    homeScore: lm.match.homeScore,
    awayScore: lm.match.awayScore,
    questionCount: countMap[lm.matchId] ?? 0,
  }))

  // Load questions if matchId is in URL
  const matchId = searchParams.matchId ?? null
  let initialQuestions: QuestionRow[] = []
  if (matchId) {
    const qs = await prisma.leagueQuestion.findMany({
      where: { leagueId: params.id, matchId },
      orderBy: { orderIndex: 'asc' },
      include: { _count: { select: { answers: true, predictions: true } } },
    })
    initialQuestions = qs.map((q) => ({
      id: q.id,
      text: q.text,
      type: q.type,
      options: q.options as string[],
      pointsValue: q.pointsValue,
      timing: q.timing,
      status: q.status,
      orderIndex: q.orderIndex,
      correctAnswer: q.correctAnswer,
      openAt: q.openAt?.toISOString() ?? null,
      closedAt: q.closedAt?.toISOString() ?? null,
      resolvedAt: q.resolvedAt?.toISOString() ?? null,
      winnersCount: q.winnersCount,
      totalPot: q.totalPot,
      _count: q._count,
    }))
  }

  return (
    <AdminShell
      league={{
        id: league.id,
        name: league.name,
        description: league.description,
        inviteCode: league.inviteCode,
        allowRemote: league.allowRemote,
        requireApproval: league.requireApproval,
        allowMemberInvites: league.allowMemberInvites,
        minConsumption: league.minConsumption,
        minConsumptionAmount: league.minConsumptionAmount,
        type: league.type,
        matchMode: league.matchMode,
        scoringMode: league.scoringMode,
        maxMembers: league.maxMembers,
        status: league.status,
        memberCount: league._count.members,
        bannerUrl: league.bannerUrl,
        themeColor: league.themeColor ?? '#00E676',
        hasLinkedBusiness: !!league.businessId,
      }}
      members={members.map((m) => ({
        id: m.userId,
        name: m.user.name ?? 'Sin nombre',
        email: m.user.email ?? '',
        image: m.user.image,
        status: m.status,
        points: m.totalPoints,
        joinedAt: m.joinedAt.toISOString(),
        isCreator: m.userId === league.creatorId,
        consumptionVerified: m.consumptionVerified,
      }))}
      initialMatches={initialMatches}
      initialQuestions={initialQuestions}
      initialMatchId={matchId}
      backHref="/dashboard/ligas"
      defaultTab={matchId ? 'matches' : 'invite'}
    />
  )
}
