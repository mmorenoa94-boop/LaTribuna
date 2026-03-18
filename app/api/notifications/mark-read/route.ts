import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST — Mark notifications as read
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = await req.json()
  const { ids, all } = body as { ids?: string[]; all?: boolean }

  const now = new Date()

  if (all) {
    await prisma.notification.updateMany({
      where: { userId: session.user.id, readAt: null },
      data: { readAt: now },
    })
  } else if (ids && ids.length > 0) {
    await prisma.notification.updateMany({
      where: {
        id: { in: ids },
        userId: session.user.id, // security: only own notifications
        readAt: null,
      },
      data: { readAt: now },
    })
  } else {
    return NextResponse.json({ error: 'Provide ids array or all: true' }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
