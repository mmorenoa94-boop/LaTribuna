/**
 * Wompi (Colombia) payment gateway integration.
 * Docs: https://docs.wompi.co/
 */

import crypto from 'crypto'

const WOMPI_BASE = process.env.WOMPI_ENVIRONMENT === 'production'
  ? 'https://production.wompi.co/v1'
  : 'https://sandbox.wompi.co/v1'

const PUBLIC_KEY = process.env.WOMPI_PUBLIC_KEY!
const PRIVATE_KEY = process.env.WOMPI_PRIVATE_KEY!
const EVENTS_SECRET = process.env.WOMPI_EVENTS_SECRET!
const INTEGRITY_SECRET = process.env.WOMPI_INTEGRITY_SECRET!

export interface WompiTransaction {
  id: string
  reference: string
  status: 'PENDING' | 'APPROVED' | 'DECLINED' | 'VOIDED' | 'ERROR'
  amount_in_cents: number
  currency: string
  payment_method_type: string
  created_at: string
  finalized_at: string | null
}

/**
 * Get Wompi acceptance token (required before creating transactions).
 */
export async function getAcceptanceToken(): Promise<string> {
  const res = await fetch(`${WOMPI_BASE}/merchants/${PUBLIC_KEY}`)
  if (!res.ok) throw new Error('Failed to get Wompi merchant info')
  const data = await res.json()
  return data.data.presigned_acceptance.acceptance_token
}

/**
 * Create a payment link/session.
 */
export async function createPaymentSession(params: {
  reference: string
  amountInCents: number
  currency: string
  customerEmail: string
  redirectUrl: string
  description: string
}): Promise<{ paymentUrl: string; reference: string }> {
  // Generate integrity signature
  const integrityString = `${params.reference}${params.amountInCents}${params.currency}${INTEGRITY_SECRET}`
  const integritySignature = crypto.createHash('sha256').update(integrityString).digest('hex')

  // For Wompi checkout, we build the redirect URL with params
  const checkoutUrl = new URL(`${WOMPI_BASE.replace('/v1', '')}/checkout`)
  checkoutUrl.searchParams.set('public-key', PUBLIC_KEY)
  checkoutUrl.searchParams.set('currency', params.currency)
  checkoutUrl.searchParams.set('amount-in-cents', String(params.amountInCents))
  checkoutUrl.searchParams.set('reference', params.reference)
  checkoutUrl.searchParams.set('signature:integrity', integritySignature)
  checkoutUrl.searchParams.set('redirect-url', params.redirectUrl)

  return {
    paymentUrl: checkoutUrl.toString(),
    reference: params.reference,
  }
}

/**
 * Get transaction status by reference.
 */
export async function getTransactionByReference(reference: string): Promise<WompiTransaction | null> {
  const res = await fetch(`${WOMPI_BASE}/transactions?reference=${reference}`, {
    headers: { Authorization: `Bearer ${PRIVATE_KEY}` },
  })
  if (!res.ok) return null
  const data = await res.json()
  return data.data?.[0] ?? null
}

/**
 * Get transaction by ID.
 */
export async function getTransactionById(id: string): Promise<WompiTransaction | null> {
  const res = await fetch(`${WOMPI_BASE}/transactions/${id}`, {
    headers: { Authorization: `Bearer ${PRIVATE_KEY}` },
  })
  if (!res.ok) return null
  const data = await res.json()
  return data.data ?? null
}

/**
 * Verify webhook signature from Wompi.
 */
export function verifyWebhookSignature(
  body: Record<string, unknown>,
  receivedChecksum: string
): boolean {
  // Wompi signature: SHA256 of (timestamp + transaction_id + status + amount + secret)
  const { timestamp } = body
  const signature = body.signature as Record<string, unknown> | undefined
  const properties = (signature?.properties as string[]) ?? []

  // Build the string to hash based on the properties Wompi sends
  let signatureString = ''
  for (const prop of properties) {
    const keys = prop.split('.')
    let value: unknown = body.data
    for (const key of keys) {
      value = (value as Record<string, unknown>)?.[key]
    }
    signatureString += value
  }
  signatureString += timestamp
  signatureString += EVENTS_SECRET

  const computedChecksum = crypto.createHash('sha256').update(signatureString).digest('hex')
  return computedChecksum === receivedChecksum
}

// Premium plan definitions
export const PREMIUM_PLANS = {
  monthly: {
    id: 'premium_monthly',
    name: 'Premium Mensual',
    amountInCents: 99900, // $999 COP (example, adjust for real pricing)
    durationDays: 30,
    description: 'Plan Premium La Tribuna - 1 Mes',
  },
  quarterly: {
    id: 'premium_quarterly',
    name: 'Premium Trimestral',
    amountInCents: 249900,
    durationDays: 90,
    description: 'Plan Premium La Tribuna - 3 Meses',
  },
  yearly: {
    id: 'premium_yearly',
    name: 'Premium Anual',
    amountInCents: 799900,
    durationDays: 365,
    description: 'Plan Premium La Tribuna - 1 Año',
  },
} as const

export type PlanKey = keyof typeof PREMIUM_PLANS
