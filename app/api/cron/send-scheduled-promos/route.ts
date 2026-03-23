import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import webpush from 'web-push'

/**
 * Send scheduled promotions whose scheduledAt has passed.
 * Called every 1 minute.
 */
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Configure web-push (same as promotions/[id]/send)
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
      `mailto:${process.env.VAPID_EMAIL ?? 'push@latribuna.co'}`,
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    )
  }

  try {
    const now = new Date()

    const promos = await prisma.promotion.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledAt: { lte: now },
      },
      include: {
        business: { select: { id: true, name: true } },
      },
    })

    let sentCount = 0

    for (const promo of promos) {
      // Determine target users based on segment
      let userIds: string[] = []

      if (promo.segment === 'ALL_IN_VENUE') {
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const checkins = await prisma.checkin.findMany({
          where: { businessId: promo.businessId, checkedAt: { gte: todayStart } },
          select: { userId: true },
          distinct: ['userId'],
        })
        userIds = checkins.map(c => c.userId)
      } else if (promo.segment === 'LEAGUE_PLAYERS') {
        const leagues = await prisma.league.findMany({
          where: { businessId: promo.businessId },
          select: { id: true },
        })
        const members = await prisma.leagueMember.findMany({
          where: { leagueId: { in: leagues.map(l => l.id) }, status: 'APPROVED' },
          select: { userId: true },
          distinct: ['userId'],
        })
        userIds = members.map(m => m.userId)
      } else if (promo.segment === 'VERIFIED_CONSUMERS') {
        const leagues = await prisma.league.findMany({
          where: { businessId: promo.businessId },
          select: { id: true },
        })
        const members = await prisma.leagueMember.findMany({
          where: { leagueId: { in: leagues.map(l => l.id) }, status: 'APPROVED', consumptionVerified: true },
          select: { userId: true },
          distinct: ['userId'],
        })
        userIds = members.map(m => m.userId)
      } else if (promo.segment === 'RECURRING') {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        const checkins = await prisma.checkin.groupBy({
          by: ['userId'],
          where: { businessId: promo.businessId, checkedAt: { gte: thirtyDaysAgo } },
          having: { userId: { _count: { gte: 3 } } },
        })
        userIds = checkins.map(c => c.userId)
      }

      const channels = promo.channels as string[]

      // Send push notifications
      if (channels.includes('push') && userIds.length > 0) {
        const subs = await prisma.pushSubscription.findMany({
          where: { userId: { in: userIds } },
        })

        const payload = JSON.stringify({
          title: promo.business.name,
          body: promo.message,
          icon: '/icons/icon-192.png',
          data: { url: '/home', promoId: promo.id },
        })

        for (const sub of subs) {
          try {
            await webpush.sendNotification(
              { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
              payload
            )
          } catch (err: unknown) {
            if (err instanceof Error && 'statusCode' in err && (err as Record<string, unknown>).statusCode === 410) {
              await prisma.pushSubscription.delete({ where: { id: sub.id } })
            }
          }
        }
      }

      // Create in-app notifications
      if (channels.includes('in-app') && userIds.length > 0) {
        await prisma.notification.createMany({
          data: userIds.map(userId => ({
            userId,
            type: 'PROMOTION',
            title: promo.business.name,
            body: promo.message,
            data: { promoId: promo.id },
          })),
        })
      }

      // Update promotion status
      await prisma.promotion.update({
        where: { id: promo.id },
        data: { status: 'SENT', sentAt: now, reach: userIds.length },
      })

      sentCount++
    }

    return NextResponse.json({ sent: sentCount })
  } catch (error) {
    console.error('[cron/send-scheduled-promos]', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
