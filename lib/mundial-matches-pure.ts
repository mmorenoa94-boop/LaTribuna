/**
 * Lógica pura de la sección de marcadores (pronósticos) de la Polla Mundialista.
 * SIN dependencias de React/DB — aislada aquí para poder testearla unitariamente.
 */

export type MatchStatus = 'OPEN' | 'CLOSED' | 'FINISHED'

/** Marcador en edición tal como vive en el estado del formulario (strings de inputs). */
export type ScoreDraft = { h: string; a: string }

/** Datos mínimos de un partido necesarios para la lógica de guardado/conteo. */
export type PredictableMatch = {
  id: string
  status: MatchStatus
  myPrediction: { homePredict: number; awayPredict: number } | null
}

export type PredictionPayload = {
  matchId: string
  homePredict: number
  awayPredict: number
}

export const NO_DATE_KEY = 'sin-fecha'

/**
 * Clave de día a partir del ISO. La fecha se guarda como hora-pared de Colombia dentro
 * de un instante UTC, por eso tomamos los primeros 10 caracteres ("YYYY-MM-DD") directo.
 */
export function dayKey(iso: string | null): string {
  if (!iso) return NO_DATE_KEY
  return iso.slice(0, 10)
}

/**
 * Clave de día (YYYY-MM-DD) de "hoy" en la convención del proyecto: la hora-pared
 * de Colombia (UTC-5 fijo, sin horario de verano) embebida como instante UTC.
 * Restamos 5h al instante real y tomamos la fecha UTC, de modo que coincida con
 * la clave que produce dayKey() sobre el kickoff almacenado.
 */
export function currentDayKey(now: Date): string {
  return new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

/** Orden cronológico de claves de día, dejando NO_DATE_KEY ("sin fecha") al final. */
export function compareDayKeys(a: string, b: string): number {
  if (a === b) return 0
  if (a === NO_DATE_KEY) return 1
  if (b === NO_DATE_KEY) return -1
  return a < b ? -1 : 1
}

/**
 * Elige el día que debe mostrarse por defecto al entrar:
 * 1) hoy, si tiene partidos; 2) si no, el próximo día con partidos;
 * 3) si ya pasaron todos, el último día jugado; 4) 'ALL' si no hay días.
 * NO_DATE_KEY nunca se elige como default (no es una fecha real).
 */
export function pickDefaultDay(dayKeys: string[], today: string): string {
  const valid = dayKeys.filter((k) => k !== NO_DATE_KEY).sort(compareDayKeys)
  if (valid.length === 0) return 'ALL'
  if (valid.includes(today)) return today
  const next = valid.find((k) => k > today)
  if (next) return next
  return valid[valid.length - 1]
}

/**
 * Etiqueta relativa para una pestaña de día: 'AYER' | 'HOY' | 'MAÑANA' | null.
 * Compara solo la parte de fecha (medianoche UTC) contra "hoy".
 */
export function relativeDayLabel(key: string, today: string): 'AYER' | 'HOY' | 'MAÑANA' | null {
  if (key === NO_DATE_KEY) return null
  const d = Date.parse(key + 'T00:00:00Z')
  const t = Date.parse(today + 'T00:00:00Z')
  if (Number.isNaN(d) || Number.isNaN(t)) return null
  const diffDays = Math.round((d - t) / (24 * 60 * 60 * 1000))
  if (diffDays === 0) return 'HOY'
  if (diffDays === -1) return 'AYER'
  if (diffDays === 1) return 'MAÑANA'
  return null
}

/** ¿El marcador en borrador está completo (ambos lados con valor)? */
export function isComplete(d: ScoreDraft | undefined): d is ScoreDraft {
  return !!d && d.h !== '' && d.a !== ''
}

/**
 * Construye el payload de predicciones a enviar: SOLO partidos abiertos con marcador completo,
 * sin importar el día visible. Refleja exactamente lo que se persiste al guardar.
 */
export function buildPredictionsPayload(
  matches: PredictableMatch[],
  draft: Record<string, ScoreDraft>
): PredictionPayload[] {
  return matches
    .filter((m) => m.status === 'OPEN')
    .map((m) => ({ m, d: draft[m.id] }))
    .filter(({ d }) => isComplete(d))
    .map(({ m, d }) => ({
      matchId: m.id,
      homePredict: Number(d.h),
      awayPredict: Number(d.a),
    }))
}

/**
 * Cuenta marcadores completos (de partidos abiertos) que difieren de lo ya guardado en BD.
 * Cuenta sobre TODOS los partidos, no solo el día visible: así el contador refleja todo lo
 * que se perdería si el usuario se va sin guardar. Un borrador igual al guardado no cuenta.
 */
export function countUnsaved(
  matches: PredictableMatch[],
  draft: Record<string, ScoreDraft>
): number {
  return matches.filter((m) => {
    if (m.status !== 'OPEN') return false
    const d = draft[m.id]
    if (!isComplete(d)) return false
    const saved = m.myPrediction
    return !saved || saved.homePredict !== Number(d.h) || saved.awayPredict !== Number(d.a)
  }).length
}
