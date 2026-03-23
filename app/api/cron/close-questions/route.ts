import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Close expired questions (OPEN where closedAt < now).
 * Called every 30 seconds by external cron.
 */
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()

    const result = await prisma.leagueQuestion.updateMany({
      where: {
        status: 'OPEN',
        closedAt: { lte: now },
      },
      data: {
        status: 'CLOSED',
      },
    })

    return NextResponse.json({ closed: result.count })
  } catch (error) {
    console.error('[cron/close-questions]', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
