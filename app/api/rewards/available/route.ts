import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/** GET /api/rewards/available — browse available rewards for hinchas */
export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const businessId = searchParams.get('businessId')
  const now = new Date()

  const rewards = await prisma.reward.findMany({
    where: {
      status: 'ACTIVE',
      ...(businessId && { businessId }),
      AND: [
        {
          OR: [
            { stock: null },
            { stock: { gt: 0 } },
          ],
        },
        {
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: now } },
          ],
        },
      ],
    },
    include: {
      business: { select: { id: true, name: true, logoUrl: true } },
    },
    orderBy: { pointsCost: 'asc' },
  })

  return NextResponse.json(rewards)
}
