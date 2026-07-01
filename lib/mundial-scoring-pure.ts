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

/**
 * Puntos del bracket de grupos (pregunta GROUP_RANK): suma `pointsPerPosition`
 * por cada equipo colocado en su puesto exacto, sumando los 12 grupos.
 * Ej. con 1 pt por posición: aciertos parciales suman (hasta 48 si están todos).
 */
export function computeBracketPoints(
  userAnswer: unknown,
  correctAnswer: unknown,
  pointsPerPosition: number
): { positionsCorrect: number; earned: number } {
  const positionsCorrect = countPositionsCorrect(userAnswer, correctAnswer)
  return { positionsCorrect, earned: positionsCorrect * Math.max(0, pointsPerPosition) }
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

// Fase por defecto de un partido (grupos). Cualquier otra fase es eliminación directa.
export const GROUP_STAGE_PHASE = 'Fase de grupos'

/** ¿El partido es de eliminación directa? (cualquier fase distinta a la de grupos). */
export function isKnockoutPhase(phase: string | null | undefined): boolean {
  if (!phase) return false
  return normalizeAnswer(phase) !== normalizeAnswer(GROUP_STAGE_PHASE)
}

/**
 * Equipo que el usuario "cree que avanza" según su predicción:
 * - si predijo un ganador a los 90', ese ganador es el avanzador implícito;
 * - si predijo empate, se usa su selección explícita (advancesPredict).
 * Devuelve null si predijo empate y no eligió equipo.
 */
export function impliedAdvancer(
  homePredict: number,
  awayPredict: number,
  homeTeam: string,
  awayTeam: string,
  advancesPredict: string | null
): string | null {
  const o = outcome(homePredict, awayPredict)
  if (o === 'H') return homeTeam
  if (o === 'A') return awayTeam
  return advancesPredict ?? null
}

/**
 * Equipo que realmente avanza en un partido de eliminación:
 * - si hubo un ganador a los 90', avanza el ganador;
 * - si terminó empatado a los 90' (prórroga/penales), lo define el admin (advancesReal).
 * Devuelve null si fue empate y el admin aún no cargó quién avanzó.
 */
export function realAdvancer(
  homeScore: number,
  awayScore: number,
  homeTeam: string,
  awayTeam: string,
  advancesReal: string | null
): string | null {
  const o = outcome(homeScore, awayScore)
  if (o === 'H') return homeTeam
  if (o === 'A') return awayTeam
  return advancesReal ?? null
}

/**
 * Bono por acertar qué equipo avanza. Aplica en TODO partido de eliminación directa
 * (marcador exacto + avanzador correcto → hasta 7 puntos):
 * - Si el partido se definió en los 90', el avanzador es el ganador; quien predijo a ese
 *   ganador (avanzador implícito) recibe el bono.
 * - Si terminó empatado a los 90' (prórroga/penales), el avanzador lo define el admin
 *   (advancesReal); si aún no lo cargó, no se otorga bono.
 * No aplica en fase de grupos.
 */
export function computeAdvancePoints(args: {
  isKnockout: boolean
  homeScore: number
  awayScore: number
  advancesReal: string | null
  homePredict: number
  awayPredict: number
  homeTeam: string
  awayTeam: string
  advancesPredict: string | null
  ptsAdvance: number
}): { advanceCorrect: boolean; earned: number } {
  const { isKnockout, homeScore, awayScore, advancesReal, homeTeam, awayTeam, ptsAdvance } = args
  if (!isKnockout) return { advanceCorrect: false, earned: 0 }

  const real = realAdvancer(homeScore, awayScore, homeTeam, awayTeam, advancesReal)
  if (!real) return { advanceCorrect: false, earned: 0 }

  const implied = impliedAdvancer(
    args.homePredict,
    args.awayPredict,
    args.homeTeam,
    args.awayTeam,
    args.advancesPredict
  )
  const advanceCorrect = implied != null && normalizeAnswer(implied) === normalizeAnswer(real)
  return { advanceCorrect, earned: advanceCorrect ? ptsAdvance : 0 }
}

// Campos mínimos necesarios para ordenar por la cascada de desempate
export interface RankSortable {
  totalPoints: number
  groupsCorrect: number // posiciones acertadas en los grupos (solo informativo; ya no desempata)
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
 * puntos → cercanía goles del mundial → cercanía goles de Colombia →
 * primer goleador → fecha de inscripción.
 * (El bracket de grupos ya NO es desempate: aporta puntos directos al total.)
 */
export function compareRanking(a: RankSortable, b: RankSortable, reals: ClosenessReals): number {
  if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints
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
