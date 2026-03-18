/**
 * POST /api/seed/trivia
 * Crea un partido de prueba con preguntas para testear la pantalla de trivia.
 * Solo para desarrollo — remover antes de producción.
 */
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'No disponible en producción' }, { status: 403 })
  }

  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { leagueId, questionStatus } = await req.json()
  if (!leagueId) return NextResponse.json({ error: 'leagueId requerido' }, { status: 400 })

  // Verificar que el usuario es miembro
  const member = await prisma.leagueMember.findUnique({
    where: { leagueId_userId: { leagueId, userId: session.user.id } },
  })
  if (!member) return NextResponse.json({ error: 'No eres miembro' }, { status: 403 })

  // Buscar o crear partido de prueba
  let match = await prisma.match.findFirst({
    where: { externalId: 'test-match-001' },
  })

  if (!match) {
    match = await prisma.match.create({
      data: {
        externalId: 'test-match-001',
        homeTeam: 'América de Cali',
        awayTeam: 'Junior FC',
        homeLogo: null,
        awayLogo: null,
        competition: 'Liga BetPlay Dimayor',
        venue: 'Estadio Pascual Guerrero',
        kickoffAt: new Date(),
        status: 'LIVE',
        homeScore: 1,
        awayScore: 0,
        minutePlayed: 32,
      },
    })
  } else {
    // Actualizar estado
    await prisma.match.update({
      where: { id: match.id },
      data: { status: 'LIVE', homeScore: 1, awayScore: 0, minutePlayed: 32 },
    })
  }

  // Vincular partido a la liga
  await prisma.leagueMatch.upsert({
    where: { leagueId_matchId: { leagueId, matchId: match.id } },
    create: { leagueId, matchId: match.id },
    update: {},
  })

  // Crear preguntas de prueba (o actualizarlas)
  const now = Date.now()
  const qs = [
    {
      text: '¿Quién ganará el partido?',
      type: 'WINNER' as const,
      options: ['América de Cali', 'Junior FC', 'Empate'],
      pointsValue: 20,
      orderIndex: 0,
      timing: 'PRE_MATCH' as const,
      status: 'RESOLVED' as const,
      correctAnswer: 'América de Cali',
      openAt: new Date(now - 3600000),
      closedAt: new Date(now - 3000000),
      resolvedAt: new Date(now - 2000),
    },
    {
      text: '¿Cuántos goles marcará América en el partido?',
      type: 'SCORE' as const,
      options: ['0', '1', '2', '3 o más'],
      pointsValue: 30,
      orderIndex: 1,
      timing: 'PRE_MATCH' as const,
      status: 'RESOLVED' as const,
      correctAnswer: '2',
      openAt: new Date(now - 3600000),
      closedAt: new Date(now - 3000000),
      resolvedAt: new Date(now - 1500000),
    },
    {
      text: '¿Habrá gol antes del minuto 45?',
      type: 'YES_NO' as const,
      options: ['Sí', 'No'],
      pointsValue: 25,
      orderIndex: 2,
      timing: 'LIVE' as const,
      status: questionStatus === 'OPEN' ? 'OPEN' as const : 'CLOSED' as const,
      correctAnswer: questionStatus === 'OPEN' ? null : 'Sí',
      openAt: questionStatus === 'OPEN' ? new Date(now - 5000) : new Date(now - 120000),
      closedAt: questionStatus === 'OPEN' ? new Date(now + 90000) : new Date(now - 60000),
      resolvedAt: null,
    },
    {
      text: '¿Quién marcará el próximo gol?',
      type: 'SCORER' as const,
      options: ['Borja (América)', 'Morelo (Junior)', 'Duván Zapata', 'Otro'],
      pointsValue: 40,
      orderIndex: 3,
      timing: 'LIVE' as const,
      status: 'PENDING' as const,
      correctAnswer: null,
      openAt: null,
      closedAt: null,
      resolvedAt: null,
    },
  ]

  // Eliminar respuestas y preguntas anteriores (respetar FK order)
  const oldQuestions = await prisma.leagueQuestion.findMany({
    where: { leagueId, matchId: match.id },
    select: { id: true },
  })
  const oldIds = oldQuestions.map((q) => q.id)
  if (oldIds.length > 0) {
    await prisma.answer.deleteMany({ where: { questionId: { in: oldIds } } })
    await prisma.prediction.deleteMany({ where: { questionId: { in: oldIds } } })
    await prisma.leagueQuestion.deleteMany({ where: { id: { in: oldIds } } })
  }

  const questions = await Promise.all(
    qs.map((q) =>
      prisma.leagueQuestion.create({
        data: { ...q, leagueId, matchId: match!.id },
      })
    )
  )

  // Crear una respuesta de prueba para la pregunta 0 (ya resuelta)
  const q0 = questions[0]
  await prisma.answer.upsert({
    where: { userId_questionId: { userId: session.user.id, questionId: q0.id } },
    create: {
      userId: session.user.id,
      questionId: q0.id,
      answer: 'América de Cali',
      isCorrect: true,
      pointsEarned: 20,
    },
    update: { isCorrect: true, pointsEarned: 20 },
  })

  return NextResponse.json({
    matchId: match.id,
    leagueId,
    questionCount: questions.length,
    openQuestion: questions.find((q) => q.status === 'OPEN')?.id ?? null,
    url: `/ligas/${leagueId}/trivia?matchId=${match.id}`,
  })
}
