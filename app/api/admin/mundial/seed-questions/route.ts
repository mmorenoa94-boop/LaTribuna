import { NextResponse } from 'next/server'
import { requireAuth, isAuthError } from '@/lib/auth-guard'
import { prisma } from '@/lib/prisma'
import { getAdminPool } from '@/lib/mundial'
import { buildSeedQuestions } from '@/lib/mundial-questions'
import type { Prisma } from '@prisma/client'

// POST /api/admin/mundial/seed-questions — inserta el set de preguntas por defecto.
// Sin ?reset=1: solo si la polla no tiene preguntas (evita duplicar).
// Con ?reset=1: borra las preguntas existentes (y sus respuestas) y vuelve a sembrar.
export async function POST(req: Request) {
  const authResult = await requireAuth('SUPER_ADMIN')
  if (isAuthError(authResult)) return authResult

  const pool = await getAdminPool()
  if (!pool) return NextResponse.json({ error: 'Crea la polla primero' }, { status: 404 })

  const reset = new URL(req.url).searchParams.get('reset') === '1'
  const existing = await prisma.poolQuestion.count({ where: { poolId: pool.id } })

  if (existing > 0 && !reset) {
    return NextResponse.json(
      { error: `La polla ya tiene ${existing} preguntas. Usa "Re-sembrar" para borrarlas y recrearlas.` },
      { status: 409 }
    )
  }
  if (reset && existing > 0) {
    // Las respuestas se borran en cascada (onDelete: Cascade)
    await prisma.poolQuestion.deleteMany({ where: { poolId: pool.id } })
  }

  const seed = buildSeedQuestions()
  await prisma.poolQuestion.createMany({
    data: seed.map((q) => ({
      poolId: pool.id,
      order: q.order,
      text: q.text,
      type: q.type,
      category: q.category,
      options: q.options as Prisma.InputJsonValue,
      pointsValue: q.pointsValue,
      isTiebreaker: q.isTiebreaker,
      tiebreakRank: q.tiebreakRank ?? null,
    })),
  })

  return NextResponse.json({ data: { created: seed.length } })
}
