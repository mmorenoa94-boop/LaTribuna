import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Reset broken streaks daily at midnight.
 * Users who didn't play yesterday get streak reset to 0.
 * Called daily at midnight COT (UTC-5).
 */
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(0, 0, 0, 0)

    // Reset streaks for users who didn't play yesterday
    const result = await prisma.user.updateMany({
      where: {
        streak: { gt: 0 },
        OR: [
          { streakLastAt: null },
          { streakLastAt: { lt: yesterday } },
        ],
      },
      data: { streak: 0 },
    })

    return NextResponse.json({ reset: result.count })
  } catch (error) {
    console.error('[cron/update-streaks]', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
