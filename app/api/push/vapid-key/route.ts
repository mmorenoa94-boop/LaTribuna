import { NextResponse } from 'next/server'

// GET — Return public VAPID key for client-side push subscription
export async function GET() {
  const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? process.env.VAPID_PUBLIC_KEY

  if (!key) {
    return NextResponse.json({ error: 'VAPID key not configured' }, { status: 500 })
  }

  return NextResponse.json({ publicKey: key })
}
