import { describe, it, expect } from 'vitest'
import {
  adminPoolSchema,
  poolMatchSchema,
  poolMatchPredictionsSchema,
  poolMatchUpdateSchema,
  resolvePoolSchema,
} from '@/lib/validations'

describe('adminPoolSchema', () => {
  it('acepta un pool válido y aplica defaults', () => {
    const r = adminPoolSchema.safeParse({ name: 'Polla 2026', entryFee: 7000 })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.prizeSplit).toEqual([60, 30, 10])
      expect(r.data.season).toBe('2026')
    }
  })
  it('rechaza cuota negativa', () => {
    expect(adminPoolSchema.safeParse({ name: 'X', entryFee: -1 }).success).toBe(false)
  })
  it('rechaza prizeSplit que no tenga 3 posiciones', () => {
    expect(
      adminPoolSchema.safeParse({ name: 'X', entryFee: 100, prizeSplit: [70, 30] }).success
    ).toBe(false)
  })
})

describe('poolMatchSchema', () => {
  it('acepta un partido mínimo', () => {
    const r = poolMatchSchema.safeParse({ homeTeam: 'Colombia', awayTeam: 'Brasil' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.phase).toBe('Fase de grupos')
  })
  it('rechaza equipos vacíos', () => {
    expect(poolMatchSchema.safeParse({ homeTeam: '', awayTeam: 'X' }).success).toBe(false)
  })
})

describe('poolMatchPredictionsSchema', () => {
  it('acepta marcadores válidos', () => {
    const r = poolMatchPredictionsSchema.safeParse({
      predictions: [{ matchId: 'ckxxxxxxxxxxxxxxxxxxxxxxx', homePredict: 2, awayPredict: 1 }],
    })
    expect(r.success).toBe(true)
  })
  it('rechaza marcador negativo', () => {
    const r = poolMatchPredictionsSchema.safeParse({
      predictions: [{ matchId: 'ckxxxxxxxxxxxxxxxxxxxxxxx', homePredict: -1, awayPredict: 1 }],
    })
    expect(r.success).toBe(false)
  })
  it('rechaza lista vacía', () => {
    expect(poolMatchPredictionsSchema.safeParse({ predictions: [] }).success).toBe(false)
  })
})

describe('poolMatchUpdateSchema', () => {
  it('acepta cargar resultado y estado FINISHED', () => {
    const r = poolMatchUpdateSchema.safeParse({ status: 'FINISHED', homeScore: 2, awayScore: 0 })
    expect(r.success).toBe(true)
  })
  it('rechaza un status inválido', () => {
    expect(poolMatchUpdateSchema.safeParse({ status: 'PLAYING' }).success).toBe(false)
  })
})

describe('resolvePoolSchema', () => {
  it('acepta correcciones y goles reales de Colombia', () => {
    const r = resolvePoolSchema.safeParse({
      corrections: [{ questionId: 'ckxxxxxxxxxxxxxxxxxxxxxxx', correctAnswer: 'Argentina' }],
      colombiaGoalsReal: 7,
    })
    expect(r.success).toBe(true)
  })
  it('acepta correctAnswer como objeto (bracket de grupos)', () => {
    const r = resolvePoolSchema.safeParse({
      corrections: [
        { questionId: 'ckxxxxxxxxxxxxxxxxxxxxxxx', correctAnswer: { A: ['Colombia', 'Brasil'] } },
      ],
    })
    expect(r.success).toBe(true)
  })
})
