import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/** GET /api/rewards — list rewards for the authenticated business */
export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (session.user.role !== 'NEGOCIO') return NextResponse.json({ error: 'Solo negocios' }, { status: 403 })

  const business = await prisma.business.findUnique({ where: { userId: session.user.id } })
  if (!business) return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 })

  const rewards = await prisma.reward.findMany({
    where: { businessId: business.id },
    include: { _count: { select: { redemptions: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(rewards)
}

/** POST /api/rewards — create a new reward */
export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (session.user.role !== 'NEGOCIO') return NextResponse.json({ error: 'Solo negocios' }, { status: 403 })

  const business = await prisma.business.findUnique({ where: { userId: session.user.id } })
  if (!business) return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 })

  const body = await req.json()
  const { name, description, imageUrl, pointsCost, stock, expiresAt } = body

  if (!name?.trim() || !pointsCost || pointsCost < 1) {
    return NextResponse.json({ error: 'name y pointsCost (>= 1) son requeridos' }, { status: 400 })
  }

  const reward = await prisma.reward.create({
    data: {
      businessId: business.id,
      name: name.trim(),
      description: description || null,
      imageUrl: imageUrl || null,
      pointsCost,
      stock: stock ?? null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
  })

  return NextResponse.json(reward, { status: 201 })
}
