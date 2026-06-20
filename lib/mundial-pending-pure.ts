/**
 * Lógica pura para el reporte de "pronósticos pendientes" de la Polla Mundialista.
 * Cruza inscritos confirmados contra los partidos aún pronosticables (OPEN) y
 * detecta quién no ha completado sus marcadores. SIN dependencias de Prisma/DB.
 */

/** Partido aún pronosticable considerado en el reporte. */
export type PendingMatch = { id: string; label: string; kickoffAt: string | null }

/** Inscrito confirmado con los IDs de partidos que YA pronosticó. */
export type PendingEntry = {
  userId: string
  name: string
  email: string
  phone: string | null
  predictedMatchIds: string[]
}

export type PendingUserRow = {
  userId: string
  name: string
  email: string
  phone: string | null
  missing: number
  done: number
}

export type PendingMatchRow = {
  id: string
  label: string
  kickoffAt: string | null
  missing: number
}

export type PendingReport = {
  totalConfirmed: number
  totalOpenMatches: number
  withPending: number // inscritos a los que les falta al menos un partido
  complete: number // inscritos al día (sin pendientes)
  users: PendingUserRow[] // SOLO los que tienen pendientes, ordenados por faltantes desc
  byMatch: PendingMatchRow[] // todos los partidos, ordenados como vienen (cronológico)
}

/**
 * Calcula el reporte de pendientes. Determinista: ordena los usuarios con pendientes
 * por (faltantes DESC, nombre ASC) y respeta el orden de `matches` para byMatch.
 */
export function computePending(entries: PendingEntry[], matches: PendingMatch[]): PendingReport {
  const matchIds = matches.map((m) => m.id)
  const matchIdSet = new Set(matchIds)

  const allRows: PendingUserRow[] = entries.map((e) => {
    const predicted = new Set(e.predictedMatchIds.filter((id) => matchIdSet.has(id)))
    const done = predicted.size
    return {
      userId: e.userId,
      name: e.name,
      email: e.email,
      phone: e.phone,
      done,
      missing: matchIds.length - done,
    }
  })

  const users = allRows
    .filter((r) => r.missing > 0)
    .sort((a, b) => b.missing - a.missing || a.name.localeCompare(b.name, 'es'))

  const complete = allRows.length - users.length

  const byMatch: PendingMatchRow[] = matches.map((m) => {
    let missing = 0
    for (const e of entries) {
      if (!e.predictedMatchIds.includes(m.id)) missing++
    }
    return { id: m.id, label: m.label, kickoffAt: m.kickoffAt, missing }
  })

  return {
    totalConfirmed: entries.length,
    totalOpenMatches: matches.length,
    withPending: users.length,
    complete,
    users,
    byMatch,
  }
}
