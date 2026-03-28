import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/leagues/[id]/leave
 * A member voluntarily leaves a league.
 * The league creator cannot leave their own league.
 * Cascade deletes: answers → predictions → leagueMember
 */
export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const userId = session.user.id

  // Verify league exists
  const league = await prisma.league.findUnique({
    where: { id: params.id },
    select: { id: true, creatorId: true },
  })
  if (!league) return NextResponse.json({ error: 'Liga no encontrada' }, { status: 404 })

  // Creator cannot leave their own league
  if (league.creatorId === userId) {
    return NextResponse.json(
      { error: 'El creador no puede abandonar su propia liga. Transfiere la liga o elimínala.' },
      { status: 400 }
    )
  }

  // Verify membership
  const member = await prisma.leagueMember.findUnique({
    where: { leagueId_userId: { leagueId: params.id, userId } },
  })
  if (!member) return NextResponse.json({ error: 'No eres miembro de esta liga' }, { status: 404 })

  // Get question IDs for cascade delete
  const questions = await prisma.leagueQuestion.findMany({
    where: { leagueId: params.id },
    select: { id: true },
  })
  const qIds = questions.map((q) => q.id)

  if (qIds.length > 0) {
    // Delete user's answers in this league's questions
    await prisma.answer.deleteMany({
      where: { userId, questionId: { in: qIds } },
    })
    // Delete user's predictions in this league's questions
    await prisma.prediction.deleteMany({
      where: { userId, questionId: { in: qIds } },
    })
  }

  // Delete the membership
  await prisma.leagueMember.delete({
    where: { leagueId_userId: { leagueId: params.id, userId } },
  })

  return NextResponse.json({ ok: true })
}
