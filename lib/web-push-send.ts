import { prisma } from '@/lib/prisma'

export interface WebPushPayload {
  title: string
  body: string
  icon?: string
  image?: string
  tag?: string
  data?: Record<string, string>
  actions?: Array<{ action: string; title: string }>
}

/**
 * Send web push notifications to specific users via VAPID.
 * Automatically cleans up stale (410 Gone) subscriptions.
 * Returns the number of successfully sent notifications.
 */
export async function sendWebPush(
  userIds: string[],
  payload: WebPushPayload
): Promise<number> {
  if (userIds.length === 0) return 0

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId: { in: userIds } },
  })

  if (subscriptions.length === 0) return 0

  try {
    const webpush = await import('web-push')

    const vapidPublic = process.env.VAPID_PUBLIC_KEY
    const vapidPrivate = process.env.VAPID_PRIVATE_KEY

    if (!vapidPublic || !vapidPrivate) {
      console.warn('[web-push] VAPID keys not configured')
      return 0
    }

    webpush.setVapidDetails(
      'mailto:admin@latribuna.app',
      vapidPublic,
      vapidPrivate
    )

    const payloadStr = JSON.stringify(payload)

    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payloadStr
        )
      )
    )

    const pushCount = results.filter((r) => r.status === 'fulfilled').length

    // Clean up stale subscriptions (410 Gone)
    const staleEndpoints = results
      .map((r, i) =>
        r.status === 'rejected' &&
        (r.reason as Record<string, unknown>)?.statusCode === 410
          ? subscriptions[i].endpoint
          : null
      )
      .filter(Boolean) as string[]

    if (staleEndpoints.length > 0) {
      await prisma.pushSubscription.deleteMany({
        where: { endpoint: { in: staleEndpoints } },
      })
    }

    return pushCount
  } catch (err) {
    console.error('[web-push] send error:', err)
    return 0
  }
}
