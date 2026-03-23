import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET — Battle detail with leaderboard
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const battle = await prisma.battle.findUnique({
    where: { id: params.id },
    include: {
      participants: {
        include: {
          business: { select: { id: true, name: true, logoUrl: true, city: true } },
        },
        orderBy: { score: 'desc' },
      },
    },
  })

  if (!battle) {
    return NextResponse.json({ error: 'Batalla no encontrada' }, { status: 404 })
  }

  return NextResponse.json(battle)
}
