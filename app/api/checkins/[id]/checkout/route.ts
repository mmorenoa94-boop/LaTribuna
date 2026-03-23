import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST — Checkout from a check-in
export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const checkin = await prisma.checkin.findUnique({
    where: { id: params.id },
  })

  if (!checkin) {
    return NextResponse.json({ error: 'Check-in no encontrado' }, { status: 404 })
  }

  if (checkin.userId !== session.user.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  if (checkin.checkedOut) {
    return NextResponse.json({ error: 'Ya hiciste checkout' }, { status: 400 })
  }

  const updated = await prisma.checkin.update({
    where: { id: params.id },
    data: { checkedOut: new Date() },
  })

  return NextResponse.json(updated)
}
