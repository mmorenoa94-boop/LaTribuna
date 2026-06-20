import { NextResponse } from 'next/server'
import { requireAuth, isAuthError } from '@/lib/auth-guard'
import { prisma } from '@/lib/prisma'
import { getAdminPool } from '@/lib/mundial'
import { computePending, type PendingEntry, type PendingMatch } from '@/lib/mundial-pending-pure'

// GET /api/admin/mundial/pending — quién no ha completado sus pronósticos.
// Cruza inscritos CONFIRMED contra los partidos aún pronosticables (OPEN).
export async function GET() {
  const authResult = await requireAuth('SUPER_ADMIN')
  if (isAuthError(authResult)) return authResult

  const pool = await getAdminPool()
  if (!pool) {
    return NextResponse.json({
      data: { totalConfirmed: 0, totalOpenMatches: 0, withPending: 0, complete: 0, users: [], byMatch: [] },
    })
  }

  // Partidos aún pronosticables (los que el inscrito todavía puede llenar).
  const openMatches = await prisma.poolMatch.findMany({
    where: { poolId: pool.id, status: 'OPEN' },
    orderBy: [{ kickoffAt: 'asc' }, { order: 'asc' }],
    select: { id: true, homeTeam: true, awayTeam: true, kickoffAt: true },
  })

  const entries = await prisma.poolEntry.findMany({
    where: { poolId: pool.id, status: 'CONFIRMED' },
    select: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      matchPredictions: { select: { matchId: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  const matches: PendingMatch[] = openMatches.map((m) => ({
    id: m.id,
    label: `${m.homeTeam} vs ${m.awayTeam}`,
    kickoffAt: m.kickoffAt ? m.kickoffAt.toISOString() : null,
  }))

  const pendingEntries: PendingEntry[] = entries.map((e) => ({
    userId: e.user.id,
    name: e.user.name,
    email: e.user.email,
    phone: e.user.phone,
    predictedMatchIds: e.matchPredictions.map((p) => p.matchId),
  }))

  return NextResponse.json({ data: computePending(pendingEntries, matches) })
}
