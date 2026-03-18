import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET — Count of unread notifications (for badge)
export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const count = await prisma.notification.count({
    where: {
      userId: session.user.id,
      readAt: null,
    },
  })

  return NextResponse.json({ count })
}
