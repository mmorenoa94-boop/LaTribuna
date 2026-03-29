import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

const VALID_BUSINESS_TYPES = ['BAR', 'RESTAURANT', 'CLUB_CASINO', 'OTHER'] as const

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, password, city, favoriteTeam, role } = body

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Este email ya está registrado' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const isNegocio = role === 'NEGOCIO'

    // Validar campos de negocio
    if (isNegocio) {
      const { businessName, businessType } = body
      if (!businessName) {
        return NextResponse.json({ error: 'El nombre del negocio es requerido' }, { status: 400 })
      }
      if (!VALID_BUSINESS_TYPES.includes(businessType)) {
        return NextResponse.json({ error: 'Tipo de negocio inválido' }, { status: 400 })
      }
    }

    if (isNegocio) {
      // Crear User + Business + Wallet en transacción
      const { businessName, businessType, address, phone, lat, lng } = body
      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            name,
            email,
            passwordHash,
            city,
            role: 'NEGOCIO',
            wallet: { create: {} },
          },
          select: { id: true, name: true, email: true, role: true },
        })

        await tx.business.create({
          data: {
            userId: user.id,
            name: businessName,
            type: businessType,
            address: address || null,
            city: city || null,
            phone: phone || null,
            lat: lat ? parseFloat(lat) : null,
            lng: lng ? parseFloat(lng) : null,
          },
        })

        return user
      })

      return NextResponse.json(result, { status: 201 })
    }

    // Hincha: flujo original
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        city,
        favoriteTeam,
        role: 'HINCHA',
        wallet: { create: {} },
      },
      select: { id: true, name: true, email: true, role: true },
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error('[register] POST error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
