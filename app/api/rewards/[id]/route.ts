import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/** PATCH /api/rewards/[id] — update a reward */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (session.user.role !== 'NEGOCIO') return NextResponse.json({ error: 'Solo negocios' }, { status: 403 })

  const business = await prisma.business.findUnique({ where: { userId: session.user.id } })
  if (!business) return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 })

  const reward = await prisma.reward.findUnique({ where: { id: params.id } })
  if (!reward || reward.businessId !== business.id) {
    return NextResponse.json({ error: 'Premio no encontrado' }, { status: 404 })
  }

  const body = await req.json()
  const { name, description, imageUrl, pointsCost, stock, expiresAt, status } = body

  const updated = await prisma.reward.update({
    where: { id: params.id },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(imageUrl !== undefined && { imageUrl }),
      ...(pointsCost !== undefined && { pointsCost }),
      ...(stock !== undefined && { stock }),
      ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null }),
      ...(status !== undefined && { status }),
    },
  })

  return NextResponse.json(updated)
}

/** DELETE /api/rewards/[id] — soft-deactivate a reward */
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (session.user.role !== 'NEGOCIO') return NextResponse.json({ error: 'Solo negocios' }, { status: 403 })

  const business = await prisma.business.findUnique({ where: { userId: session.user.id } })
  if (!business) return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 })

  const reward = await prisma.reward.findUnique({ where: { id: params.id } })
  if (!reward || reward.businessId !== business.id) {
    return NextResponse.json({ error: 'Premio no encontrado' }, { status: 404 })
  }

  await prisma.reward.update({
    where: { id: params.id },
    data: { status: 'INACTIVE' },
  })

  return NextResponse.json({ success: true })
}
