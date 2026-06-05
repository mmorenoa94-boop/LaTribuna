import { NextResponse } from 'next/server'
import { requireAuth, isAuthError } from '@/lib/auth-guard'
import { prisma } from '@/lib/prisma'
import { getAdminPool } from '@/lib/mundial'
import { poolMatchSchema, poolMatchBulkSchema } from '@/lib/validations'

// POST /api/admin/mundial/matches — crear un partido (o varios con ?bulk=1)
export async function POST(req: Request) {
  const authResult = await requireAuth('SUPER_ADMIN')
  if (isAuthError(authResult)) return authResult

  const pool = await getAdminPool()
  if (!pool) return NextResponse.json({ error: 'Crea la polla primero' }, { status: 404 })

  const { searchParams } = new URL(req.url)
  const isBulk = searchParams.get('bulk') === '1'
  const body = await req.json().catch(() => null)

  if (isBulk) {
    const parsed = poolMatchBulkSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'CSV inválido' }, { status: 400 })
    }
    const created = await prisma.poolMatch.createMany({
      data: parsed.data.matches.map((m, i) => ({
        poolId: pool.id,
        homeTeam: m.homeTeam,
        awayTeam: m.awayTeam,
        homeFlag: m.homeFlag ?? null,
        awayFlag: m.awayFlag ?? null,
        phase: m.phase,
        kickoffAt: m.kickoffAt ? new Date(m.kickoffAt) : null,
        order: m.order || i,
      })),
    })
    return NextResponse.json({ data: { created: created.count } })
  }

  const parsed = poolMatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }
  const m = parsed.data
  const match = await prisma.poolMatch.create({
    data: {
      poolId: pool.id,
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam,
      homeFlag: m.homeFlag ?? null,
      awayFlag: m.awayFlag ?? null,
      phase: m.phase,
      kickoffAt: m.kickoffAt ? new Date(m.kickoffAt) : null,
      order: m.order,
    },
  })
  return NextResponse.json({ data: match })
}
