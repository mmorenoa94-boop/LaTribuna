import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/promotions/[id]/send
 * Send push notifications for a promotion to the target segment.
 * Updates status to SENT and sentAt to now().
 */
export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (session.user.role !== 'NEGOCIO') return NextResponse.json({ error: 'Solo negocios' }, { status: 403 })

  const business = await prisma.business.findUnique({ where: { userId: session.user.id } })
  if (!business) return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 })

  const promotion = await prisma.promotion.findUnique({ where: { id: params.id } })
  if (!promotion || promotion.businessId !== business.id) {
    return NextResponse.json({ error: 'Promoción no encontrada' }, { status: 404 })
  }

  if (promotion.status === 'SENT') {
    return NextResponse.json({ error: 'Ya fue enviada' }, { status: 400 })
  }

  // Determine target users based on segment
  let userIds: string[] = []

  switch (promotion.segment) {
    case 'ALL_IN_VENUE': {
      // Users who have checked in today (Colombia timezone UTC-5)
      const now = new Date()
      const colombiaOffset = -5 * 60
      const utcMs = now.getTime() + now.getTimezoneOffset() * 60_000
      const colombiaNow = new Date(utcMs + colombiaOffset * 60_000)
      const today = new Date(colombiaNow.getFullYear(), colombiaNow.getMonth(), colombiaNow.getDate())
      // Convert back to UTC for DB query
      today.setMinutes(today.getMinutes() - colombiaOffset - now.getTimezoneOffset())
      const checkins = await prisma.checkin.findMany({
        where: { businessId: business.id, checkedAt: { gte: today } },
        select: { userId: true },
        distinct: ['userId'],
      })
      userIds = checkins.map((c) => c.userId)
      break
    }
    case 'LEAGUE_PLAYERS': {
      // Members of any league belonging to this business
      const members = await prisma.leagueMember.findMany({
        where: { league: { businessId: business.id }, status: 'APPROVED' },
        select: { userId: true },
        distinct: ['userId'],
      })
      userIds = members.map((m) => m.userId)
      break
    }
    case 'VERIFIED_CONSUMERS': {
      // League members with consumptionVerified = true
      const verified = await prisma.leagueMember.findMany({
        where: { league: { businessId: business.id }, consumptionVerified: true },
        select: { userId: true },
        distinct: ['userId'],
      })
      userIds = verified.map((m) => m.userId)
      break
    }
    case 'RECURRING': {
      // Users with 3+ check-ins at this business
      const recurring = await prisma.checkin.groupBy({
        by: ['userId'],
        where: { businessId: business.id },
        having: { userId: { _count: { gte: 3 } } },
      })
      userIds = recurring.map((r) => r.userId)
      break
    }
  }

  // Get push subscriptions for these users
  const channels = (promotion.channels as string[]) ?? []
  let pushCount = 0

  if (channels.includes('push') && userIds.length > 0) {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId: { in: userIds } },
    })

    if (subscriptions.length > 0) {
      try {
        const webpush = await import('web-push')

        const vapidPublic = process.env.VAPID_PUBLIC_KEY
        const vapidPrivate = process.env.VAPID_PRIVATE_KEY

        if (vapidPublic && vapidPrivate) {
          webpush.setVapidDetails(
            'mailto:admin@latribuna.app',
            vapidPublic,
            vapidPrivate
          )

          const payload = JSON.stringify({
            title: business.name,
            body: promotion.message,
            icon: business.logoUrl ?? '/icons/icon-192.png',
            data: { type: 'promotion', promotionId: promotion.id },
          })

          const results = await Promise.allSettled(
            subscriptions.map((sub) =>
              webpush.sendNotification(
                {
                  endpoint: sub.endpoint,
                  keys: { p256dh: sub.p256dh, auth: sub.auth },
                },
                payload
              )
            )
          )

          pushCount = results.filter((r) => r.status === 'fulfilled').length

          // Remove stale subscriptions (410 Gone)
          const staleEndpoints = results
            .map((r, i) => (r.status === 'rejected' && (r.reason as Record<string, unknown>)?.statusCode === 410 ? subscriptions[i].endpoint : null))
            .filter(Boolean) as string[]

          if (staleEndpoints.length > 0) {
            await prisma.pushSubscription.deleteMany({
              where: { endpoint: { in: staleEndpoints } },
            })
          }
        }
      } catch {
        // web-push not available or VAPID not configured — continue silently
      }
    }
  }

  // Create in-app notifications
  if (channels.includes('in-app') && userIds.length > 0) {
    await prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        type: 'PROMOTION',
        title: business.name,
        body: promotion.message,
        data: { promotionId: promotion.id, imageUrl: promotion.imageUrl },
      })),
    })
  }

  // Update promotion status
  const updated = await prisma.promotion.update({
    where: { id: promotion.id },
    data: {
      status: 'SENT',
      sentAt: new Date(),
      reach: userIds.length,
    },
  })

  return NextResponse.json({
    ...updated,
    stats: { targetUsers: userIds.length, pushSent: pushCount },
  })
}
