import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/leagues/[id]/admin/questions/batch
 * Bulk-create multiple questions for a match at once.
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  // Only league creator can create questions
  const league = await prisma.league.findUnique({ where: { id: params.id } })
  if (!league || league.creatorId !== session.user.id) {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  }

  const body = await req.json()
  const { matchId, questions } = body as {
    matchId: string
    questions: {
      text: string
      type: string
      options: string[]
      pointsValue: number
      timing: string
    }[]
  }

  if (!matchId || !Array.isArray(questions) || questions.length === 0) {
    return NextResponse.json({ error: 'matchId y questions[] requeridos' }, { status: 400 })
  }

  if (questions.length > 20) {
    return NextResponse.json({ error: 'Máximo 20 preguntas por lote' }, { status: 400 })
  }

  // Verify match belongs to this league
  const leagueMatch = await prisma.leagueMatch.findUnique({
    where: { leagueId_matchId: { leagueId: params.id, matchId } },
  })
  if (!leagueMatch) {
    return NextResponse.json({ error: 'Partido no pertenece a esta liga' }, { status: 400 })
  }

  // Get current highest orderIndex for this match
  const lastQuestion = await prisma.leagueQuestion.findFirst({
    where: { leagueId: params.id, matchId },
    orderBy: { orderIndex: 'desc' },
    select: { orderIndex: true },
  })
  let nextIndex = (lastQuestion?.orderIndex ?? -1) + 1

  // Validate and prepare data
  const validTypes = ['WINNER', 'SCORE', 'SCORER', 'YES_NO', 'RANGE', 'CUSTOM']
  const validTimings = ['PRE_MATCH', 'LIVE']

  const createData = []
  for (const q of questions) {
    if (!q.text?.trim()) continue
    if (!validTypes.includes(q.type)) continue
    if (!validTimings.includes(q.timing)) continue
    if (!Array.isArray(q.options) || q.options.length < 2) continue

    const points = Math.min(Math.max(q.pointsValue ?? 20, 5), 100)

    createData.push({
      leagueId: params.id,
      matchId,
      text: q.text.trim(),
      type: q.type as 'WINNER' | 'SCORE' | 'SCORER' | 'YES_NO' | 'RANGE' | 'CUSTOM',
      options: q.options.map((o: string) => o.trim()).filter(Boolean),
      pointsValue: points,
      timing: q.timing as 'PRE_MATCH' | 'LIVE',
      orderIndex: nextIndex++,
      status: 'PENDING' as const,
    })
  }

  if (createData.length === 0) {
    return NextResponse.json({ error: 'Ninguna pregunta válida para crear' }, { status: 400 })
  }

  // Bulk create
  await prisma.leagueQuestion.createMany({ data: createData })

  // Fetch created questions to return with full data
  const created = await prisma.leagueQuestion.findMany({
    where: { leagueId: params.id, matchId },
    orderBy: { orderIndex: 'asc' },
    include: { _count: { select: { answers: true } } },
  })

  return NextResponse.json({ questions: created, count: createData.length })
}
