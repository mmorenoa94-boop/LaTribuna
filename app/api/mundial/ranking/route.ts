import { NextResponse } from 'next/server'
import { requireAuth, isAuthError } from '@/lib/auth-guard'
import { getVisiblePool } from '@/lib/mundial'
import { buildRanking } from '@/lib/mundial-scoring'

// GET /api/mundial/ranking — leaderboard con cascada de desempate y premios
export async function GET() {
  const authResult = await requireAuth()
  if (isAuthError(authResult)) return authResult

  const pool = await getVisiblePool()
  if (!pool) return NextResponse.json({ data: [], pool: null })

  const ranking = await buildRanking(pool.id)

  return NextResponse.json({
    data: ranking,
    pool: {
      id: pool.id,
      name: pool.name,
      status: pool.status,
      entryFee: pool.entryFee,
      prizeSplit: (pool.prizeSplit as number[]) ?? [60, 30, 10],
      pot: pool.entryFee * ranking.length,
      matchPointsOutcome: pool.matchPointsOutcome,
      matchPointsExactBonus: pool.matchPointsExactBonus,
    },
  })
}
