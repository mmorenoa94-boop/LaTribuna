import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/leagues/[id]/tv
 * Public endpoint (no auth) — returns everything needed for the TV display.
 * Designed to be polled every 5-10 seconds.
 */
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const league = await prisma.league.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      description: true,
      inviteCode: true,
      type: true,
      status: true,
      scoringMode: true,
      bannerUrl: true,
      themeColor: true,
      business: { select: { name: true, logoUrl: true } },
      prizes: { orderBy: { position: 'asc' }, take: 3 },
      _count: { select: { members: true } },
    },
  })

  if (!league) {
    return NextResponse.json({ error: 'Liga no encontrada' }, { status: 404 })
  }

  // Top 15 leaderboard
  const members = await prisma.leagueMember.findMany({
    where: { leagueId: params.id, status: 'APPROVED' },
    include: {
      user: { select: { name: true, image: true, level: true } },
    },
    orderBy: { totalPoints: 'desc' },
    take: 15,
  })

  const leaderboard = members.map((m, i) => ({
    rank: i + 1,
    name: m.user.name,
    image: m.user.image,
    level: m.user.level,
    totalPoints: m.totalPoints,
  }))

  // Active/recent matches (today ± 1 day)
  const now = new Date()
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const dayAhead = new Date(now.getTime() + 24 * 60 * 60 * 1000)

  const leagueMatches = await prisma.leagueMatch.findMany({
    where: {
      leagueId: params.id,
      match: { kickoffAt: { gte: dayAgo, lte: dayAhead } },
    },
    include: {
      match: {
        select: {
          id: true, homeTeam: true, awayTeam: true,
          homeLogo: true, awayLogo: true, competition: true,
          kickoffAt: true, status: true,
          homeScore: true, awayScore: true, minutePlayed: true,
        },
      },
    },
    orderBy: { match: { kickoffAt: 'asc' } },
  })

  const matches = leagueMatches.map((lm) => lm.match)

  // Currently active question (OPEN, most recent)
  const activeQuestion = await prisma.leagueQuestion.findFirst({
    where: { leagueId: params.id, status: 'OPEN' },
    select: {
      id: true, text: true, type: true, options: true,
      pointsValue: true, timing: true, closedAt: true,
      _count: { select: { answers: true, predictions: true } },
    },
    orderBy: { openAt: 'desc' },
  })

  // Last resolved question (for showing results briefly)
  const lastResolved = await prisma.leagueQuestion.findFirst({
    where: { leagueId: params.id, status: 'RESOLVED' },
    select: {
      id: true, text: true, correctAnswer: true,
      winnersCount: true, totalPot: true,
      resolvedAt: true,
    },
    orderBy: { resolvedAt: 'desc' },
  })

  return NextResponse.json({
    league,
    leaderboard,
    matches,
    activeQuestion,
    lastResolved,
    timestamp: now.toISOString(),
  })
}
