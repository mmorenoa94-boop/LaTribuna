import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { EditProfileForm } from './_components/EditProfileForm'

export default async function EditarPerfilPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true, email: true, image: true,
      city: true, phone: true, bio: true,
      favoriteTeam: true, birthDate: true, gender: true,
      profilePct: true,
    },
  })
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-lt-black pb-28">
      {/* Header */}
      <div className="bg-lt-card border-b border-[rgba(255,255,255,0.07)] px-4 pt-safe-top pb-4">
        <p className="text-lt-muted2 font-condensed text-xs uppercase tracking-widest mb-1 pt-4">
          Mi Perfil
        </p>
        <h1 className="font-bebas text-2xl text-lt-white leading-none">Editar información</h1>
      </div>

      <EditProfileForm
        initialData={{
          name:         user.name,
          image:        user.image ?? null,
          city:         user.city ?? '',
          phone:        user.phone ?? '',
          bio:          user.bio ?? '',
          favoriteTeam: user.favoriteTeam ?? '',
          birthDate:    user.birthDate ? user.birthDate.toISOString().split('T')[0] : '',
          gender:       user.gender ?? '',
          profilePct:   user.profilePct,
        }}
      />
    </div>
  )
}
