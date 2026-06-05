import { prisma } from './prisma'
import type { Prisma } from '@prisma/client'
import type { PoolRankingEntry } from '@/types'
import {
  normalizeAnswer,
  countGroupsCorrect,
  computeMatchPoints,
  compareRanking,
  prizeForPosition,
} from './mundial-scoring-pure'

// Re-export de la lógica pura para mantener compatibilidad con los imports existentes
export {
  normalizeAnswer,
  countGroupsCorrect,
  outcome,
  computeMatchPoints,
  closenessScore,
  compareRanking,
  prizeForPosition,
} from './mundial-scoring-pure'
export type { RankSortable } from './mundial-scoring-pure'

/**
 * Resuelve la polla completa:
 * 1. Marca cada PoolAnswer (isCorrect / pointsEarned) para preguntas con puntos.
 * 2. Calcula caches de desempate por entry (groupsCorrect, colombiaGoalsGuess, firstScorerCorrect).
 * 3. Suma totalPoints y persiste todo en una transacción.
 *
 * Requiere que las preguntas ya tengan correctAnswer (set por el admin) y que
 * el pool tenga colombiaGoalsReal para el desempate de cercanía.
 */
export async function resolvePool(poolId: string) {
  const pool = await prisma.worldCupPool.findUnique({
    where: { id: poolId },
    include: { questions: true },
  })
  if (!pool) throw new Error('Pool no encontrado')

  const questions = pool.questions

  const entries = await prisma.poolEntry.findMany({
    where: { poolId, status: 'CONFIRMED' },
    include: { answers: true },
  })

  // 1. Marcar isCorrect / pointsEarned en cada respuesta (preguntas con puntos)
  const ops: Prisma.PrismaPromise<unknown>[] = []
  for (const entry of entries) {
    const answerByQ = new Map(entry.answers.map((a) => [a.questionId, a]))
    for (const q of questions) {
      const ans = answerByQ.get(q.id)
      if (!ans) continue
      if (q.isTiebreaker || q.pointsValue <= 0 || q.correctAnswer == null) continue

      const isCorrect =
        normalizeAnswer(ans.answer) === normalizeAnswer(q.correctAnswer)
      ops.push(
        prisma.poolAnswer.update({
          where: { id: ans.id },
          data: { isCorrect, pointsEarned: isCorrect ? q.pointsValue : 0 },
        })
      )
    }
  }
  if (ops.length) await prisma.$transaction(ops)

  // 2. Recalcular totales (respuestas + partidos) y caches de desempate
  await recomputeEntryAggregates(poolId)

  // 3. Marcar la polla como resuelta
  await prisma.worldCupPool.update({
    where: { id: poolId },
    data: { status: 'RESOLVED' },
  })

  return { entriesScored: entries.length }
}

/**
 * Califica las predicciones de UN partido ya finalizado (con homeScore/awayScore).
 * Resultado correcto (1X2) → matchPointsOutcome; marcador exacto → + matchPointsExactBonus.
 * Luego recalcula los totales de los participantes afectados.
 */
export async function scoreMatchPredictions(matchId: string) {
  const match = await prisma.poolMatch.findUnique({
    where: { id: matchId },
    include: { pool: true, predictions: true },
  })
  if (!match) throw new Error('Partido no encontrado')
  if (match.homeScore == null || match.awayScore == null) {
    throw new Error('El partido no tiene marcador real')
  }

  const ptsOutcome = match.pool.matchPointsOutcome
  const ptsExactBonus = match.pool.matchPointsExactBonus

  const ops: Prisma.PrismaPromise<unknown>[] = match.predictions.map((p) => {
    const { outcomeCorrect, exactCorrect, earned } = computeMatchPoints(
      p.homePredict,
      p.awayPredict,
      match.homeScore!,
      match.awayScore!,
      ptsOutcome,
      ptsExactBonus
    )
    return prisma.poolMatchPrediction.update({
      where: { id: p.id },
      data: { outcomeCorrect, exactCorrect, pointsEarned: earned },
    })
  })
  if (ops.length) await prisma.$transaction(ops)

  await recomputeEntryAggregates(match.poolId)

  return { scored: match.predictions.length }
}

