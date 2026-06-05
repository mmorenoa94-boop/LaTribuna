import { NextResponse } from 'next/server'
import { requireAuth, isAuthError } from '@/lib/auth-guard'
import { prisma } from '@/lib/prisma'
import { getAdminPool } from '@/lib/mundial'
import { adminPoolSchema, adminPoolUpdateSchema } from '@/lib/validations'
import type { Prisma } from '@prisma/client'

// GET /api/admin/mundial — polla actual (incluye DRAFT) + preguntas + conteo de entries
export async function GET() {
  const authResult = await requireAuth('SUPER_ADMIN')
  if (isAuthError(authResult)) return authResult

  const pool = await getAdminPool()
  if (!pool) return NextResponse.json({ data: null })

  const [questions, counts, matches] = await Promise.all([
    prisma.poolQuestion.findMany({ where: { poolId: pool.id }, orderBy: { order: 'asc' } }),
    prisma.poolEntry.groupBy({
      by: ['status'],
      where: { poolId: pool.id },
      _count: true,
    }),
    prisma.poolMatch.findMany({
      where: { poolId: pool.id },
      orderBy: [{ order: 'asc' }, { kickoffAt: 'asc' }],
      include: { _count: { select: { predictions: true } } },
    }),
  ])

  const entryCounts = { PENDING: 0, CONFIRMED: 0, REJECTED: 0 }
  for (const c of counts) entryCounts[c.status] = c._count

  return NextResponse.json({ data: { pool, questions, entryCounts, matches } })
}

// POST /api/admin/mundial — crear polla
export async function POST(req: Request) {
  const authResult = await requireAuth('SUPER_ADMIN')
  if (isAuthError(authResult)) return authResult

  const body = await req.json().catch(() => null)
  const parsed = adminPoolSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos inválidos', detail: parsed.error.flatten() },
      { status: 400 }
    )
  }
  const d = parsed.data

  const pool = await prisma.worldCupPool.create({
    data: {
      name: d.name,
      season: d.season,
      entryFee: d.entryFee,
      prizeSplit: d.prizeSplit as Prisma.InputJsonValue,
      status: d.status ?? 'DRAFT',
      lockAt: d.lockAt ? new Date(d.lockAt) : null,
      nequiNumber: d.nequiNumber ?? null,
      whatsappUrl: d.whatsappUrl ?? null,
    },
  })

  return NextResponse.json({ data: pool })
}

// PATCH /api/admin/mundial — editar la polla actual
export async function PATCH(req: Request) {
  const authResult = await requireAuth('SUPER_ADMIN')
  if (isAuthError(authResult)) return authResult

  const pool = await getAdminPool()
  if (!pool) return NextResponse.json({ error: 'No hay polla' }, { status: 404 })

  const body = await req.json().catch(() => null)
  const parsed = adminPoolUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos inválidos', detail: parsed.error.flatten() },
      { status: 400 }
    )
  }
  const d = parsed.data

  const data: Prisma.WorldCupPoolUpdateInput = {}
  if (d.name !== undefined) data.name = d.name
  if (d.season !== undefined) data.season = d.season
  if (d.entryFee !== undefined) data.entryFee = d.entryFee
  if (d.prizeSplit !== undefined) data.prizeSplit = d.prizeSplit as Prisma.InputJsonValue
  if (d.status !== undefined) data.status = d.status
  if (d.lockAt !== undefined) data.lockAt = d.lockAt ? new Date(d.lockAt) : null
  if (d.nequiNumber !== undefined) data.nequiNumber = d.nequiNumber
  if (d.whatsappUrl !== undefined) data.whatsappUrl = d.whatsappUrl
  if (d.matchPointsOutcome !== undefined) data.matchPointsOutcome = d.matchPointsOutcome
  if (d.matchPointsExactBonus !== undefined) data.matchPointsExactBonus = d.matchPointsExactBonus

  const updated = await prisma.worldCupPool.update({ where: { id: pool.id }, data })
  return NextResponse.json({ data: updated })
}
