import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/leagues/preview?code=ABC123
 * Devuelve info pública de la liga sin requerir autenticación.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')?.toUpperCase()
  if (!code) return NextResponse.json({ error: 'Código requerido' }, { status: 400 })

  const league = await prisma.league.findUnique({
    where: { inviteCode: code },
    select: {
      id: true,
      name: true,
      description: true,
      type: true,
      status: true,
      maxMembers: true,
      inviteCode: true,
      creatorId: true,
      _count: { select: { members: true } },
    },
  })

  if (!league) return NextResponse.json({ error: 'Liga no encontrada' }, { status: 404 })

  const creator = await prisma.user.findUnique({
    where: { id: league.creatorId },
    select: { name: true, image: true },
  })

  return NextResponse.json({ ...league, creator: creator ?? { name: null, image: null } })
}
