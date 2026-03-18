import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Expire unredeemed rewards past their expiration date.
 * Called every hour.
 */
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()

    const result = await prisma.redemption.updateMany({
      where: {
        status: 'PENDING',
        expiresAt: { lte: now },
      },
      data: { status: 'EXPIRED' },
    })

    return NextResponse.json({ expired: result.count })
  } catch (error) {
    console.error('[cron/expire-redemptions]', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
