import { describe, it, expect } from 'vitest'
import {
  buildSeedQuestions,
  DEFAULT_GROUPS,
  COLOMBIA_PHASES,
} from '@/lib/mundial-questions'

describe('buildSeedQuestions', () => {
  const seed = buildSeedQuestions()

  it('genera el set acordado de preguntas', () => {
    // 6 globales + 3 Colombia + 4 desempate (grupos, goles mundial, goles Colombia, primer goleador)
    expect(seed.length).toBe(13)
  })

  it('asigna order secuencial sin huecos', () => {
    const orders = seed.map((q) => q.order)
    expect(orders).toEqual(Array.from({ length: seed.length }, (_, i) => i))
  })

  it('tiene exactamente 4 preguntas de desempate con rank 1,2,3,4', () => {
    const tb = seed.filter((q) => q.isTiebreaker)
    expect(tb.length).toBe(4)
    expect(tb.map((q) => q.tiebreakRank).sort()).toEqual([1, 2, 3, 4])
  })

  it('incluye un desempate de goles totales del mundial (NUMERIC global)', () => {
    const tg = seed.find(
      (q) => q.type === 'NUMERIC' && q.isTiebreaker && q.category === 'GLOBAL'
    )
    expect(tg).toBeDefined()
  })

  it('las preguntas de desempate no otorgan puntos', () => {
    for (const q of seed.filter((q) => q.isTiebreaker)) {
      expect(q.pointsValue).toBe(0)
    }
  })

  it('las preguntas con puntos sí otorgan puntos', () => {
    for (const q of seed.filter((q) => !q.isTiebreaker)) {
      expect(q.pointsValue).toBeGreaterThan(0)
    }
  })

  it('incluye campeón, subcampeón y tercer puesto como TEAM_PICK', () => {
    const teamPicks = seed.filter((q) => q.type === 'TEAM_PICK')
    expect(teamPicks.length).toBe(3)
  })

  it('el bracket de grupos es GROUP_RANK y es desempate', () => {
    const bracket = seed.find((q) => q.type === 'GROUP_RANK')
    expect(bracket).toBeDefined()
    expect(bracket!.isTiebreaker).toBe(true)
    const opts = bracket!.options as { groups: { name: string; teams: string[] }[] }
    expect(opts.groups.length).toBe(12)
  })
})

describe('DEFAULT_GROUPS', () => {
  it('son 12 grupos A–L con 4 equipos cada uno', () => {
    expect(DEFAULT_GROUPS.length).toBe(12)
    expect(DEFAULT_GROUPS[0].name).toBe('A')
    expect(DEFAULT_GROUPS[11].name).toBe('L')
    for (const g of DEFAULT_GROUPS) {
      expect(g.teams.length).toBe(4)
    }
  })
})

describe('COLOMBIA_PHASES', () => {
  it('arranca en grupos y termina en campeón', () => {
    expect(COLOMBIA_PHASES[0]).toBe('Fase de grupos')
    expect(COLOMBIA_PHASES[COLOMBIA_PHASES.length - 1]).toBe('Campeón')
  })
})
