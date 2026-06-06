import { NextResponse } from 'next/server'
import { requireAuth, isAuthError } from '@/lib/auth-guard'
import { prisma } from '@/lib/prisma'
import { getVisiblePool } from '@/lib/mundial'
import { poolEntrySchema } from '@/lib/validations'

// POST /api/mundial/entry — solicitar cupo (crea PoolEntry PENDING)
export async function POST(req: Request) {
  const authResult = await requireAuth()
  if (isAuthError(authResult)) return authResult
  const { session } = authResult

  const pool = await getVisiblePool()
  if (!pool) {
    return NextResponse.json({ error: 'No hay polla activa' }, { status: 404 })
  }
  if (pool.status !== 'OPEN_REGISTRATION') {
    return NextResponse.json(
      { error: 'Las inscripciones no están abiertas' },
      { status: 400 }
    )
  }

  const body = await req.json().catch(() => ({}))
  const parsed = poolEntrySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  const existing = await prisma.poolEntry.findUnique({
    where: { poolId_userId: { poolId: pool.id, userId: session.user.id } },
  })
  if (existing) {
    return NextResponse.json(
      { error: 'Ya solicitaste cupo en esta polla', entry: existing },
      { status: 409 }
    )
  }

  const entry = await prisma.poolEntry.create({
    data: {
      poolId: pool.id,
      userId: session.user.id,
      paymentNote: parsed.data.paymentNote,
      status: 'PENDING',
    },
  })

  return NextResponse.json({ data: entry })
}
