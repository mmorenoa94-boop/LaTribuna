import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getFixturesByDate, fixtureToMatch } from '@/lib/api-football'
import { emitMatchUpdate } from '@/lib/socket-emit'

/**
 * Sync live matches from API-Football.
 * Called every 60 seconds by external cron (Railway/Vercel).
 * GET /api/cron/sync-matches?secret=CRON_SECRET
 */
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get all matches that are currently LIVE or SCHEDULED for today
    const today = new Date().toISOString().split('T')[0]

    // Find matches in our DB that are LIVE or HALFTIME (need updating)
    const activeMatches = await prisma.match.findMany({
      where: { status: { in: ['LIVE', 'HALFTIME'] } },
      select: { id: true, externalId: true },
    })

    if (activeMatches.length === 0) {
      return NextResponse.json({ message: 'No active matches to sync', updated: 0 })
    }

    let updatedCount = 0

    // Fetch from API-Football by date (includes all live matches)
    const fixtures = await getFixturesByDate({ date: today })

    // Build lookup map from external ID
    const fixtureMap = new Map(fixtures.map(f => [String(f.fixture.id), f]))

    for (const match of activeMatches) {
      const fixture = fixtureMap.get(match.externalId)
      if (!fixture) continue

      const mapped = fixtureToMatch(fixture)

      await prisma.match.update({
        where: { id: match.id },
        data: {
          status: mapped.status,
          homeScore: mapped.homeScore,
          awayScore: mapped.awayScore,
          minutePlayed: mapped.minutePlayed,
        },
      })

      // Emit real-time update to connected clients
      await emitMatchUpdate(match.id, {
        homeScore: mapped.homeScore,
        awayScore: mapped.awayScore,
        status: mapped.status,
        minutePlayed: mapped.minutePlayed,
      })

      updatedCount++
    }

    return NextResponse.json({ updated: updatedCount, checked: activeMatches.length })
  } catch (error) {
    console.error('[cron/sync-matches]', error)
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}
