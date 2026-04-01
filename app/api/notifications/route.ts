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

// DELETE — Delete notifications (individual or all)
export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = await req.json()
  const { ids, all } = body as { ids?: string[]; all?: boolean }

  if (all) {
    const result = await prisma.notification.deleteMany({
      where: { userId: session.user.id },
    })
    return NextResponse.json({ deleted: result.count })
  }

  if (ids && ids.length > 0) {
    const result = await prisma.notification.deleteMany({
      where: {
        id: { in: ids },
        userId: session.user.id,
      },
    })
    return NextResponse.json({ deleted: result.count })
  }

  return NextResponse.json({ error: 'Provide ids array or all: true' }, { status: 400 })
}
