import { NextResponse } from 'next/server'
import { requireAuth, isAuthError } from '@/lib/auth-guard'
import { prisma } from '@/lib/prisma'
import { getVisiblePool } from '@/lib/mundial'
import { buildRanking } from '@/lib/mundial-scoring'
import { dayKey } from '@/lib/mundial-matches-pure'
import {
  buildStandingsHistory,
  extractUserHistory,
  type HistoryEntry,
  type HistoryMatch,
} from '@/lib/mundial-standings-pure'
import type { PoolPlayerMatchBreakdown } from '@/types'

// Etiqueta corta de día a partir de la clave YYYY-MM-DD (en convención UTC del proyecto).
function dayLabel(key: string): string {
  const d = Date.parse(key + 'T00:00:00Z')
  if (Number.isNaN(d)) return key
  return new Date(d)
    .toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
    .replace(',', '')
    .toUpperCase() // "VIE 20 JUN"
}

// GET /api/mundial/player/[userId] — desglose de puntos + evolución de posición.
// PRIVACIDAD: solo se exponen partidos FINISHED (con marcador real cargado por el admin).
export async function GET(_req: Request, { params }: { params: { userId: string } }) {
  const authResult = await requireAuth()
  if (isAuthError(authResult)) return authResult

  const pool = await getVisiblePool()
  if (!pool) return NextResponse.json({ error: 'No hay polla activa' }, { status: 404 })

  // Ranking oficial → posición/puntos/nombre del jugador (consistente con la lista).
  const ranking = await buildRanking(pool.id)
  const me = ranking.find((r) => r.userId === params.userId)
  if (!me) {
    return NextResponse.json({ error: 'Participante no encontrado' }, { status: 404 })
  }

  // Solo partidos FINALIZADOS (marcador real ya cargado) → gate de privacidad.
  const finishedMatches = await prisma.poolMatch.findMany({
    where: { poolId: pool.id, status: 'FINISHED', homeScore: { not: null }, awayScore: { not: null } },
    orderBy: [{ kickoffAt: 'asc' }, { order: 'asc' }],
  })

  // Todas las inscripciones confirmadas con sus predicciones (para el histórico).
  const entries = await prisma.poolEntry.findMany({
    where: { poolId: pool.id, status: 'CONFIRMED' },
    select: {
      userId: true,
      createdAt: true,
      matchPredictions: {
        select: {
          matchId: true,
          homePredict: true,
          awayPredict: true,
          pointsEarned: true,
          outcomeCorrect: true,
          exactCorrect: true,
        },
      },
    },
  })

  // --- Desglose por partido finalizado del jugador objetivo ---
  const target = entries.find((e) => e.userId === params.userId)
  const predByMatch = new Map(
    (target?.matchPredictions ?? []).map((p) => [p.matchId, p])
  )
  const breakdown: PoolPlayerMatchBreakdown[] = finishedMatches.map((m) => {
    const p = predByMatch.get(m.id)
    return {
      matchId: m.id,
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam,
      homeFlag: m.homeFlag,
      awayFlag: m.awayFlag,
      kickoffAt: m.kickoffAt ? m.kickoffAt.toISOString() : null,
      homeScore: m.homeScore as number,
      awayScore: m.awayScore as number,
      predicted: p ? { home: p.homePredict, away: p.awayPredict } : null,
      pointsEarned: p?.pointsEarned ?? 0,
      outcomeCorrect: p?.outcomeCorrect ?? false,
      exactCorrect: p?.exactCorrect ?? false,
    }
  })

  // --- Evolución de posición por jornada (reconstrucción al vuelo) ---
  const finishedIds = new Set(finishedMatches.map((m) => m.id))
  const historyEntries: HistoryEntry[] = entries.map((e) => ({
    userId: e.userId,
    createdAt: e.createdAt.getTime(),
    // Solo predicciones de partidos finalizados aportan al acumulado histórico.
    predictions: e.matchPredictions
      .filter((p) => finishedIds.has(p.matchId))
      .map((p) => ({ matchId: p.matchId, pointsEarned: p.pointsEarned })),
  }))
  const historyMatches: HistoryMatch[] = finishedMatches.map((m) => ({
    id: m.id,
    dayKey: dayKey(m.kickoffAt ? m.kickoffAt.toISOString() : null),
  }))

  const fullHistory = buildStandingsHistory(historyEntries, historyMatches)
  const userHistory = extractUserHistory(fullHistory, params.userId).map((h) => ({
    ...h,
    label: dayLabel(h.dayKey),
  }))

  return NextResponse.json({
    data: {
      userId: me.userId,
      name: me.name,
      image: me.image ?? null,
      position: me.position,
      totalPoints: me.totalPoints,
      matchesCorrect: me.matchesCorrect,
      exactCorrect: me.exactCorrect,
      breakdown,
      history: userHistory,
    },
  })
}
