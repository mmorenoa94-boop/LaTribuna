import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      business: true,
      _count: {
        select: {
          leagueMemberships: true,
          answers: true,
          predictions: true,
        },
      },
    },
  })

  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  // omit passwordHash
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...safeUser } = user
  return NextResponse.json(safeUser)
}

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const allowed = ['name', 'bio', 'city', 'phone', 'favoriteTeam', 'image']
  const data: Record<string, unknown> = {}

  for (const key of allowed) {
    if (key in body) data[key] = body[key]
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data,
    select: {
      id: true, name: true, email: true, image: true, role: true,
      level: true, xp: true, city: true, phone: true, bio: true,
      favoriteTeam: true, streak: true, profilePct: true,
    },
  })

  return NextResponse.json(updated)
}
