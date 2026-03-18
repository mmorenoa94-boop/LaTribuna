import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const serverTimestamp = Date.now()
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { questionId, answer } = await req.json()
  if (!questionId || !answer) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  const question = await prisma.leagueQuestion.findUnique({ where: { id: questionId } })

  if (!question || question.status !== 'OPEN') {
    return NextResponse.json({ error: 'Pregunta cerrada' }, { status: 400 })
  }

  if (question.closedAt && serverTimestamp > question.closedAt.getTime()) {
    return NextResponse.json({ error: 'Tiempo agotado' }, { status: 400 })
  }

  const saved = await prisma.answer.upsert({
    where: { userId_questionId: { userId: session.user.id, questionId } },
    create: {
      userId: session.user.id,
      questionId,
      answer,
      answeredAt: new Date(serverTimestamp),
    },
    update: {
      answer,
      answeredAt: new Date(serverTimestamp),
    },
  })

  return NextResponse.json(saved)
}
