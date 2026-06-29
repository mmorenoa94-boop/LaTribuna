import { prisma } from './prisma'
import type { Prisma } from '@prisma/client'
import type { PoolRankingEntry } from '@/types'
import {
  normalizeAnswer,
  computeBracketPoints,
  computeMatchPoints,
  compareRanking,
  prizeForPosition,
} from './mundial-scoring-pure'

// Re-export de la lógica pura para mantener compatibilidad con los imports existentes
export {
  normalizeAnswer,
  countPositionsCorrect,
  outcome,
  computeMatchPoints,
  closenessScore,
  compareRanking,
  prizeForPosition,
} from './mundial-scoring-pure'
export type { RankSortable, ClosenessReals } from './mundial-scoring-pure'

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
      if (q.correctAnswer == null) continue

      // El bracket de grupos NO se puntúa por respuesta: sus puntos (por posición
      // acertada) se calculan en recomputeEntryAggregates, robusto ante cambios de pointsValue.
      if (q.type === 'GROUP_RANK') continue

      if (q.isTiebreaker || q.pointsValue <= 0) continue

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
 * Resuelve UNA sola pregunta de forma incremental, SIN cerrar la polla.
 * - Preguntas con puntos: marca isCorrect/pointsEarned en cada respuesta de inscritos confirmados.
 * - Preguntas de desempate (sin puntos): no marcan puntos; su efecto (groupsCorrect,
 *   firstScorerCorrect, etc.) se refleja al recalcular agregados.
 * Requiere que la pregunta ya tenga correctAnswer. Misma lógica de comparación que resolvePool().
 */
export async function scoreQuestion(questionId: string) {
  const question = await prisma.poolQuestion.findUnique({ where: { id: questionId } })
  if (!question) throw new Error('Pregunta no encontrada')
  if (question.correctAnswer == null) throw new Error('La pregunta no tiene respuesta correcta')

  // El bracket (GROUP_RANK) se puntúa íntegramente en recomputeEntryAggregates
  // (por posición acertada). El resto de preguntas con puntos se marcan por respuesta.
  if (question.type !== 'GROUP_RANK' && !question.isTiebreaker && question.pointsValue > 0) {
    const answers = await prisma.poolAnswer.findMany({
      where: { questionId, entry: { poolId: question.poolId, status: 'CONFIRMED' } },
    })
    const ops: Prisma.PrismaPromise<unknown>[] = answers.map((ans) => {
      const isCorrect =
        normalizeAnswer(ans.answer) === normalizeAnswer(question.correctAnswer)
      return prisma.poolAnswer.update({
        where: { id: ans.id },
        data: { isCorrect, pointsEarned: isCorrect ? question.pointsValue : 0 },
      })
    })
    if (ops.length) await prisma.$transaction(ops)
  }

  await recomputeEntryAggregates(question.poolId)
  return { scored: true }
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
  // Detección semántica (no por rank, robusto ante reordenamientos del admin)
  const groupQuestion = questions.find((q) => q.type === 'GROUP_RANK')
  const totalGoalsQ = questions.find(
    (q) => q.type === 'NUMERIC' && q.isTiebreaker && q.category === 'GLOBAL'
  )
  const colombiaGoalsQ = questions.find(
    (q) => q.type === 'NUMERIC' && q.isTiebreaker && q.category === 'COLOMBIA'
  )
  const firstScorerQ = questions.find(
    (q) => q.type === 'PLAYER_PICK' && q.isTiebreaker && q.category === 'COLOMBIA'
  )

  const numericGuess = (
    q: { id: string } | undefined,
    map: Map<string, { answer: unknown }>
  ): number | null => {
    if (!q) return null
    const a = map.get(q.id)
    if (!a) return null
    const n = Number(a.answer)
    return Number.isFinite(n) ? n : null
  }

  const entries = await prisma.poolEntry.findMany({
    where: { poolId, status: 'CONFIRMED' },
    include: { answers: true, matchPredictions: true },
  })

  const ops: Prisma.PrismaPromise<unknown>[] = entries.map((entry) => {
    const answerByQ = new Map(entry.answers.map((a) => [a.questionId, a]))

    const answerPts = entry.answers.reduce((s, a) => s + a.pointsEarned, 0)
    const matchPts = entry.matchPredictions.reduce((s, m) => s + m.pointsEarned, 0)

    // Bracket de grupos: puntos por posición acertada + cache de posiciones (informativo).
    let groupsCorrect = 0
    let bracketPts = 0
    if (groupQuestion?.correctAnswer != null) {
      const ga = answerByQ.get(groupQuestion.id)
      if (ga) {
        const r = computeBracketPoints(ga.answer, groupQuestion.correctAnswer, groupQuestion.pointsValue)
        groupsCorrect = r.positionsCorrect
        bracketPts = r.earned
      }
    }

    const totalGoalsGuess = numericGuess(totalGoalsQ, answerByQ)
    const colombiaGoalsGuess = numericGuess(colombiaGoalsQ, answerByQ)

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
        totalPoints: answerPts + matchPts + bracketPts,
        groupsCorrect,
        totalGoalsGuess,
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
    include: {
      user: { select: { id: true, name: true, image: true } },
      matchPredictions: { select: { outcomeCorrect: true, exactCorrect: true } },
    },
  })

  const reals = { total: pool.totalGoalsReal, colombia: pool.colombiaGoalsReal }
  const split = (pool.prizeSplit as number[]) ?? [60, 30, 10]
  const pot = pool.entryFee * entries.length

  const sorted = [...entries].sort((a, b) => compareRanking(a, b, reals))

  return sorted.map((e, idx) => {
    const position = idx + 1
    const matchesCorrect = e.matchPredictions.filter((m) => m.outcomeCorrect).length
    const exactCorrect = e.matchPredictions.filter((m) => m.exactCorrect).length
    return {
      position,
      userId: e.user.id,
      name: e.user.name,
      image: e.user.image,
      totalPoints: e.totalPoints,
      groupsCorrect: e.groupsCorrect,
      matchesCorrect,
      exactCorrect,
      prize: prizeForPosition(position, split, pot),
    }
  })
}
