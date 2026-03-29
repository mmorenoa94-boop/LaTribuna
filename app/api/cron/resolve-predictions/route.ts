import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { scorePredictions } from '@/lib/scoring'

/**
 * Auto-resolve predictions when matches finish.
 * Finds FINISHED matches with unresolved predictions and scores them
 * using the pari-mutuel (pot) system.
 * Called every 2 minutes.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Find finished matches that have unresolved predictions
    const matchesWithPending = await prisma.match.findMany({
      where: {
        status: 'FINISHED',
        homeScore: { not: null },
        awayScore: { not: null },
        leagueMatches: {
          some: {
            league: {
              questions: {
                some: {
                  predictions: {
                    some: { isCorrect: null },
                  },
                },
              },
            },
          },
        },
      },
      select: { id: true },
    })

    let totalScored = 0
    let totalCorrect = 0

    for (const match of matchesWithPending) {
      const result = await scorePredictions(match.id)
      totalScored += result.scored
      totalCorrect += result.correct
    }

    return NextResponse.json({
      matches: matchesWithPending.length,
      scored: totalScored,
      correct: totalCorrect,
    })
  } catch (error) {
    console.error('[cron/resolve-predictions]', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
