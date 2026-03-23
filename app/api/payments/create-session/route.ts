import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createPaymentSession, PREMIUM_PLANS, type PlanKey } from '@/lib/wompi'
import { randomBytes } from 'crypto'

// POST — Create Wompi payment session for premium upgrade
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  if (session.user.role !== 'NEGOCIO') return NextResponse.json({ error: 'Solo para negocios' }, { status: 403 })

  const business = await prisma.business.findUnique({ where: { userId: session.user.id } })
  if (!business) return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 })

  const { planId, redirectUrl } = await req.json()

  if (!planId || !PREMIUM_PLANS[planId as PlanKey]) {
    return NextResponse.json(
      { error: `Plan no válido. Opciones: ${Object.keys(PREMIUM_PLANS).join(', ')}` },
      { status: 400 }
    )
  }

  const plan = PREMIUM_PLANS[planId as PlanKey]
  const reference = `LT-${business.id}-${Date.now()}-${randomBytes(4).toString('hex')}`

  try {
    const result = await createPaymentSession({
      reference,
      amountInCents: plan.amountInCents,
      currency: 'COP',
      customerEmail: session.user.email!,
      redirectUrl: redirectUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/config?payment=pending&ref=${reference}`,
      description: plan.description,
    })

    return NextResponse.json({
      paymentUrl: result.paymentUrl,
      reference: result.reference,
      plan: {
        name: plan.name,
        amount: plan.amountInCents / 100,
        currency: 'COP',
      },
    })
  } catch (error) {
    console.error('[payments/create-session]', error)
    return NextResponse.json({ error: 'Error al crear sesión de pago' }, { status: 500 })
  }
}
