import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Expire premium business subscriptions.
 * Called daily.
 */
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()

    const result = await prisma.business.updateMany({
      where: {
        isPremium: true,
        premiumUntil: { lte: now },
      },
      data: { isPremium: false },
    })

    return NextResponse.json({ expired: result.count })
  } catch (error) {
    console.error('[cron/expire-premium]', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
