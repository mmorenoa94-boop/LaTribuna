import { describe, it, expect } from 'vitest'
import {
  computePending,
  type PendingEntry,
  type PendingMatch,
} from '@/lib/mundial-pending-pure'

const matches: PendingMatch[] = [
  { id: 'm1', label: 'A vs B', kickoffAt: '2026-06-20T19:00:00Z' },
  { id: 'm2', label: 'C vs D', kickoffAt: '2026-06-21T19:00:00Z' },
  { id: 'm3', label: 'E vs F', kickoffAt: '2026-06-21T22:00:00Z' },
]

function entry(over: Partial<PendingEntry> & { userId: string }): PendingEntry {
  return {
    name: over.userId,
    email: `${over.userId}@x.com`,
    phone: null,
    predictedMatchIds: [],
    ...over,
  }
}

describe('computePending', () => {
  it('cuenta faltantes y hechos por usuario', () => {
    const entries: PendingEntry[] = [
      entry({ userId: 'sin', predictedMatchIds: [] }),
      entry({ userId: 'parcial', predictedMatchIds: ['m1'] }),
      entry({ userId: 'completo', predictedMatchIds: ['m1', 'm2', 'm3'] }),
    ]
    const r = computePending(entries, matches)
    expect(r.totalConfirmed).toBe(3)
    expect(r.totalOpenMatches).toBe(3)
    expect(r.withPending).toBe(2)
    expect(r.complete).toBe(1)

    const sin = r.users.find((u) => u.userId === 'sin')!
    const parcial = r.users.find((u) => u.userId === 'parcial')!
    expect(sin).toMatchObject({ missing: 3, done: 0 })
    expect(parcial).toMatchObject({ missing: 2, done: 1 })
    // El completo no aparece en la lista de pendientes
    expect(r.users.find((u) => u.userId === 'completo')).toBeUndefined()
  })

  it('ordena por faltantes desc y luego por nombre', () => {
    const entries: PendingEntry[] = [
      entry({ userId: 'b', name: 'Beto', predictedMatchIds: ['m1'] }), // faltan 2
      entry({ userId: 'a', name: 'Ana', predictedMatchIds: ['m1'] }), // faltan 2
      entry({ userId: 'z', name: 'Zoe', predictedMatchIds: [] }), // faltan 3
    ]
    const r = computePending(entries, matches)
    expect(r.users.map((u) => u.name)).toEqual(['Zoe', 'Ana', 'Beto'])
  })

  it('ignora predicciones de partidos fuera del set abierto', () => {
    const entries: PendingEntry[] = [
      entry({ userId: 'x', predictedMatchIds: ['m1', 'viejo-cerrado'] }),
    ]
    const r = computePending(entries, matches)
    expect(r.users[0]).toMatchObject({ done: 1, missing: 2 })
  })

  it('calcula faltantes por partido', () => {
    const entries: PendingEntry[] = [
      entry({ userId: 'a', predictedMatchIds: ['m1', 'm2'] }),
      entry({ userId: 'b', predictedMatchIds: ['m1'] }),
    ]
    const r = computePending(entries, matches)
    const byId = Object.fromEntries(r.byMatch.map((m) => [m.id, m.missing]))
    expect(byId).toEqual({ m1: 0, m2: 1, m3: 2 })
  })

  it('todos al día → users vacío, complete = total', () => {
    const entries: PendingEntry[] = [
      entry({ userId: 'a', predictedMatchIds: ['m1', 'm2', 'm3'] }),
    ]
    const r = computePending(entries, matches)
    expect(r.users).toEqual([])
    expect(r.complete).toBe(1)
    expect(r.withPending).toBe(0)
  })

  it('sin partidos abiertos → nadie tiene pendientes', () => {
    const entries: PendingEntry[] = [entry({ userId: 'a', predictedMatchIds: [] })]
    const r = computePending(entries, [])
    expect(r.totalOpenMatches).toBe(0)
    expect(r.withPending).toBe(0)
    expect(r.complete).toBe(1)
    expect(r.users).toEqual([])
  })

  it('preserva el orden cronológico de los partidos en byMatch', () => {
    const r = computePending([], matches)
    expect(r.byMatch.map((m) => m.id)).toEqual(['m1', 'm2', 'm3'])
  })
})
