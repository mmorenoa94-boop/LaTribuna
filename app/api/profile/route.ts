import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { Gender } from '@prisma/client'

// ── profilePct calculator ─────────────────────────────────────────────────────
// Fields & weights (must sum to 100):
// name (always set) → 10, email (always set) → 5
// image → 15, city → 15, phone → 15
// bio → 10, favoriteTeam → 15, birthDate → 10, gender → 5
function calcProfilePct(u: {
  name: string
  email: string
  image?: string | null
  city?: string | null
  phone?: string | null
  bio?: string | null
  favoriteTeam?: string | null
  birthDate?: Date | null
  gender?: Gender | null
}): number {
  let pct = 15 // name + email always present
  if (u.image)        pct += 15
  if (u.city)         pct += 15
  if (u.phone)        pct += 15
  if (u.bio)          pct += 10
  if (u.favoriteTeam) pct += 15
  if (u.birthDate)    pct += 10
  if (u.gender)       pct += 5
  return Math.min(pct, 100)
}

const VALID_GENDERS: Gender[] = ['MASCULINO', 'FEMENINO', 'OTRO', 'PREFIERO_NO_DECIR']

// ── PATCH /api/profile ────────────────────────────────────────────────────────
export async function PATCH(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()

  // Allowed scalar fields
  const allowed = ['name', 'city', 'phone', 'bio', 'favoriteTeam', 'image'] as const
  const data: Record<string, unknown> = {}

  for (const key of allowed) {
    if (key in body) {
      const val = typeof body[key] === 'string' ? body[key].trim() : body[key]
      data[key] = val === '' ? null : val
    }
  }

  // birthDate: accept ISO string or null
  if ('birthDate' in body) {
    if (!body.birthDate) {
      data.birthDate = null
    } else {
      const d = new Date(body.birthDate)
      if (isNaN(d.getTime())) {
        return NextResponse.json({ error: 'Fecha de nacimiento inválida' }, { status: 400 })
      }
      // Must be in the past and person >= 13 years old
      const minAge = new Date()
      minAge.setFullYear(minAge.getFullYear() - 13)
      if (d > minAge) {
        return NextResponse.json({ error: 'Debes tener al menos 13 años' }, { status: 400 })
      }
      data.birthDate = d
    }
  }

  // gender: enum or null
  if ('gender' in body) {
    if (!body.gender) {
      data.gender = null
    } else if (!VALID_GENDERS.includes(body.gender)) {
      return NextResponse.json({ error: 'Género inválido' }, { status: 400 })
    } else {
      data.gender = body.gender as Gender
    }
  }

  // Must have at least one field to update
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Sin cambios' }, { status: 400 })
  }

  // Fetch current user to compute new profilePct
  const current = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true, email: true, image: true, city: true, phone: true,
      bio: true, favoriteTeam: true, birthDate: true, gender: true,
    },
  })
  if (!current) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  // Merge current + incoming to calculate new pct
  const merged = { ...current, ...data } as typeof current
  data.profilePct = calcProfilePct(merged)

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data,
    select: {
      id: true, name: true, image: true, city: true, phone: true,
      bio: true, favoriteTeam: true, birthDate: true, gender: true,
      profilePct: true, level: true, xp: true,
    },
  })

  return NextResponse.json(updated)
}

// ── GET /api/profile ──────────────────────────────────────────────────────────
export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true, name: true, email: true, image: true,
      city: true, phone: true, bio: true, favoriteTeam: true,
      birthDate: true, gender: true, profilePct: true,
      level: true, xp: true, streak: true,
    },
  })

  if (!user) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json(user)
}
