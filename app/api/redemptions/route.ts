import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/** GET /api/redemptions — list redemptions for the authenticated hincha */
export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const redemptions = await prisma.redemption.findMany({
    where: { userId: session.user.id },
    include: {
      reward: {
        select: {
          name: true,
          description: true,
          imageUrl: true,
          pointsCost: true,
          business: { select: { id: true, name: true, logoUrl: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(redemptions)
}