/**
 * Recalcula totalPoints (respuestas + partidos) y los caches de desempate
 * de todos los participantes confirmados de la polla. Idempotente.
 */
export async function recomputeEntryAggregates(poolId: string) {
  const pool = await prisma.worldCupPool.findUnique({
    where: { id: poolId },
    include: { questions: true },
  })
  if (!pool) return

  const questions = pool.questions
  const groupQuestion = questions.find((q) => q.type === 'GROUP_RANK')
  const colombiaGoalsQ = questions.find((q) => q.type === 'NUMERIC' && q.isTiebreaker)
  const firstScorerQ = questions.find((q) => q.isTiebreaker && q.tiebreakRank === 3)

  const entries = await prisma.poolEntry.findMany({
    where: { poolId, status: 'CONFIRMED' },
    include: { answers: true, matchPredictions: true },
  })

  const ops: Prisma.PrismaPromise<unknown>[] = entries.map((entry) => {
    const answerByQ = new Map(entry.answers.map((a) => [a.questionId, a]))

    const answerPts = entry.answers.reduce((s, a) => s + a.pointsEarned, 0)
    const matchPts = entry.matchPredictions.reduce((s, m) => s + m.pointsEarned, 0)

    let groupsCorrect = 0
    if (groupQuestion?.correctAnswer != null) {
      const ga = answerByQ.get(groupQuestion.id)
      if (ga) groupsCorrect = countGroupsCorrect(ga.answer, groupQuestion.correctAnswer)
    }

    let colombiaGoalsGuess: number | null = null
    if (colombiaGoalsQ) {
      const ca = answerByQ.get(colombiaGoalsQ.id)
      if (ca) {
        const n = Number(ca.answer)
        colombiaGoalsGuess = Number.isFinite(n) ? n : null
      }
    }

    let firstScorerCorrect = false
    if (firstScorerQ?.correctAnswer != null) {
      const fa = answerByQ.get(firstScorerQ.id)
      if (fa) {
        firstScorerCorrect =
          normalizeAnswer(fa.answer) === normalizeAnswer(firstScorerQ.correctAnswer)
      }
    }

    return prisma.poolEntry.update({
      where: { id: entry.id },
      data: {
        totalPoints: answerPts + matchPts,
        groupsCorrect,
        colombiaGoalsGuess,
        firstScorerCorrect,
      },
    })
  })

  if (ops.length) await prisma.$transaction(ops)
}

/**
 * Construye el ranking ordenado por la cascada de desempate:
 * 1. totalPoints DESC
 * 2. groupsCorrect DESC
 * 3. cercanía a colombiaGoalsReal sin pasarse (closest wins; el que se pasa va después)
 * 4. firstScorerCorrect DESC
 * 5. createdAt ASC (quien se inscribió primero)
 */
export async function buildRanking(poolId: string): Promise<PoolRankingEntry[]> {
  const pool = await prisma.worldCupPool.findUnique({ where: { id: poolId } })
  if (!pool) return []

  const entries = await prisma.poolEntry.findMany({
    where: { poolId, status: 'CONFIRMED' },
    include: { user: { select: { id: true, name: true, image: true } } },
  })

  const real = pool.colombiaGoalsReal
  const split = (pool.prizeSplit as number[]) ?? [60, 30, 10]
  const pot = pool.entryFee * entries.length

  const sorted = [...entries].sort((a, b) => compareRanking(a, b, real))

  return sorted.map((e, idx) => {
    const position = idx + 1
    return {
      position,
      userId: e.user.id,
      name: e.user.name,
      image: e.user.image,
      totalPoints: e.totalPoints,
      groupsCorrect: e.groupsCorrect,
      prize: prizeForPosition(position, split, pot),
    }
  })
}
