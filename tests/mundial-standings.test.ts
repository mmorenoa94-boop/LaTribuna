import { describe, it, expect } from 'vitest'
import {
  buildStandingsHistory,
  extractUserHistory,
  type HistoryEntry,
  type HistoryMatch,
} from '@/lib/mundial-standings-pure'
import { NO_DATE_KEY } from '@/lib/mundial-matches-pure'

const D20 = '2026-06-20'
const D21 = '2026-06-21'

describe('buildStandingsHistory', () => {
  it('reconstruye posiciones acumuladas por jornada', () => {
    const matches: HistoryMatch[] = [
      { id: 'm1', dayKey: D20 },
      { id: 'm2', dayKey: D21 },
    ]
    const entries: HistoryEntry[] = [
      { userId: 'A', createdAt: 1, predictions: [{ matchId: 'm1', pointsEarned: 3 }, { matchId: 'm2', pointsEarned: 0 }] },
      { userId: 'B', createdAt: 2, predictions: [{ matchId: 'm1', pointsEarned: 0 }, { matchId: 'm2', pointsEarned: 5 }] },
    ]
    const h = buildStandingsHistory(entries, matches)
    expect(h.days).toEqual([D20, D21])

    const A = h.rows.find((r) => r.userId === 'A')!
    const B = h.rows.find((r) => r.userId === 'B')!
    // Día 1: A=3 (1º), B=0 (2º). Día 2: A=3 (2º), B=5 (1º).
    expect(A.points).toEqual([3, 3])
    expect(A.positions).toEqual([1, 2])
    expect(B.points).toEqual([0, 5])
    expect(B.positions).toEqual([2, 1])
  })

  it('agrupa varios partidos del mismo día en una sola jornada', () => {
    const matches: HistoryMatch[] = [
      { id: 'm1', dayKey: D20 },
      { id: 'm2', dayKey: D20 },
    ]
    const entries: HistoryEntry[] = [
      { userId: 'A', createdAt: 1, predictions: [{ matchId: 'm1', pointsEarned: 3 }, { matchId: 'm2', pointsEarned: 5 }] },
    ]
    const h = buildStandingsHistory(entries, matches)
    expect(h.days).toEqual([D20])
    expect(h.rows[0].points).toEqual([8])
    expect(h.rows[0].positions).toEqual([1])
  })

  it('desempata por inscripción (createdAt) ascendente', () => {
    const matches: HistoryMatch[] = [{ id: 'm1', dayKey: D20 }]
    const entries: HistoryEntry[] = [
      { userId: 'tarde', createdAt: 200, predictions: [{ matchId: 'm1', pointsEarned: 3 }] },
      { userId: 'temprano', createdAt: 100, predictions: [{ matchId: 'm1', pointsEarned: 3 }] },
    ]
    const h = buildStandingsHistory(entries, matches)
    const temprano = h.rows.find((r) => r.userId === 'temprano')!
    const tarde = h.rows.find((r) => r.userId === 'tarde')!
    expect(temprano.positions).toEqual([1])
    expect(tarde.positions).toEqual([2])
  })

  it('ignora predicciones de partidos no incluidos (no finalizados)', () => {
    const matches: HistoryMatch[] = [{ id: 'm1', dayKey: D20 }]
    const entries: HistoryEntry[] = [
      {
        userId: 'A',
        createdAt: 1,
        predictions: [
          { matchId: 'm1', pointsEarned: 3 },
          { matchId: 'no-finalizado', pointsEarned: 99 }, // no está en matches → se ignora
        ],
      },
    ]
    const h = buildStandingsHistory(entries, matches)
    expect(h.rows[0].points).toEqual([3])
  })

  it('coloca los partidos sin fecha como última jornada', () => {
    const matches: HistoryMatch[] = [
      { id: 'm2', dayKey: NO_DATE_KEY },
      { id: 'm1', dayKey: D20 },
    ]
    const entries: HistoryEntry[] = [
      { userId: 'A', createdAt: 1, predictions: [{ matchId: 'm1', pointsEarned: 3 }, { matchId: 'm2', pointsEarned: 2 }] },
    ]
    const h = buildStandingsHistory(entries, matches)
    expect(h.days).toEqual([D20, NO_DATE_KEY])
    expect(h.rows[0].points).toEqual([3, 5])
  })

  it('sin partidos finalizados devuelve historia vacía', () => {
    const entries: HistoryEntry[] = [{ userId: 'A', createdAt: 1, predictions: [] }]
    const h = buildStandingsHistory(entries, [])
    expect(h.days).toEqual([])
    expect(h.rows[0].points).toEqual([])
    expect(h.rows[0].positions).toEqual([])
  })

  it('sin participantes no rompe', () => {
    const h = buildStandingsHistory([], [{ id: 'm1', dayKey: D20 }])
    expect(h.rows).toEqual([])
  })
})

describe('extractUserHistory', () => {
  const matches: HistoryMatch[] = [
    { id: 'm1', dayKey: D20 },
    { id: 'm2', dayKey: D21 },
  ]
  const entries: HistoryEntry[] = [
    { userId: 'A', createdAt: 1, predictions: [{ matchId: 'm1', pointsEarned: 3 }, { matchId: 'm2', pointsEarned: 5 }] },
    { userId: 'B', createdAt: 2, predictions: [] },
  ]

  it('devuelve la trayectoria día a día de un usuario', () => {
    const h = buildStandingsHistory(entries, matches)
    const traj = extractUserHistory(h, 'A')
    expect(traj).toEqual([
      { dayKey: D20, position: 1, points: 3 },
      { dayKey: D21, position: 1, points: 8 },
    ])
  })

  it('usuario inexistente devuelve vacío', () => {
    const h = buildStandingsHistory(entries, matches)
    expect(extractUserHistory(h, 'ZZZ')).toEqual([])
  })
})
