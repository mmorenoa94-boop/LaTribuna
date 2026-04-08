import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/leagues/active-questions
 * Returns OPEN questions across all leagues the user belongs to.
 * Lightweight endpoint for polling — used by LiveQuestionAlert.
 */
export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const memberships = await prisma.leagueMember.findMany({
    where: { userId: session.user.id, status: 'APPROVED' },
    select: { leagueId: true },
  })

  if (memberships.length === 0) {
    return NextResponse.json({ questions: [] })
  }

  const leagueIds = memberships.map((m) => m.leagueId)

  const openQuestions = await prisma.leagueQuestion.findMany({
    where: {
      leagueId: { in: leagueIds },
      status: 'OPEN',
      timing: 'LIVE',
    },
    select: {
      id: true,
      text: true,
      leagueId: true,
      matchId: true,
      closedAt: true,
      pointsValue: true,
      league: { select: { name: true } },
    },
    orderBy: { openAt: 'desc' },
    take: 5,
  })

  return NextResponse.json({ questions: openQuestions })
}
