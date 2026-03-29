import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function verifyCreator(leagueId: string, userId: string) {
  const league = await prisma.league.findUnique({ where: { id: leagueId } })
  return league?.creatorId === userId ? league : null
}

/**
 * GET /api/leagues/[id]/admin/questions/[qid]/answers
 * Returns all answers for a question, with user names.
 * Used by admins to see who answered what (participation tracking).
 */
export async function GET(
  _req: Request,
  { params }: { params: { id: string; qid: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const league = await verifyCreator(params.id, session.user.id)
  if (!league) return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })

  const question = await prisma.leagueQuestion.findUnique({
    where: { id: params.qid },
    select: { leagueId: true, correctAnswer: true },
  })
  if (!question || question.leagueId !== params.id) {
    return NextResponse.json({ error: 'Pregunta no encontrada' }, { status: 404 })
  }

  const answers = await prisma.answer.findMany({
    where: { questionId: params.qid },
    include: {
      user: { select: { name: true, image: true } },
    },
    orderBy: { answeredAt: 'asc' },
  })

  return NextResponse.json(
    answers.map((a) => ({
      userId: a.userId,
      answer: a.answer,
      isCorrect: a.isCorrect,
      pointsEarned: a.pointsEarned,
      answeredAt: a.answeredAt,
      userName: a.user.name,
      userImage: a.user.image,
    }))
  )
}
