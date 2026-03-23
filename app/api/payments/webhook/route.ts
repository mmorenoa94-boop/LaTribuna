import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PREMIUM_PLANS } from '@/lib/wompi'

/**
 * Wompi webhook endpoint.
 * Called by Wompi when a transaction status changes.
 * Verifies signature and updates business premium status.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const { event, data, signature, timestamp } = body

    // Verify this is a transaction update event
    if (event !== 'transaction.updated') {
      return NextResponse.json({ received: true })
    }

    const transaction = data?.transaction
    if (!transaction) {
      return NextResponse.json({ error: 'No transaction data' }, { status: 400 })
    }

    // Verify webhook signature
    const eventsSecret = process.env.WOMPI_EVENTS_SECRET
    if (eventsSecret && signature?.checksum) {
      const crypto = await import('crypto')
      // Build signature string from properties
      const properties = signature.properties ?? []
      let signatureString = ''
      for (const prop of properties) {
        const keys = prop.split('.')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let value: any = data
        for (const key of keys) {
          value = value?.[key]
        }
        signatureString += String(value ?? '')
      }
      signatureString += timestamp
      signatureString += eventsSecret

      const computed = crypto.createHash('sha256').update(signatureString).digest('hex')
      if (computed !== signature.checksum) {
        console.error('[webhook] Invalid signature')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    const { reference, status, amount_in_cents } = transaction

    // Only process APPROVED transactions
    if (status !== 'APPROVED') {
      console.log(`[webhook] Transaction ${reference} status: ${status} — ignoring`)
      return NextResponse.json({ received: true })
    }

    // Extract businessId from reference (format: LT-{businessId}-{timestamp}-{random})
    const parts = reference?.split('-')
    if (!parts || parts.length < 3 || parts[0] !== 'LT') {
      console.error('[webhook] Invalid reference format:', reference)
      return NextResponse.json({ error: 'Invalid reference' }, { status: 400 })
    }

    const businessId = parts[1]

    // Determine plan from amount
    const plan = Object.values(PREMIUM_PLANS).find(p => p.amountInCents === amount_in_cents)
    const durationDays = plan?.durationDays ?? 30 // default to monthly

    const business = await prisma.business.findUnique({ where: { id: businessId } })
    if (!business) {
      console.error('[webhook] Business not found:', businessId)
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    // Calculate new premium end date
    const now = new Date()
    const currentEnd = business.premiumUntil && business.premiumUntil > now
      ? business.premiumUntil
      : now
    const newEnd = new Date(currentEnd.getTime() + durationDays * 24 * 60 * 60 * 1000)

    // Update business
    await prisma.business.update({
      where: { id: businessId },
      data: {
        isPremium: true,
        premiumUntil: newEnd,
      },
    })

    console.log(`[webhook] Business ${businessId} upgraded to premium until ${newEnd.toISOString()}`)

    return NextResponse.json({ received: true, businessId, premiumUntil: newEnd })
  } catch (error) {
    console.error('[webhook] Error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
