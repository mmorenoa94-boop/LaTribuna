import { NextResponse } from 'next/server'
import { requireAuth, isAuthError } from '@/lib/auth-guard'
import { prisma } from '@/lib/prisma'
import { getAdminPool } from '@/lib/mundial'

// GET /api/admin/mundial/entries — lista de inscripciones (filtro opcional ?status=)
export async function GET(req: Request) {
  const authResult = await requireAuth('SUPER_ADMIN')
  if (isAuthError(authResult)) return authResult

  const pool = await getAdminPool()
  if (!pool) return NextResponse.json({ data: [] })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') as
    | 'PENDING' | 'CONFIRMED' | 'REJECTED' | null

  const entries = await prisma.poolEntry.findMany({
    where: { poolId: pool.id, ...(status ? { status } : {}) },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true, image: true } },
      _count: { select: { answers: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json({ data: entries })
}
