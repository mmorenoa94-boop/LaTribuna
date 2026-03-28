import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/leagues/[id]/predictions
// Guarda una predicción pre-partido (antes del kickoff)
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { questionId, answer } = await req.json()
  if (!questionId || !answer?.trim()) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  // Verificar que la pregunta pertenece a esta liga
  const question = await prisma.leagueQuestion.findFirst({
    where: { id: questionId, leagueId: params.id, timing: 'PRE_MATCH' },
  })

  if (!question) {
    return NextResponse.json({ error: 'Pregunta no encontrada' }, { status: 404 })
  }
  if (question.status !== 'OPEN') {
    return NextResponse.json({ error: 'Las predicciones para este partido ya están cerradas' }, { status: 400 })
  }

  // Verificar que el usuario es miembro de la liga
  const [member, league] = await Promise.all([
    prisma.leagueMember.findUnique({
      where: { leagueId_userId: { leagueId: params.id, userId: session.user.id } },
    }),
    prisma.league.findUnique({ where: { id: params.id }, select: { creatorId: true } }),
  ])
  if (!member) {
    return NextResponse.json({ error: 'No eres miembro de esta liga' }, { status: 403 })
  }
  if (league?.creatorId === session.user.id) {
    return NextResponse.json({ error: 'El administrador no puede hacer predicciones' }, { status: 403 })
  }

  // Upsert: si ya respondió esta pregunta, actualiza
  const prediction = await prisma.prediction.upsert({
    where: { userId_questionId: { userId: session.user.id, questionId } },
    create: {
      userId: session.user.id,
      questionId,
      answer: answer.trim(),
    },
    update: {
      answer: answer.trim(),
    },
  })

  return NextResponse.json(prediction, { status: 201 })
}

// GET /api/leagues/[id]/predictions — predicciones del usuario en esta liga
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const predictions = await prisma.prediction.findMany({
    where: { userId: session.user.id, question: { leagueId: params.id } },
  })

  return NextResponse.json(predictions)
}
