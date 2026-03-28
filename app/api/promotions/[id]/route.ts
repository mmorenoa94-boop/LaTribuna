import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/** PATCH /api/promotions/[id] — update a draft/scheduled promotion */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (session.user.role !== 'NEGOCIO') return NextResponse.json({ error: 'Solo negocios' }, { status: 403 })

  const business = await prisma.business.findUnique({ where: { userId: session.user.id } })
  if (!business) return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 })

  const promotion = await prisma.promotion.findUnique({ where: { id: params.id } })
  if (!promotion || promotion.businessId !== business.id) {
    return NextResponse.json({ error: 'Promoción no encontrada' }, { status: 404 })
  }

  if (promotion.status === 'SENT') {
    return NextResponse.json({ error: 'No se puede editar una promoción ya enviada' }, { status: 400 })
  }

  const body = await req.json()
  const data: Record<string, unknown> = {}

  if (body.title !== undefined) data.title = body.title?.trim() || null
  if (body.message !== undefined) {
    const msg = body.message?.trim()
    if (!msg || msg.length > 120) {
      return NextResponse.json({ error: 'Mensaje requerido (máx 120 caracteres)' }, { status: 400 })
    }
    data.message = msg
  }

  if (body.imageUrl !== undefined) data.imageUrl = body.imageUrl || null
  if (body.segment !== undefined) data.segment = body.segment
  if (body.channels !== undefined) data.channels = body.channels
  if (body.timing !== undefined) {
    data.timing = body.timing
    data.status = body.timing === 'SCHEDULED' ? 'SCHEDULED' : 'DRAFT'
  }
  // datetime-local input has no timezone — treat as Colombia time (UTC-5)
  if (body.scheduledAt !== undefined) data.scheduledAt = body.scheduledAt ? new Date(body.scheduledAt + '-05:00') : null

  const updated = await prisma.promotion.update({
    where: { id: params.id },
    data,
  })

  return NextResponse.json(updated)
}

/** DELETE /api/promotions/[id] — delete a promotion (only if not sent) */
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (session.user.role !== 'NEGOCIO') return NextResponse.json({ error: 'Solo negocios' }, { status: 403 })

  const business = await prisma.business.findUnique({ where: { userId: session.user.id } })
  if (!business) return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 })

  const promotion = await prisma.promotion.findUnique({ where: { id: params.id } })
  if (!promotion || promotion.businessId !== business.id) {
    return NextResponse.json({ error: 'Promoción no encontrada' }, { status: 404 })
  }

  await prisma.promotion.delete({ where: { id: params.id } })

  return NextResponse.json({ ok: true })
}
