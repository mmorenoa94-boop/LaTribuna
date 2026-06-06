import { NextResponse } from 'next/server'
import { requireAuth, isAuthError } from '@/lib/auth-guard'
import { prisma } from '@/lib/prisma'
import { getVisiblePool, poolIsOpen } from '@/lib/mundial'
import { poolAnswersSchema } from '@/lib/validations'
import type { Prisma } from '@prisma/client'

// PUT /api/mundial/answers — guardado masivo (upsert) de respuestas del usuario
export async function PUT(req: Request) {
  const authResult = await requireAuth()
  if (isAuthError(authResult)) return authResult
  const { session } = authResult

  const pool = await getVisiblePool()
  if (!pool) return NextResponse.json({ error: 'No hay polla activa' }, { status: 404 })
  if (!poolIsOpen(pool)) {
    return NextResponse.json(
      { error: 'La polla está cerrada para edición' },
      { status: 400 }
    )
  }

  const entry = await prisma.poolEntry.findUnique({
    where: { poolId_userId: { poolId: pool.id, userId: session.user.id } },
  })
  if (!entry || entry.status !== 'CONFIRMED') {
    return NextResponse.json(
      { error: 'Tu inscripción no está confirmada' },
      { status: 403 }
    )
  }
  if (entry.submittedAt) {
    return NextResponse.json(
      { error: 'Ya enviaste tus respuestas definitivas' },
      { status: 400 }
    )
  }

  const body = await req.json().catch(() => null)
  const parsed = poolAnswersSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Respuestas inválidas' }, { status: 400 })
  }

  // Validar que todos los questionId pertenezcan a la polla
  const validIds = new Set(
    (await prisma.poolQuestion.findMany({
      where: { poolId: pool.id },
      select: { id: true },
    })).map((q) => q.id)
  )

  const ops = parsed.data.answers
    .filter((a) => validIds.has(a.questionId))
    .map((a) =>
      prisma.poolAnswer.upsert({
        where: { entryId_questionId: { entryId: entry.id, questionId: a.questionId } },
        create: {
          entryId: entry.id,
          questionId: a.questionId,
          answer: a.answer as Prisma.InputJsonValue,
        },
        update: { answer: a.answer as Prisma.InputJsonValue },
      })
    )

  await prisma.$transaction(ops)

  return NextResponse.json({ data: { saved: ops.length } })
}
