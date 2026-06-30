import { describe, it, expect } from 'vitest'
import {
  normalizeAnswer,
  countPositionsCorrect,
  computeBracketPoints,
  outcome,
  computeMatchPoints,
  computeAdvancePoints,
  impliedAdvancer,
  isKnockoutPhase,
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

describe('countPositionsCorrect (ranking completo por grupo)', () => {
  const correct = {
    A: ['Colombia', 'Brasil', 'Serbia', 'Suiza'],
    B: ['Argentina', 'México', 'Polonia', 'Arabia'],
  }

  it('cuenta cada posición acertada sumando todos los grupos', () => {
    const user = {
      A: ['Colombia', 'Brasil', 'Suiza', 'Serbia'], // 2 posiciones (1° y 2°)
      B: ['Argentina', 'México', 'Polonia', 'Arabia'], // 4 posiciones
    }
    expect(countPositionsCorrect(user, correct)).toBe(6)
  })

  it('grupo perfecto suma sus 4 posiciones', () => {
    const user = { A: ['Colombia', 'Brasil', 'Serbia', 'Suiza'], B: [] }
    expect(countPositionsCorrect(user, correct)).toBe(4)
  })

  it('es laxo con tildes y mayúsculas', () => {
    const user = { A: ['colombia', 'brasil', 'serbia', 'suiza'], B: [] }
    expect(countPositionsCorrect(user, correct)).toBe(4)
  })

  it('devuelve 0 con entradas inválidas', () => {
    expect(countPositionsCorrect(null, correct)).toBe(0)
  })
})

describe('computeBracketPoints (puntos del bracket por posición)', () => {
  const correct = {
    A: ['Colombia', 'Brasil', 'Serbia', 'Suiza'],
    B: ['Argentina', 'México', 'Polonia', 'Arabia'],
  }

  it('suma pointsPerPosition por cada posición acertada', () => {
    const user = {
      A: ['Colombia', 'Brasil', 'Suiza', 'Serbia'], // 2 aciertos
      B: ['Argentina', 'México', 'Polonia', 'Arabia'], // 4 aciertos
    }
    expect(computeBracketPoints(user, correct, 1)).toEqual({ positionsCorrect: 6, earned: 6 })
    expect(computeBracketPoints(user, correct, 2)).toEqual({ positionsCorrect: 6, earned: 12 })
  })

  it('sin aciertos no suma', () => {
    const user = { A: ['Suiza', 'Serbia', 'Brasil', 'Colombia'], B: [] }
    expect(computeBracketPoints(user, correct, 1).earned).toBe(0)
  })

  it('pointsPerPosition negativo se trata como 0', () => {
    const user = { A: ['Colombia', 'Brasil', 'Serbia', 'Suiza'], B: [] }
    expect(computeBracketPoints(user, correct, -5).earned).toBe(0)
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

describe('isKnockoutPhase', () => {
  it('la fase de grupos NO es eliminación', () => {
    expect(isKnockoutPhase('Fase de grupos')).toBe(false)
    expect(isKnockoutPhase('fase de grupos')).toBe(false) // laxo con mayúsculas
  })
  it('cualquier otra fase es eliminación', () => {
    expect(isKnockoutPhase('Octavos de final')).toBe(true)
    expect(isKnockoutPhase('Final')).toBe(true)
  })
  it('null/undefined no es eliminación', () => {
    expect(isKnockoutPhase(null)).toBe(false)
    expect(isKnockoutPhase(undefined)).toBe(false)
  })
})

describe('impliedAdvancer', () => {
  it('si predice ganador, ese ganador es el avanzador implícito', () => {
    expect(impliedAdvancer(2, 1, 'Alemania', 'Paraguay', null)).toBe('Alemania')
    expect(impliedAdvancer(1, 2, 'Alemania', 'Paraguay', null)).toBe('Paraguay')
  })
  it('si predice empate, usa la selección explícita', () => {
    expect(impliedAdvancer(1, 1, 'Alemania', 'Paraguay', 'Paraguay')).toBe('Paraguay')
  })
  it('empate sin selección devuelve null', () => {
    expect(impliedAdvancer(1, 1, 'Alemania', 'Paraguay', null)).toBeNull()
  })
})

describe('computeAdvancePoints (Alemania 1-1 Paraguay, avanza Paraguay por penales)', () => {
  // Local = Alemania, Visitante = Paraguay. Real: empate 1-1 a los 90', avanza Paraguay.
  const base = {
    isKnockout: true,
    homeScore: 1,
    awayScore: 1,
    advancesReal: 'Paraguay',
    homeTeam: 'Alemania',
    awayTeam: 'Paraguay',
    ptsAdvance: 2,
  }

  it('predijo empate y acertó el avanzador → +2', () => {
    const r = computeAdvancePoints({ ...base, homePredict: 1, awayPredict: 1, advancesPredict: 'Paraguay' })
    expect(r).toEqual({ advanceCorrect: true, earned: 2 })
  })
  it('predijo empate pero erró el avanzador → 0', () => {
    const r = computeAdvancePoints({ ...base, homePredict: 1, awayPredict: 1, advancesPredict: 'Alemania' })
    expect(r).toEqual({ advanceCorrect: false, earned: 0 })
  })
  it('predijo ganador (Paraguay) → avanzador implícito correcto → +2', () => {
    const r = computeAdvancePoints({ ...base, homePredict: 1, awayPredict: 2, advancesPredict: null })
    expect(r).toEqual({ advanceCorrect: true, earned: 2 })
  })
  it('predijo ganador (Alemania) → avanzador implícito incorrecto → 0', () => {
    const r = computeAdvancePoints({ ...base, homePredict: 2, awayPredict: 1, advancesPredict: null })
    expect(r).toEqual({ advanceCorrect: false, earned: 0 })
  })
  it('NO aplica si no es eliminación', () => {
    const r = computeAdvancePoints({ ...base, isKnockout: false, homePredict: 1, awayPredict: 1, advancesPredict: 'Paraguay' })
    expect(r.earned).toBe(0)
  })
  it('NO aplica si el partido real NO terminó empatado a los 90', () => {
    const r = computeAdvancePoints({ ...base, homeScore: 2, awayScore: 1, homePredict: 1, awayPredict: 1, advancesPredict: 'Paraguay' })
    expect(r.earned).toBe(0)
  })
  it('NO aplica si el admin no cargó quién avanzó', () => {
    const r = computeAdvancePoints({ ...base, advancesReal: null, homePredict: 1, awayPredict: 1, advancesPredict: 'Paraguay' })
    expect(r.earned).toBe(0)
  })
  it('es laxo con tildes y mayúsculas en el nombre del equipo', () => {
    const r = computeAdvancePoints({ ...base, advancesReal: 'PARAGUAY', homePredict: 1, awayPredict: 1, advancesPredict: 'paraguay' })
    expect(r.advanceCorrect).toBe(true)
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
  const NO_REALS = { total: null, colombia: null }
  const base = (over: Partial<RankSortable>): RankSortable => ({
    totalPoints: 0,
    groupsCorrect: 0,
    totalGoalsGuess: null,
    colombiaGoalsGuess: null,
    firstScorerCorrect: false,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    ...over,
  })

  it('1º criterio: más puntos primero', () => {
    const a = base({ totalPoints: 100 })
    const b = base({ totalPoints: 90 })
    expect(compareRanking(a, b, NO_REALS)).toBeLessThan(0)
  })

  it('el bracket ya NO desempata: a igualdad de puntos, groupsCorrect no decide', () => {
    const reals = { total: 150, colombia: 5 }
    // Mismos puntos y mismos desempates reales, distinto groupsCorrect → empatan (0).
    const a = base({ totalPoints: 50, groupsCorrect: 8, totalGoalsGuess: 150, colombiaGoalsGuess: 5 })
    const b = base({ totalPoints: 50, groupsCorrect: 2, totalGoalsGuess: 150, colombiaGoalsGuess: 5 })
    expect(compareRanking(a, b, reals)).toBe(0)
  })

  it('2º criterio: cercanía a goles totales del mundial', () => {
    const a = base({ totalPoints: 50, totalGoalsGuess: 160 })
    const b = base({ totalPoints: 50, totalGoalsGuess: 140 })
    expect(compareRanking(a, b, { total: 165, colombia: null })).toBeLessThan(0)
  })

  it('3º criterio: cercanía a goles de Colombia', () => {
    const a = base({ totalPoints: 50, totalGoalsGuess: 150, colombiaGoalsGuess: 6 })
    const b = base({ totalPoints: 50, totalGoalsGuess: 150, colombiaGoalsGuess: 3 })
    expect(compareRanking(a, b, { total: 150, colombia: 7 })).toBeLessThan(0)
  })

  it('4º criterio: primer goleador acertado', () => {
    const reals = { total: 150, colombia: 5 }
    const a = base({ totalPoints: 50, totalGoalsGuess: 150, colombiaGoalsGuess: 5, firstScorerCorrect: true })
    const b = base({ totalPoints: 50, totalGoalsGuess: 150, colombiaGoalsGuess: 5, firstScorerCorrect: false })
    expect(compareRanking(a, b, reals)).toBeLessThan(0)
  })

  it('5º criterio: quien se inscribió primero', () => {
    const a = base({ totalPoints: 50, createdAt: new Date('2026-01-01T00:00:00Z') })
    const b = base({ totalPoints: 50, createdAt: new Date('2026-02-01T00:00:00Z') })
    expect(compareRanking(a, b, NO_REALS)).toBeLessThan(0)
  })

  it('ordena un arreglo completo correctamente', () => {
    const entries = [
      base({ totalPoints: 30 }),
      base({ totalPoints: 80, createdAt: new Date('2026-02-01T00:00:00Z') }),
      base({ totalPoints: 80, createdAt: new Date('2026-01-01T00:00:00Z') }),
    ]
    const sorted = [...entries].sort((x, y) => compareRanking(x, y, NO_REALS))
    expect(sorted.map((e) => e.totalPoints + ':' + e.createdAt.getUTCMonth())).toEqual([
      '80:0', // enero (se inscribió primero)
      '80:1', // febrero
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
