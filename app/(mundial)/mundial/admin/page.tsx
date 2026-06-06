import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import AdminClient from './_components/AdminClient'

export const dynamic = 'force-dynamic'

export default async function MundialAdminPage() {
  const session = await auth()
  if (!session) redirect('/login')
  if (session.user.role !== 'SUPER_ADMIN') redirect('/mundial')

  return <AdminClient />
}
