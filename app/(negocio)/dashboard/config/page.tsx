import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { BusinessConfigForm } from './_components/BusinessConfigForm'

export default async function ConfigPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const business = await prisma.business.findUnique({
    where: { userId: session.user.id },
    select: {
      name: true,
      type: true,
      address: true,
      city: true,
      phone: true,
      checkinRadius: true,
      maxCapacity: true,
      lat: true,
      lng: true,
    },
  })

  if (!business) redirect('/login')

  return (
    <div className="px-4 md:px-8 pt-4 md:pt-8 max-w-lg animate-fade-in">
      <div className="mb-6">
        <p className="text-lt-muted2 text-sm font-condensed">Configuración</p>
        <h1 className="text-lt-white font-bebas text-3xl leading-tight">Mi Negocio</h1>
      </div>

      <BusinessConfigForm business={business} />
    </div>
  )
}
