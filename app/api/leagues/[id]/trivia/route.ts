import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const matchId = searchParams.get('matchId')
  if (!matchId) return NextResponse.json({ error: 'matchId requerido' }, { status: 400 })

  const [member, match] = await Promise.all([
    prisma.leagueMember.findUnique({
      where: { leagueId_userId: { leagueId: params.id, userId: session.user.id } },
    }),
    prisma.match.findUnique({ where: { id: matchId } }),
  ])

  if (!member) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  if (!match) return NextResponse.json({ error: 'Partido no encontrado' }, { status: 404 })

  const [questions, leaderboard, league] = await Promise.all([
    prisma.leagueQuestion.findMany({
      where: { leagueId: params.id, matchId },
      orderBy: { orderIndex: 'asc' },
    }),
    prisma.leagueMember.findMany({
      where: { leagueId: params.id },
      orderBy: { totalPoints: 'desc' },
      take: 10,
      select: {
        userId: true,
        totalPoints: true,
        user: { select: { name: true, image: true, level: true } },
      },
    }),
    prisma.league.findUnique({
      where: { id: params.id },
      select: { id: true, name: true },
    }),
  ])

  const questionIds = questions.map((q) => q.id)
  const answers =
    questionIds.length > 0
      ? await prisma.answer.findMany({
          where: { userId: session.user.id, questionId: { in: questionIds } },
          select: {
            questionId: true,
            answer: true,
            isCorrect: true,
            pointsEarned: true,
          },
        })
      : []

  const myRank = leaderboard.findIndex((m) => m.userId === session.user.id) + 1

  return NextResponse.json({
    league,
    match,
    questions,
    answers,
    leaderboard,
    userId: session.user.id,
    myPoints: member.totalPoints,
    myRank,
  })
}
