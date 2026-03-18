import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { ExplorarScreen } from './_components/ExplorarScreen'

export default async function ExplorarPage() {
  const session = await auth()
  if (!session) redirect('/login')

  return <ExplorarScreen />
}
