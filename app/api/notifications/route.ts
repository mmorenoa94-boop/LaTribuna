import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET — User's notifications (paginated)
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '30'), 50)
  const cursor = searchParams.get('cursor') // last notification id for cursor pagination

  const notifications = await prisma.notification.findMany({
    where: {
      userId: session.user.id,
      ...(cursor && { id: { lt: cursor } }),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  return NextResponse.json({
    notifications,
    nextCursor: notifications.length === limit ? notifications[notifications.length - 1]?.id : null,
  })
}
