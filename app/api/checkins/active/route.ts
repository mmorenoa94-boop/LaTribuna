import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET — Current active check-in
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const eightHoursAgo = new Date(Date.now() - 8 * 60 * 60 * 1000)

  const checkin = await prisma.checkin.findFirst({
    where: {
      userId: session.user.id,
      checkedOut: null,
      checkedAt: { gte: eightHoursAgo },
    },
    include: {
      business: { select: { id: true, name: true, logoUrl: true, address: true } },
    },
    orderBy: { checkedAt: 'desc' },
  })

  return NextResponse.json(checkin)
}
