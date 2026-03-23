import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/** POST /api/redemptions/verify-code — business looks up and verifies a redemption by code */
export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (session.user.role !== 'NEGOCIO') return NextResponse.json({ error: 'Solo negocios' }, { status: 403 })

  const business = await prisma.business.findUnique({ where: { userId: session.user.id } })
  if (!business) return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 })

  const { code } = await req.json()
  if (!code?.trim()) return NextResponse.json({ error: 'Codigo requerido' }, { status: 400 })

  const redemption = await prisma.redemption.findUnique({
    where: { code: code.trim().toUpperCase() },
    include: {
      reward: { select: { businessId: true, name: true, pointsCost: true } },
      user: { select: { name: true, image: true } },
    },
  })

  if (!redemption) {
    return NextResponse.json({ error: 'Codigo no valido' }, { status: 404 })
  }

  if (redemption.reward.businessId !== business.id) {
    return NextResponse.json({ error: 'Este canje no pertenece a tu negocio' }, { status: 403 })
  }

  if (redemption.status === 'REDEEMED') {
    return NextResponse.json({ error: 'Ya fue canjeado', redemption }, { status: 400 })
  }

  if (redemption.status === 'EXPIRED' || redemption.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Codigo expirado' }, { status: 400 })
  }

  // Mark as redeemed
  const updated = await prisma.redemption.update({
    where: { id: redemption.id },
    data: { status: 'REDEEMED', redeemedAt: new Date() },
  })

  return NextResponse.json({
    success: true,
    redemption: updated,
    reward: redemption.reward,
    user: redemption.user,
  })
}
