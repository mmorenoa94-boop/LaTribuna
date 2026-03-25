import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/leagues/[id]/admin/reset
 * Reset all league points, predictions, and answers to start fresh.
 * Only the league creator can do this.
 */
export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const league = await prisma.league.findUnique({ where: { id: params.id } })
  if (!league || league.creatorId !== session.user.id) {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  }

  // Use a transaction to reset everything atomically
  await prisma.$transaction([
    // 1. Delete all predictions for this league's questions
    prisma.prediction.deleteMany({
      where: { question: { leagueId: params.id } },
    }),
    // 2. Delete all answers for this league's questions
    prisma.answer.deleteMany({
      where: { question: { leagueId: params.id } },
    }),
    // 3. Reset all questions to PENDING and clear correctAnswer
    prisma.leagueQuestion.updateMany({
      where: { leagueId: params.id },
      data: {
        status: 'PENDING',
        correctAnswer: null,
        resolvedAt: null,
        closedAt: null,
      },
    }),
    // 4. Reset all member points to 0
    prisma.leagueMember.updateMany({
      where: { leagueId: params.id },
      data: { totalPoints: 0 },
    }),
  ])

  return NextResponse.json({ success: true, message: 'Liga reiniciada correctamente' })
}
