import { NextResponse } from 'next/server'
import { requireAuth, isAuthError } from '@/lib/auth-guard'
import { prisma } from '@/lib/prisma'
import { getVisiblePool } from '@/lib/mundial'
import type { PoolStateResponse, PoolQuestionPublic } from '@/types'

// GET /api/mundial — estado de la polla para el usuario actual
export async function GET() {
  const authResult = await requireAuth()
  if (isAuthError(authResult)) return authResult
  const { session } = authResult

  const pool = await getVisiblePool()

  if (!pool) {
    const empty: PoolStateResponse = {
      pool: null,
      entry: null,
      questions: [],
      myAnswers: {},
      confirmedCount: 0,
    }
    return NextResponse.json(empty)
  }

  const [entry, questions, confirmedCount] = await Promise.all([
    prisma.poolEntry.findUnique({
      where: { poolId_userId: { poolId: pool.id, userId: session.user.id } },
      include: { answers: true },
    }),
    prisma.poolQuestion.findMany({
      where: { poolId: pool.id },
      orderBy: { order: 'asc' },
    }),
    prisma.poolEntry.count({ where: { poolId: pool.id, status: 'CONFIRMED' } }),
  ])

  const publicQuestions: PoolQuestionPublic[] = questions.map((q) => ({
    id: q.id,
    order: q.order,
    text: q.text,
    type: q.type,
    category: q.category,
    options: q.options,
    pointsValue: q.pointsValue,
    isTiebreaker: q.isTiebreaker,
  }))

  const myAnswers: Record<string, unknown> = {}
  if (entry) {
    for (const a of entry.answers) myAnswers[a.questionId] = a.answer
  }

  const response: PoolStateResponse = {
    pool: {
      id: pool.id,
      name: pool.name,
      season: pool.season,
      entryFee: pool.entryFee,
      prizeSplit: (pool.prizeSplit as number[]) ?? [60, 30, 10],
      status: pool.status,
      lockAt: pool.lockAt ? pool.lockAt.toISOString() : null,
      nequiNumber: pool.nequiNumber,
      whatsappUrl: pool.whatsappUrl,
    },
    entry: entry
      ? {
          id: entry.id,
          status: entry.status,
          submittedAt: entry.submittedAt ? entry.submittedAt.toISOString() : null,
        }
      : null,
    questions: publicQuestions,
    myAnswers,
    confirmedCount,
  }

  return NextResponse.json(response)
}
