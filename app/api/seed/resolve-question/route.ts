/**
 * POST /api/seed/resolve-question
 * Resuelve una pregunta de prueba y actualiza las respuestas.
 * Solo para desarrollo.
 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'No disponible en producción' }, { status: 403 })
  }

  const { questionId, correctAnswer } = await req.json()
  if (!questionId || !correctAnswer) {
    return NextResponse.json({ error: 'Datos requeridos' }, { status: 400 })
  }

  const now = new Date()

  // Marcar pregunta como RESOLVED
  await prisma.leagueQuestion.update({
    where: { id: questionId },
    data: {
      status: 'RESOLVED',
      correctAnswer,
      resolvedAt: now,
      closedAt: now,
    },
  })

  // Marcar respuestas como correctas/incorrectas y asignar puntos
  const answers = await prisma.answer.findMany({ where: { questionId } })
  const question = await prisma.leagueQuestion.findUnique({ where: { id: questionId } })

  await Promise.all(
    answers.map(async (answer) => {
      const isCorrect = answer.answer === correctAnswer
      const pointsEarned = isCorrect ? (question?.pointsValue ?? 25) : 0
      await prisma.answer.update({
        where: { id: answer.id },
        data: { isCorrect, pointsEarned },
      })
      // Actualizar puntos en la liga del miembro
      if (isCorrect && question) {
        const member = await prisma.leagueMember.findFirst({
          where: { leagueId: question.leagueId, userId: answer.userId },
        })
        if (member) {
          await prisma.leagueMember.update({
            where: { id: member.id },
            data: { totalPoints: { increment: pointsEarned } },
          })
        }
      }
    })
  )

  return NextResponse.json({ ok: true, correctAnswer, resolved: answers.length })
}
