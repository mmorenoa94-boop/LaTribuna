import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/leagues/[id]/admin/participation?matchId=xxx
 * Returns per-match participation: which members answered and which didn't.
 * Only accessible by the league creator.
 */
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const league = await prisma.league.findUnique({ where: { id: params.id } })
  if (!league || league.creatorId !== session.user.id) {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  }

  const url = new URL(req.url)
  const matchId = url.searchParams.get('matchId')
  if (!matchId) {
    return NextResponse.json({ error: 'matchId requerido' }, { status: 400 })
  }

  // Get all questions for this match in this league
  const questions = await prisma.leagueQuestion.findMany({
    where: { leagueId: params.id, matchId },
    select: { id: true, text: true, status: true, type: true },
    orderBy: { orderIndex: 'asc' },
  })

  if (questions.length === 0) {
    return NextResponse.json({ questions: [], members: [], participation: {} })
  }

  // Get all league members
  const members = await prisma.leagueMember.findMany({
    where: { leagueId: params.id, status: 'APPROVED' },
    include: {
      user: { select: { id: true, name: true, image: true } },
    },
    orderBy: { totalPoints: 'desc' },
  })

  // Get all answers + predictions for these questions
  const questionIds = questions.map((q) => q.id)

  const [answers, predictions] = await Promise.all([
    prisma.answer.findMany({
      where: { questionId: { in: questionIds } },
      select: { questionId: true, userId: true, answer: true, isCorrect: true, pointsEarned: true },
    }),
    prisma.prediction.findMany({
      where: { questionId: { in: questionIds } },
      select: { questionId: true, userId: true, answer: true, isCorrect: true, pointsEarned: true },
    }),
  ])

  // Build participation map: { memberId: { questionId: answered? } }
  const allResponses = [...answers, ...predictions]
  const responseMap = new Map<string, Set<string>>() // userId → Set<questionId>

  for (const r of allResponses) {
    if (!responseMap.has(r.userId)) responseMap.set(r.userId, new Set())
    responseMap.get(r.userId)!.add(r.questionId)
  }

  // Build per-member summary
  const memberSummaries = members.map((m) => {
    const answeredIds = responseMap.get(m.userId) ?? new Set()
    const answeredCount = questionIds.filter((qid) => answeredIds.has(qid)).length
    return {
      userId: m.userId,
      userName: m.user.name,
      userImage: m.user.image,
      totalQuestions: questionIds.length,
      answeredCount,
      missingCount: questionIds.length - answeredCount,
      answeredAll: answeredCount === questionIds.length,
    }
  })

  // Separate into answered-all and missing
  const responded = memberSummaries.filter((m) => m.answeredAll)
  const missing = memberSummaries.filter((m) => !m.answeredAll)

  return NextResponse.json({
    questions: questions.map((q) => ({
      id: q.id,
      text: q.text,
      status: q.status,
      type: q.type,
    })),
    totalMembers: members.length,
    respondedCount: responded.length,
    missingCount: missing.length,
    responded,
    missing,
  })
}
