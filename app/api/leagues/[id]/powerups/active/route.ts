import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET — Active power-up in league (FIRED and not expired by duration)
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  // Verify membership
  const member = await prisma.leagueMember.findUnique({
    where: { leagueId_userId: { leagueId: params.id, userId: session.user.id } },
  })
  if (!member || member.status !== 'APPROVED') {
    return NextResponse.json({ error: 'No eres miembro de esta liga' }, { status: 403 })
  }

  const now = new Date()

  // Find FIRED powerup where firedAt + durationSecs > now
  const powerups = await prisma.powerUp.findMany({
    where: {
      leagueId: params.id,
      status: 'FIRED',
      firedAt: { not: null },
    },
  })

  // Filter by duration (Prisma can't do date math in where)
  const active = powerups.find(pu => {
    if (!pu.firedAt) return false
    const expiresAt = new Date(pu.firedAt.getTime() + pu.durationSecs * 1000)
    return expiresAt > now
  })

  return NextResponse.json(active ?? null)
}
