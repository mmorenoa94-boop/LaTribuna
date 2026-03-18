import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getTransactionByReference } from '@/lib/wompi'

// GET — Check payment status by reference
export async function GET(
  _req: Request,
  { params }: { params: { ref: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  // Verify the reference belongs to the user's business
  const refParts = params.ref.split('-')
  if (refParts[0] !== 'LT') {
    return NextResponse.json({ error: 'Referencia no válida' }, { status: 400 })
  }

  try {
    const transaction = await getTransactionByReference(params.ref)

    if (!transaction) {
      return NextResponse.json({ error: 'Transacción no encontrada' }, { status: 404 })
    }

    return NextResponse.json({
      reference: transaction.reference,
      status: transaction.status,
      amount: transaction.amount_in_cents / 100,
      currency: transaction.currency,
      paymentMethod: transaction.payment_method_type,
      createdAt: transaction.created_at,
      finalizedAt: transaction.finalized_at,
    })
  } catch (error) {
    console.error('[payments/status]', error)
    return NextResponse.json({ error: 'Error consultando estado' }, { status: 500 })
  }
}
