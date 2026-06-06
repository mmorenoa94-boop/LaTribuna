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
 * Para una pregunta GROUP_RANK: cuenta cuántos grupos el usuario acertó
 * (mismos 2 clasificados en el mismo orden 1°/2°).
 * Estructura esperada (tanto en answer del usuario como en correctAnswer):
 *   { "A": ["Equipo X", "Equipo Y"], "B": [...], ... }
 */
export function countGroupsCorrect(userAnswer: unknown, correctAnswer: unknown): number {
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
    if (
      expected.length >= 2 && got.length >= 2 &&
      normalizeAnswer(expected[0]) === normalizeAnswer(got[0]) &&
      normalizeAnswer(expected[1]) === normalizeAnswer(got[1])
    ) {
      correct++
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
  groupsCorrect: number
  colombiaGoalsGuess: number | null
  firstScorerCorrect: boolean
  createdAt: Date
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
 * puntos → grupos → cercanía goles Colombia → primer goleador → fecha inscripción.
 */
export function compareRanking(a: RankSortable, b: RankSortable, real: number | null): number {
  if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints
  if (b.groupsCorrect !== a.groupsCorrect) return b.groupsCorrect - a.groupsCorrect
  const ca = closenessScore(a.colombiaGoalsGuess, real)
  const cb = closenessScore(b.colombiaGoalsGuess, real)
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
