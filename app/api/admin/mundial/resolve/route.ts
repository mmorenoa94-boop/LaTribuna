import { NextResponse } from 'next/server'
import { requireAuth, isAuthError } from '@/lib/auth-guard'
import { prisma } from '@/lib/prisma'
import { getAdminPool } from '@/lib/mundial'
import { resolvePoolSchema } from '@/lib/validations'
import { resolvePool } from '@/lib/mundial-scoring'
import type { Prisma } from '@prisma/client'

// POST /api/admin/mundial/resolve — guarda respuestas correctas + goles reales
// Colombia y dispara el scoring de toda la polla.
export async function POST(req: Request) {
  const authResult = await requireAuth('SUPER_ADMIN')
  if (isAuthError(authResult)) return authResult

  const pool = await getAdminPool()
  if (!pool) return NextResponse.json({ error: 'No hay polla' }, { status: 404 })

  const body = await req.json().catch(() => null)
  const parsed = resolvePoolSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos inválidos', detail: parsed.error.flatten() },
      { status: 400 }
    )
  }

  // Persistir respuestas correctas por pregunta + goles reales de Colombia
  const ops: Prisma.PrismaPromise<unknown>[] = parsed.data.corrections.map((c) =>
    prisma.poolQuestion.update({
      where: { id: c.questionId },
      data: { correctAnswer: c.correctAnswer as Prisma.InputJsonValue },
    })
  )
  const poolData: Prisma.WorldCupPoolUpdateInput = {}
  if (parsed.data.colombiaGoalsReal !== undefined) {
    poolData.colombiaGoalsReal = parsed.data.colombiaGoalsReal
  }
  if (parsed.data.totalGoalsReal !== undefined) {
    poolData.totalGoalsReal = parsed.data.totalGoalsReal
  }
  if (Object.keys(poolData).length > 0) {
    ops.push(prisma.worldCupPool.update({ where: { id: pool.id }, data: poolData }))
  }
  await prisma.$transaction(ops)

  // Calcular puntos, desempates y marcar pool RESOLVED
  const result = await resolvePool(pool.id)

  return NextResponse.json({ data: result })
}
