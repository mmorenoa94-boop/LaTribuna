import { describe, it, expect } from 'vitest'
import {
  normalizeAnswer,
  countGroupsCorrect,
  outcome,
  computeMatchPoints,
  closenessScore,
  compareRanking,
  prizeForPosition,
  type RankSortable,
} from '@/lib/mundial-scoring-pure'

describe('normalizeAnswer', () => {
  it('quita tildes, espacios y mayúsculas', () => {
    expect(normalizeAnswer('  Lionel Messi ')).toBe('lionel messi')
    expect(normalizeAnswer('Múñoz')).toBe('munoz')
    expect(normalizeAnswer('COLOMBIA')).toBe('colombia')
  })
  it('iguala respuestas equivalentes con distinto formato', () => {
    expect(normalizeAnswer('Brasil')).toBe(normalizeAnswer(' brasil '))
    expect(normalizeAnswer('Países Bajos')).toBe(normalizeAnswer('paises bajos'))
  })
  it('maneja null/undefined/números', () => {
    expect(normalizeAnswer(null)).toBe('')
    expect(normalizeAnswer(undefined)).toBe('')
    expect(normalizeAnswer(5)).toBe('5')
  })
})

describe('countGroupsCorrect', () => {
  const correct = {
    A: ['Colombia', 'Brasil'],
    B: ['Argentina', 'México'],
    C: ['España', 'Japón'],
  }

  it('cuenta solo los grupos con orden exacto correcto', () => {
    const user = {
      A: ['Colombia', 'Brasil'], // correcto
      B: ['México', 'Argentina'], // orden invertido → incorrecto
      C: ['España', 'Japón'], // correcto
    }
    expect(countGroupsCorrect(user, correct)).toBe(2)
  })

  it('es laxo con tildes y mayúsculas', () => {
    const user = { A: ['colombia', 'brasil'], B: [], C: ['  españa ', 'japon'] }
    expect(countGroupsCorrect(user, correct)).toBe(2)
  })

  it('devuelve 0 con entradas inválidas', () => {
    expect(countGroupsCorrect(null, correct)).toBe(0)
    expect(countGroupsCorrect({ A: ['Colombia'] }, correct)).toBe(0) // falta 2°
  })
})

describe('outcome', () => {
  it('determina local/visitante/empate', () => {
    expect(outcome(2, 0)).toBe('H')
    expect(outcome(0, 1)).toBe('A')
    expect(outcome(1, 1)).toBe('D')
  })
})

describe('computeMatchPoints', () => {
  it('marcador exacto da resultado + bono', () => {
    const r = computeMatchPoints(2, 1, 2, 1, 3, 2)
    expect(r).toEqual({ outcomeCorrect: true, exactCorrect: true, earned: 5 })
  })
  it('acertar resultado pero no marcador da solo el de resultado', () => {
    const r = computeMatchPoints(3, 1, 2, 1, 3, 2)
    expect(r).toEqual({ outcomeCorrect: true, exactCorrect: false, earned: 3 })
  })
  it('fallar resultado da 0', () => {
    const r = computeMatchPoints(0, 2, 2, 1, 3, 2)
    expect(r).toEqual({ outcomeCorrect: false, exactCorrect: false, earned: 0 })
  })
  it('empate exacto da resultado + bono', () => {
    const r = computeMatchPoints(1, 1, 1, 1, 3, 2)
    expect(r.earned).toBe(5)
  })
  it('empate con distinto marcador da solo resultado', () => {
    const r = computeMatchPoints(0, 0, 1, 1, 3, 2)
    expect(r).toEqual({ outcomeCorrect: true, exactCorrect: false, earned: 3 })
  })
})

describe('closenessScore', () => {
  it('menor diferencia es mejor cuando no se pasa', () => {
    expect(closenessScore(5, 6)).toBe(1)
    expect(closenessScore(6, 6)).toBe(0)
  })
  it('pasarse penaliza fuerte', () => {
    expect(closenessScore(7, 6)).toBeGreaterThan(closenessScore(0, 6))
  })
  it('null devuelve infinito', () => {
    expect(closenessScore(null, 6)).toBe(Number.POSITIVE_INFINITY)
    expect(closenessScore(5, null)).toBe(Number.POSITIVE_INFINITY)
  })
})

describe('compareRanking (cascada de desempate)', () => {
  const base = (over: Partial<RankSortable>): RankSortable => ({
    totalPoints: 0,
    groupsCorrect: 0,
    colombiaGoalsGuess: null,
    firstScorerCorrect: false,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    ...over,
  })

  it('1º criterio: más puntos primero', () => {
    const a = base({ totalPoints: 100 })
    const b = base({ totalPoints: 90 })
    expect(compareRanking(a, b, null)).toBeLessThan(0)
  })

  it('2º criterio: a igualdad de puntos, más grupos acertados', () => {
    const a = base({ totalPoints: 50, groupsCorrect: 8 })
    const b = base({ totalPoints: 50, groupsCorrect: 5 })
    expect(compareRanking(a, b, null)).toBeLessThan(0)
  })

  it('3º criterio: cercanía a goles reales de Colombia', () => {
    const a = base({ totalPoints: 50, groupsCorrect: 5, colombiaGoalsGuess: 6 })
    const b = base({ totalPoints: 50, groupsCorrect: 5, colombiaGoalsGuess: 3 })
    expect(compareRanking(a, b, 7)).toBeLessThan(0) // 6 más cerca de 7 que 3
  })

  it('4º criterio: primer goleador acertado', () => {
    const a = base({ totalPoints: 50, groupsCorrect: 5, colombiaGoalsGuess: 5, firstScorerCorrect: true })
    const b = base({ totalPoints: 50, groupsCorrect: 5, colombiaGoalsGuess: 5, firstScorerCorrect: false })
    expect(compareRanking(a, b, 5)).toBeLessThan(0)
  })

  it('5º criterio: quien se inscribió primero', () => {
    const a = base({ totalPoints: 50, createdAt: new Date('2026-01-01T00:00:00Z') })
    const b = base({ totalPoints: 50, createdAt: new Date('2026-02-01T00:00:00Z') })
    expect(compareRanking(a, b, null)).toBeLessThan(0)
  })

  it('ordena un arreglo completo correctamente', () => {
    const entries = [
      base({ totalPoints: 30 }),
      base({ totalPoints: 80, groupsCorrect: 3 }),
      base({ totalPoints: 80, groupsCorrect: 9 }),
    ]
    const sorted = [...entries].sort((x, y) => compareRanking(x, y, null))
    expect(sorted.map((e) => e.totalPoints + ':' + e.groupsCorrect)).toEqual([
      '80:9',
      '80:3',
      '30:0',
    ])
  })
})

describe('prizeForPosition (reparto 60/30/10)', () => {
  const split = [60, 30, 10]
  const pot = 100_000

  it('reparte el podio', () => {
    expect(prizeForPosition(1, split, pot)).toBe(60_000)
    expect(prizeForPosition(2, split, pot)).toBe(30_000)
    expect(prizeForPosition(3, split, pot)).toBe(10_000)
  })
  it('fuera del podio no gana premio', () => {
    expect(prizeForPosition(4, split, pot)).toBe(0)
    expect(prizeForPosition(0, split, pot)).toBe(0)
  })
  it('la suma del podio es el pozo completo', () => {
    const total =
      prizeForPosition(1, split, pot) +
      prizeForPosition(2, split, pot) +
      prizeForPosition(3, split, pot)
    expect(total).toBe(pot)
  })
})
