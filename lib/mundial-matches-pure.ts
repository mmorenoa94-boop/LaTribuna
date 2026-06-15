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
