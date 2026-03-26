import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { emitQuestionClose } from '@/lib/socket-emit'

async function verifyCreator(leagueId: string, userId: string) {
  const league = await prisma.league.findUnique({ where: { id: leagueId } })
  return league?.creatorId === userId ? league : null
}

// GET: preguntas de un partido en esta liga
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const league = await verifyCreator(params.id, session.user.id)
  if (!league) return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const matchId = searchParams.get('matchId')
  if (!matchId) return NextResponse.json({ error: 'matchId requerido' }, { status: 400 })

  const questions = await prisma.leagueQuestion.findMany({
    where: { leagueId: params.id, matchId },
    orderBy: { orderIndex: 'asc' },
    include: { _count: { select: { answers: true } } },
  })

  return NextResponse.json(questions)
}

// POST: crear pregunta
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const league = await verifyCreator(params.id, session.user.id)
  if (!league) return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })

  const body = await req.json()
  const { matchId, text, type, options, pointsValue, timing } = body

  if (!matchId || !text?.trim() || !type || !Array.isArray(options) || options.length < 2 || !pointsValue || !timing) {
    return NextResponse.json(
      { error: 'matchId, text, type, options (min 2), pointsValue y timing son requeridos' },
      { status: 400 }
    )
  }

  // Verificar que el partido pertenece a esta liga
  const leagueMatch = await prisma.leagueMatch.findUnique({
    where: { leagueId_matchId: { leagueId: params.id, matchId } },
  })
  if (!leagueMatch) {
    return NextResponse.json({ error: 'Partido no vinculado a esta liga' }, { status: 400 })
  }

  const count = await prisma.leagueQuestion.count({
    where: { leagueId: params.id, matchId },
  })

  const question = await prisma.leagueQuestion.create({
    data: {
      leagueId: params.id,
      matchId,
      text: text.trim(),
      type,
      options,
      pointsValue: Number(pointsValue),
      timing,
      orderIndex: count,
      status: 'PENDING',
    },
    include: { _count: { select: { answers: true } } },
  })

  return NextResponse.json(question, { status: 201 })
}

// PATCH: bulk close all open questions for a match
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const league = await verifyCreator(params.id, session.user.id)
  if (!league) return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })

  const body = await req.json()
  const { action, matchId } = body

  if (action === 'close-all' && matchId) {
    const openQuestions = await prisma.leagueQuestion.findMany({
      where: { leagueId: params.id, matchId, status: 'OPEN' },
      select: { id: true },
    })

    if (openQuestions.length === 0) {
      return NextResponse.json({ error: 'No hay preguntas abiertas' }, { status: 400 })
    }

    const now = new Date()
    await prisma.leagueQuestion.updateMany({
      where: { id: { in: openQuestions.map((q) => q.id) } },
      data: { status: 'CLOSED', closedAt: now },
    })

    // Emit close event for each question
    for (const q of openQuestions) {
      await emitQuestionClose(params.id, matchId, { questionId: q.id })
    }

    // Return updated questions
    const updated = await prisma.leagueQuestion.findMany({
      where: { leagueId: params.id, matchId },
      orderBy: { orderIndex: 'asc' },
      include: { _count: { select: { answers: true } } },
    })

    return NextResponse.json(updated)
  }

  return NextResponse.json({ error: 'Acción inválida' }, { status: 400 })
}
