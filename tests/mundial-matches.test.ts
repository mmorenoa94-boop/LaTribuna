import { describe, it, expect } from 'vitest'
import {
  NO_DATE_KEY,
  dayKey,
  isComplete,
  buildPredictionsPayload,
  countUnsaved,
  type PredictableMatch,
  type ScoreDraft,
} from '@/lib/mundial-matches-pure'

// Helper para fabricar partidos con lo mínimo necesario.
function match(
  id: string,
  status: PredictableMatch['status'] = 'OPEN',
  myPrediction: PredictableMatch['myPrediction'] = null
): PredictableMatch {
  return { id, status, myPrediction }
}

describe('dayKey', () => {
  it('toma YYYY-MM-DD directo del ISO (sin convertir zona horaria)', () => {
    expect(dayKey('2026-06-11T21:00:00Z')).toBe('2026-06-11')
    // Un partido nocturno (hora-pared CO embebida en UTC) no debe correrse de día
    expect(dayKey('2026-06-11T23:30:00Z')).toBe('2026-06-11')
  })
  it('agrupa el mismo día con horas distintas bajo la misma clave', () => {
    expect(dayKey('2026-06-11T13:00:00Z')).toBe(dayKey('2026-06-11T23:00:00Z'))
  })
  it('null va al cubo "sin fecha"', () => {
    expect(dayKey(null)).toBe(NO_DATE_KEY)
  })
})

describe('isComplete', () => {
  it('requiere ambos lados con valor', () => {
    expect(isComplete({ h: '2', a: '1' })).toBe(true)
    expect(isComplete({ h: '0', a: '0' })).toBe(true) // 0-0 es válido
    expect(isComplete({ h: '2', a: '' })).toBe(false)
    expect(isComplete({ h: '', a: '1' })).toBe(false)
    expect(isComplete({ h: '', a: '' })).toBe(false)
    expect(isComplete(undefined)).toBe(false)
  })
})

describe('buildPredictionsPayload', () => {
  it('solo envía partidos ABIERTOS con marcador completo', () => {
    const matches = [
      match('open-full'),
      match('open-partial'),
      match('open-empty'),
      match('closed', 'CLOSED'),
      match('finished', 'FINISHED'),
    ]
    const draft: Record<string, ScoreDraft> = {
      'open-full': { h: '2', a: '1' },
      'open-partial': { h: '3', a: '' },
      'open-empty': { h: '', a: '' },
      closed: { h: '1', a: '0' }, // se ignora: no está abierto
      finished: { h: '4', a: '4' }, // se ignora: no está abierto
    }
    const payload = buildPredictionsPayload(matches, draft)
    expect(payload).toEqual([{ matchId: 'open-full', homePredict: 2, awayPredict: 1 }])
  })

  it('incluye marcadores de cualquier día (no depende del día visible)', () => {
    const matches = [match('a'), match('b')]
    const draft: Record<string, ScoreDraft> = {
      a: { h: '1', a: '1' },
      b: { h: '0', a: '2' },
    }
    const payload = buildPredictionsPayload(matches, draft)
    expect(payload).toHaveLength(2)
    expect(payload.map((p) => p.matchId)).toEqual(['a', 'b'])
  })

  it('convierte los strings de input a números', () => {
    const payload = buildPredictionsPayload([match('a')], { a: { h: '0', a: '3' } })
    expect(payload[0]).toEqual({ matchId: 'a', homePredict: 0, awayPredict: 3 })
    expect(typeof payload[0].homePredict).toBe('number')
  })

  it('devuelve vacío cuando no hay nada completo', () => {
    expect(buildPredictionsPayload([match('a')], { a: { h: '', a: '' } })).toEqual([])
    expect(buildPredictionsPayload([], {})).toEqual([])
  })
})

describe('countUnsaved', () => {
  it('cuenta marcadores nuevos (sin predicción previa)', () => {
    const matches = [match('a'), match('b')]
    const draft: Record<string, ScoreDraft> = {
      a: { h: '2', a: '1' },
      b: { h: '', a: '' },
    }
    expect(countUnsaved(matches, draft)).toBe(1)
  })

  it('NO cuenta un borrador idéntico a lo ya guardado', () => {
    const matches = [match('a', 'OPEN', { homePredict: 2, awayPredict: 1 })]
    expect(countUnsaved(matches, { a: { h: '2', a: '1' } })).toBe(0)
  })

  it('cuenta un borrador que cambió respecto a lo guardado', () => {
    const matches = [match('a', 'OPEN', { homePredict: 2, awayPredict: 1 })]
    expect(countUnsaved(matches, { a: { h: '3', a: '1' } })).toBe(1)
  })

  it('ignora partidos no abiertos aunque tengan cambios', () => {
    const matches = [
      match('closed', 'CLOSED', { homePredict: 1, awayPredict: 1 }),
      match('finished', 'FINISHED'),
    ]
    const draft: Record<string, ScoreDraft> = {
      closed: { h: '9', a: '9' },
      finished: { h: '0', a: '0' },
    }
    expect(countUnsaved(matches, draft)).toBe(0)
  })

  it('no cuenta marcadores incompletos', () => {
    const matches = [match('a')]
    expect(countUnsaved(matches, { a: { h: '2', a: '' } })).toBe(0)
  })

  it('suma varios partidos con cambios distintos', () => {
    const matches = [
      match('nuevo'),
      match('cambiado', 'OPEN', { homePredict: 0, awayPredict: 0 }),
      match('igual', 'OPEN', { homePredict: 1, awayPredict: 2 }),
      match('vacio'),
    ]
    const draft: Record<string, ScoreDraft> = {
      nuevo: { h: '3', a: '0' }, // cuenta
      cambiado: { h: '1', a: '0' }, // cuenta (difiere de 0-0)
      igual: { h: '1', a: '2' }, // no cuenta (idéntico)
      vacio: { h: '', a: '' }, // no cuenta (incompleto)
    }
    expect(countUnsaved(matches, draft)).toBe(2)
  })
})
