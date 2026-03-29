import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Expire old DRAFT promotions (older than 30 days).
 * Called every hour.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const result = await prisma.promotion.updateMany({
      where: {
        status: 'DRAFT',
        createdAt: { lte: thirtyDaysAgo },
      },
      data: { status: 'EXPIRED' },
    })

    return NextResponse.json({ expired: result.count })
  } catch (error) {
    console.error('[cron/expire-promotions]', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
