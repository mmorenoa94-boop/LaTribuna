/**
 * Reconstrucción "al vuelo" de la evolución de posiciones de la Polla Mundialista.
 * SIN dependencias de Prisma/DB — aislado para poder testearlo unitariamente.
 *
 * Idea: durante el torneo los puntos provienen de los marcadores de partidos
 * FINALIZADOS (pointsEarned ya persistido por el admin al cargar el resultado).
 * Para cada jornada (día con partidos finalizados) acumulamos los puntos hasta ese
 * día y ordenamos para obtener la posición de cada participante en ese corte.
 *
 * Limitaciones asumidas a propósito:
 * - Los puntos de bracket/grupos se asignan al resolver la polla (final del torneo),
 *   así que la línea refleja solo puntos de marcadores hasta ese momento.
 * - El desempate histórico se simplifica a puntos DESC + inscripción (createdAt) ASC.
 *   Puede diferir en un puesto del ranking oficial en empates; es aceptable para una
 *   gráfica de evolución.
 */

import { compareDayKeys } from './mundial-matches-pure'

/** Predicción mínima para el cómputo: a qué partido y cuántos puntos ganó. */
export type HistoryPrediction = { matchId: string; pointsEarned: number }

/** Participante con sus predicciones y su fecha de inscripción (ms epoch). */
export type HistoryEntry = {
  userId: string
  createdAt: number
  predictions: HistoryPrediction[]
}

/** Partido FINALIZADO con su clave de día (YYYY-MM-DD o NO_DATE_KEY). */
export type HistoryMatch = { id: string; dayKey: string }

export type StandingsRow = {
  userId: string
  points: number[] // puntos acumulados al cierre de cada día de `days`
  positions: number[] // posición (1 = líder) al cierre de cada día de `days`
}

export type StandingsHistory = {
  days: string[] // claves de día en orden cronológico
  rows: StandingsRow[]
}

/**
 * Construye la matriz de posiciones acumuladas por jornada.
 * Determinista: ante empate de puntos, ordena por createdAt ASC y luego userId ASC.
 */
export function buildStandingsHistory(
  entries: HistoryEntry[],
  matches: HistoryMatch[]
): StandingsHistory {
  const dayByMatch = new Map(matches.map((m) => [m.id, m.dayKey]))
  const days = Array.from(new Set(matches.map((m) => m.dayKey))).sort(compareDayKeys)

  if (days.length === 0 || entries.length === 0) {
    return { days, rows: entries.map((e) => ({ userId: e.userId, points: [], positions: [] })) }
  }

  const dayIndex = new Map(days.map((d, i) => [d, i]))

  // Puntos ganados por cada participante en cada día (no acumulado todavía).
  const perDayPoints = entries.map((e) => {
    const arr = new Array(days.length).fill(0)
    for (const p of e.predictions) {
      const dk = dayByMatch.get(p.matchId)
      if (dk === undefined) continue // predicción de un partido no finalizado: no suma
      const idx = dayIndex.get(dk)
      if (idx !== undefined) arr[idx] += p.pointsEarned
    }
    return arr
  })

  // Acumulado por día (prefix sum por participante).
  const cumulative = perDayPoints.map((arr) => {
    const out = new Array(days.length).fill(0)
    let running = 0
    for (let i = 0; i < days.length; i++) {
      running += arr[i]
      out[i] = running
    }
    return out
  })

  const rows: StandingsRow[] = entries.map((e, i) => ({
    userId: e.userId,
    points: cumulative[i],
    positions: new Array(days.length).fill(0),
  }))

  // Posición por día: ordenar índices por (puntos DESC, createdAt ASC, userId ASC).
  for (let d = 0; d < days.length; d++) {
    const order = entries.map((_, i) => i).sort((a, b) => {
      const pa = cumulative[a][d]
      const pb = cumulative[b][d]
      if (pb !== pa) return pb - pa
      if (entries[a].createdAt !== entries[b].createdAt) {
        return entries[a].createdAt - entries[b].createdAt
      }
      return entries[a].userId < entries[b].userId ? -1 : 1
    })
    order.forEach((entryIdx, rank) => {
      rows[entryIdx].positions[d] = rank + 1
    })
  }

  return { days, rows }
}

/** Extrae la trayectoria (día → posición/puntos) de un participante del histórico. */
export function extractUserHistory(
  history: StandingsHistory,
  userId: string
): { dayKey: string; position: number; points: number }[] {
  const row = history.rows.find((r) => r.userId === userId)
  if (!row) return []
  return history.days.map((dayKey, i) => ({
    dayKey,
    position: row.positions[i],
    points: row.points[i],
  }))
}
