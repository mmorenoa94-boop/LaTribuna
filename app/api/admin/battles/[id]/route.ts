import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH — Update battle
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  if (session.user.role !== 'SUPER_ADMIN') return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const body = await req.json()
  const { name, zone, matchIds, prizeDesc, prizeAmount, startDate, endDate, status } = body

  const battle = await prisma.battle.update({
    where: { id: params.id },
    data: {
      ...(name !== undefined && { name }),
      ...(zone !== undefined && { zone }),
      ...(matchIds !== undefined && { matchIds }),
      ...(prizeDesc !== undefined && { prizeDesc }),
      ...(prizeAmount !== undefined && { prizeAmount }),
      ...(startDate !== undefined && { startDate: new Date(startDate) }),
      ...(endDate !== undefined && { endDate: new Date(endDate) }),
      ...(status !== undefined && { status }),
    },
  })

  return NextResponse.json(battle)
}

// DELETE — Delete battle (only if UPCOMING)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  if (session.user.role !== 'SUPER_ADMIN') return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const battle = await prisma.battle.findUnique({ where: { id: params.id } })
  if (!battle) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
  if (battle.status !== 'UPCOMING') {
    return NextResponse.json({ error: 'Solo se puede eliminar una batalla UPCOMING' }, { status: 400 })
  }

  // Delete participants first, then battle
  await prisma.battleParticipant.deleteMany({ where: { battleId: params.id } })
  await prisma.battle.delete({ where: { id: params.id } })

  return NextResponse.json({ success: true })
}
