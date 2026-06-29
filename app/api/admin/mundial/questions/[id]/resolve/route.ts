import { NextResponse } from 'next/server'
import { requireAuth, isAuthError } from '@/lib/auth-guard'
import { prisma } from '@/lib/prisma'
import { questionResolveSchema } from '@/lib/validations'
import { scoreQuestion, recomputeEntryAggregates } from '@/lib/mundial-scoring'
import { Prisma } from '@prisma/client'

// POST /api/admin/mundial/questions/[id]/resolve
// Fija la respuesta correcta de UNA pregunta y calcula sus puntos/desempates
// SIN marcar la polla como RESUELTA (resolución incremental).
// correctAnswer = null → limpia la respuesta y resetea los puntos de esa pregunta.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const authResult = await requireAuth('SUPER_ADMIN')
  if (isAuthError(authResult)) return authResult

  const body = await req.json().catch(() => null)
  const parsed = questionResolveSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  const question = await prisma.poolQuestion.findUnique({ where: { id: params.id } })
  if (!question) {
    return NextResponse.json({ error: 'Pregunta no encontrada' }, { status: 404 })
  }

  // Limpiar resolución de esta pregunta
  if (parsed.data.correctAnswer === null) {
    await prisma.poolQuestion.update({
      where: { id: params.id },
      data: { correctAnswer: Prisma.DbNull },
    })
    await prisma.poolAnswer.updateMany({
      where: { questionId: params.id },
      data: { isCorrect: null, pointsEarned: 0 },
    })
    await recomputeEntryAggregates(question.poolId)
    return NextResponse.json({ data: { cleared: true } })
  }

  await prisma.poolQuestion.update({
    where: { id: params.id },
    data: { correctAnswer: parsed.data.correctAnswer as Prisma.InputJsonValue },
  })
  const result = await scoreQuestion(params.id)
  return NextResponse.json({ data: result })
}
