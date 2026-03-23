import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/** POST /api/redemptions/[id]/verify — business staff verifies a redemption by ID */
export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (session.user.role !== 'NEGOCIO') return NextResponse.json({ error: 'Solo negocios' }, { status: 403 })

  const business = await prisma.business.findUnique({ where: { userId: session.user.id } })
  if (!business) return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 })

  const redemption = await prisma.redemption.findUnique({
    where: { id: params.id },
    include: { reward: { select: { businessId: true, name: true } } },
  })

  if (!redemption) {
    return NextResponse.json({ error: 'Canje no encontrado' }, { status: 404 })
  }

  if (redemption.reward.businessId !== business.id) {
    return NextResponse.json({ error: 'Este canje no pertenece a tu negocio' }, { status: 403 })
  }

  if (redemption.status === 'REDEEMED') {
    return NextResponse.json({ error: 'Este canje ya fue verificado' }, { status: 400 })
  }

  if (redemption.status === 'EXPIRED' || redemption.expiresAt < new Date()) {
    // Mark as expired if not already
    if (redemption.status !== 'EXPIRED') {
      await prisma.redemption.update({ where: { id: params.id }, data: { status: 'EXPIRED' } })
    }
    return NextResponse.json({ error: 'Este canje ha expirado' }, { status: 400 })
  }

  const updated = await prisma.redemption.update({
    where: { id: params.id },
    data: { status: 'REDEEMED', redeemedAt: new Date() },
  })

  return NextResponse.json(updated)
}
