/**
 * Lógica pura de scoring de la Polla Mundialista — SIN dependencias de Prisma/DB.
 * Aislado aquí para poder testearlo unitariamente sin instanciar PrismaClient.
 */

/**
 * Normaliza una respuesta para comparación laxa (string).
 * Para players/teams: trim + minúsculas + sin tildes.
 */
export function normalizeAnswer(v: unknown): string {
  if (v === null || v === undefined) return ''
  const s = typeof v === 'string' ? v : String(v)
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

/**
 * Para una pregunta GROUP_RANK con ranking completo: cuenta cuántas POSICIONES
 * acertó el usuario sumadas en todos los grupos (cada equipo en su slot exacto).
 * Estructura esperada (tanto en answer del usuario como en correctAnswer):
 *   { "A": ["1°","2°","3°","4°"], "B": [...], ... }
 * Métrica más granular = mejor desempate.
 */
export function countPositionsCorrect(userAnswer: unknown, correctAnswer: unknown): number {
  if (
    !userAnswer || typeof userAnswer !== 'object' ||
    !correctAnswer || typeof correctAnswer !== 'object'
  ) {
    return 0
  }
  const ua = userAnswer as Record<string, string[]>
  const ca = correctAnswer as Record<string, string[]>
  let correct = 0
  for (const group of Object.keys(ca)) {
    const expected = ca[group] ?? []
    const got = ua[group] ?? []
    for (let i = 0; i < expected.length; i++) {
      if (expected[i] && got[i] && normalizeAnswer(expected[i]) === normalizeAnswer(got[i])) {
        correct++
      }
    }
  }
  return correct
}

// Resultado de un marcador: 'H' local gana, 'A' visitante gana, 'D' empate
export function outcome(home: number, away: number): 'H' | 'A' | 'D' {
  if (home > away) return 'H'
  if (home < away) return 'A'
  return 'D'
}

/**
 * Calcula los puntos de UNA predicción de marcador (función pura).
 * Resultado correcto (1X2) → ptsOutcome; marcador exacto → + ptsExactBonus.
 */
export function computeMatchPoints(
  homePredict: number,
  awayPredict: number,
  homeScore: number,
  awayScore: number,
  ptsOutcome: number,
  ptsExactBonus: number
): { outcomeCorrect: boolean; exactCorrect: boolean; earned: number } {
  const outcomeCorrect = outcome(homePredict, awayPredict) === outcome(homeScore, awayScore)
  const exactCorrect = homePredict === homeScore && awayPredict === awayScore
  const earned = (outcomeCorrect ? ptsOutcome : 0) + (exactCorrect ? ptsExactBonus : 0)
  return { outcomeCorrect, exactCorrect, earned }
}

// Campos mínimos necesarios para ordenar por la cascada de desempate
export interface RankSortable {
  totalPoints: number
  groupsCorrect: number // posiciones acertadas en los grupos
  totalGoalsGuess: number | null
  colombiaGoalsGuess: number | null
  firstScorerCorrect: boolean
  createdAt: Date
}

// Valores reales para los desempates por cercanía
export interface ClosenessReals {
  total: number | null
  colombia: number | null
}

/**
 * Métrica de cercanía a los goles reales de Colombia: menor = mejor.
 * Pasarse penaliza (queda detrás de cualquiera que no se haya pasado).
 */
export function closenessScore(guess: number | null, real: number | null): number {
  if (real == null || guess == null) return Number.POSITIVE_INFINITY
  // "Más cerca sin pasarse": quedar por debajo o exacto puntúa por distancia;
  // pasarse (guess > real) se penaliza para quedar detrás de cualquiera que no se pasó.
  const diff = real - guess
  return diff >= 0 ? diff : Math.abs(diff) + 1000
}

/**
 * Comparador puro de la cascada de desempate:
 * puntos → posiciones de grupos → cercanía goles del mundial → cercanía goles
 * de Colombia → primer goleador → fecha de inscripción.
 */
export function compareRanking(a: RankSortable, b: RankSortable, reals: ClosenessReals): number {
  if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints
  if (b.groupsCorrect !== a.groupsCorrect) return b.groupsCorrect - a.groupsCorrect
  const ta = closenessScore(a.totalGoalsGuess, reals.total)
  const tb = closenessScore(b.totalGoalsGuess, reals.total)
  if (ta !== tb) return ta - tb
  const ca = closenessScore(a.colombiaGoalsGuess, reals.colombia)
  const cb = closenessScore(b.colombiaGoalsGuess, reals.colombia)
  if (ca !== cb) return ca - cb
  if (a.firstScorerCorrect !== b.firstScorerCorrect) return a.firstScorerCorrect ? -1 : 1
  return a.createdAt.getTime() - b.createdAt.getTime()
}

/**
 * Premio (COP) para una posición según el reparto y el pozo. Solo podio (1..split.length).
 */
export function prizeForPosition(position: number, split: number[], pot: number): number {
  const pct = position >= 1 && position <= split.length ? split[position - 1] ?? 0 : 0
  return Math.round((pot * pct) / 100)
}
