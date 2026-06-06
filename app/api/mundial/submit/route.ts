import { NextResponse } from 'next/server'
import { requireAuth, isAuthError } from '@/lib/auth-guard'
import { prisma } from '@/lib/prisma'
import { getVisiblePool, poolIsOpen } from '@/lib/mundial'

// POST /api/mundial/submit — bloquea definitivamente las respuestas del usuario
export async function POST() {
  const authResult = await requireAuth()
  if (isAuthError(authResult)) return authResult
  const { session } = authResult

  const pool = await getVisiblePool()
  if (!pool) return NextResponse.json({ error: 'No hay polla activa' }, { status: 404 })
  if (!poolIsOpen(pool)) {
    return NextResponse.json({ error: 'La polla está cerrada' }, { status: 400 })
  }

  const entry = await prisma.poolEntry.findUnique({
    where: { poolId_userId: { poolId: pool.id, userId: session.user.id } },
    include: { answers: true },
  })
  if (!entry || entry.status !== 'CONFIRMED') {
    return NextResponse.json(
      { error: 'Tu inscripción no está confirmada' },
      { status: 403 }
    )
  }
  if (entry.submittedAt) {
    return NextResponse.json({ error: 'Ya enviaste tus respuestas' }, { status: 400 })
  }

  // Exigir que todas las preguntas estén respondidas
  const totalQuestions = await prisma.poolQuestion.count({ where: { poolId: pool.id } })
  const answeredIds = new Set(entry.answers.map((a) => a.questionId))
  if (answeredIds.size < totalQuestions) {
    return NextResponse.json(
      {
        error: `Faltan respuestas: ${totalQuestions - answeredIds.size} pregunta(s) sin contestar`,
      },
      { status: 400 }
    )
  }

  const updated = await prisma.poolEntry.update({
    where: { id: entry.id },
    data: { submittedAt: new Date() },
  })

  return NextResponse.json({ data: { submittedAt: updated.submittedAt } })
}
