import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { NotificacionesScreen } from './_components/NotificacionesScreen'

export default async function NotificacionesPage() {
  const session = await auth()
  if (!session) redirect('/login')
  return <NotificacionesScreen />
}
