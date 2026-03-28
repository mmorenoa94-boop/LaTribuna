import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getBalance } from '@/lib/wallet'
import { formatCOP } from '@/lib/utils'
import { XPBar } from '@/components/hincha/XPBar'
import { SignOutButton } from './_components/SignOutButton'
import { AccuracyStatCard } from './_components/AccuracyStatCard'

// ── Helpers ───────────────────────────────────────────────────────────────────

function ProfileCompletenessBar({ pct }: { pct: number }) {
  return (
    <div className="bg-lt-card rounded-card border border-[rgba(255,255,255,0.07)] p-4">
      <div className="flex justify-between items-center mb-2">
        <p className="text-lt-white font-condensed text-sm font-700">Completitud del perfil</p>
        <span className="text-lt-green font-condensed font-700 text-sm">{pct}%</span>
      </div>
      <div className="h-1.5 bg-lt-card2 rounded-full overflow-hidden">
        <div
          className="h-full bg-lt-green rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      {pct < 100 && (
        <p className="text-lt-muted2 font-condensed text-xs mt-2">
          Completa tu perfil para ganar más puntos
        </p>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string
  value: string | number
  icon: string
}) {
  return (
    <div className="bg-lt-card rounded-btn border border-[rgba(255,255,255,0.07)] px-3 py-3 flex flex-col items-center gap-1">
      <span className="text-xl">{icon}</span>
      <p className="font-bebas text-xl text-lt-white leading-none tabular-nums">{value}</p>
      <p className="text-lt-muted2 font-condensed text-[10px] uppercase tracking-wider text-center">
        {label}
      </p>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function PerfilPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const [user, balance, leagueCount, correctAnswers, totalAnswers, correctPredictions, totalPredictions] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        level: true,
        xp: true,
        streak: true,
        profilePct: true,
        city: true,
        favoriteTeam: true,
        bio: true,
        birthDate: true,
        gender: true,
        createdAt: true,
        role: true,
      },
    }),
    getBalance(session.user.id),
    prisma.leagueMember.count({ where: { userId: session.user.id } }),
    prisma.answer.count({ where: { userId: session.user.id, isCorrect: true } }),
    prisma.answer.count({ where: { userId: session.user.id } }),
    prisma.prediction.count({ where: { userId: session.user.id, isCorrect: true } }),
    prisma.prediction.count({ where: { userId: session.user.id } }),
  ])

  if (!user) redirect('/login')

  const joinedYear = new Date(user.createdAt).getFullYear()

  const GENDER_LABEL: Record<string, string> = {
    MASCULINO:         '♂️ Masculino',
    FEMENINO:          '♀️ Femenino',
    OTRO:              '⚧️ Otro',
    PREFIERO_NO_DECIR: '🔒 Prefiero no decir',
  }

  function formatBirthDate(d: Date): string {
    return new Date(d).toLocaleDateString('es-CO', {
      day: 'numeric', month: 'long', year: 'numeric',
      timeZone: 'UTC',   // evita desfase UTC-5 → día anterior
    })
  }

  return (
    <div className="min-h-screen bg-lt-black pb-28">
      {/* Hero header */}
      <div className="bg-lt-card border-b border-[rgba(255,255,255,0.07)] px-4 pt-safe-top pb-6">
        <div className="pt-4 flex items-start justify-between mb-4">
          <p className="text-lt-muted2 font-condensed text-xs uppercase tracking-widest">Mi Perfil</p>
          <Link
            href="/perfil/editar"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-btn border border-[rgba(255,255,255,0.12)] bg-lt-card2 text-lt-muted font-condensed text-xs font-600 hover:border-lt-green/30 hover:text-lt-green transition-colors"
          >
            <PencilIcon className="w-3 h-3" />
            Editar
          </Link>
        </div>

        {/* Avatar + name */}
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-lt-green/50 bg-lt-card2">
              {user.image ? (
                <Image
                  src={user.image}
                  alt={user.name}
                  width={80}
                  height={80}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bebas text-4xl text-lt-green">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            {/* Level badge */}
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-lt-black border-2 border-lt-green flex items-center justify-center">
              <span className="font-bebas text-sm text-lt-green leading-none">{user.level}</span>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="font-bebas text-2xl text-lt-white leading-none truncate">{user.name}</h1>
            <p className="text-lt-muted2 font-condensed text-xs mt-0.5 truncate">{user.email}</p>
            <div className="flex items-center gap-2 mt-1.5">
              {user.city && (
                <span className="text-lt-muted2 font-condensed text-xs flex items-center gap-0.5">
                  📍 {user.city}
                </span>
              )}
              <span className="text-lt-muted2 font-condensed text-xs">
                Desde {joinedYear}
              </span>
            </div>
          </div>
        </div>

        {/* XP bar */}
        <div className="mt-4">
          <XPBar xp={user.xp} level={user.level} />
        </div>
      </div>

      <div className="px-4 space-y-5 mt-5">

        {/* Balance */}
        <Link href="/wallet">
          <div className="bg-gradient-to-r from-lt-green/10 to-transparent border border-lt-green/20 rounded-card px-4 py-3.5 flex items-center justify-between hover:border-lt-green/35 transition-colors">
            <div className="flex items-center gap-3">
              <span className="text-2xl">💰</span>
              <div>
                <p className="text-lt-muted2 font-condensed text-xs uppercase tracking-wider">
                  Saldo disponible
                </p>
                <p className="font-bebas text-xl text-lt-green leading-none tabular-nums">
                  {formatCOP(balance)}
                </p>
              </div>
            </div>
            <ChevronRightIcon className="w-4 h-4 text-lt-muted2" />
          </div>
        </Link>

        {/* Stats grid */}
        <div>
          <p className="text-lt-muted2 font-condensed text-xs uppercase tracking-widest mb-3">
            Estadísticas
          </p>
          <div className="grid grid-cols-3 gap-2.5">
            <StatCard label="Ligas" value={leagueCount} icon="🏟️" />
            <AccuracyStatCard
              correct={correctAnswers + correctPredictions}
              total={totalAnswers + totalPredictions}
            />
            <StatCard label="Racha" value={`${user.streak}🔥`} icon="📅" />
          </div>
        </div>

        {/* Profile completeness */}
        <ProfileCompletenessBar pct={user.profilePct} />

        {/* About */}
        {(user.bio || user.favoriteTeam || user.birthDate || user.gender) && (
          <div className="bg-lt-card rounded-card border border-[rgba(255,255,255,0.07)] p-4 space-y-3">
            {user.favoriteTeam && (
              <div>
                <p className="text-lt-muted2 font-condensed text-[10px] uppercase tracking-wider mb-1">
                  Equipo favorito
                </p>
                <p className="text-lt-white font-condensed text-sm font-700">
                  ⚽ {user.favoriteTeam}
                </p>
              </div>
            )}
            {user.birthDate && (
              <div>
                <p className="text-lt-muted2 font-condensed text-[10px] uppercase tracking-wider mb-1">
                  Fecha de nacimiento
                </p>
                <p className="text-lt-white font-condensed text-sm font-700">
                  🎂 {formatBirthDate(user.birthDate)}
                </p>
              </div>
            )}
            {user.gender && (
              <div>
                <p className="text-lt-muted2 font-condensed text-[10px] uppercase tracking-wider mb-1">
                  Género
                </p>
                <p className="text-lt-white font-condensed text-sm font-700">
                  {GENDER_LABEL[user.gender] ?? user.gender}
                </p>
              </div>
            )}
            {user.bio && (
              <div>
                <p className="text-lt-muted2 font-condensed text-[10px] uppercase tracking-wider mb-1">
                  Bio
                </p>
                <p className="text-lt-muted font-barlow text-sm leading-snug">{user.bio}</p>
              </div>
            )}
          </div>
        )}

        {/* Account section */}
        <div className="bg-lt-card rounded-card border border-[rgba(255,255,255,0.07)] overflow-hidden">
          <p className="text-lt-muted2 font-condensed text-[10px] uppercase tracking-wider px-4 pt-3.5 pb-2">
            Cuenta
          </p>
          <MenuRow
            icon="🔔"
            label="Notificaciones"
            href="/perfil/notificaciones"
          />
          <MenuRow
            icon="🔒"
            label="Privacidad y seguridad"
            href="/perfil/seguridad"
          />
          <MenuRow
            icon="❓"
            label="Ayuda"
            href="/perfil/ayuda"
          />
        </div>

        {/* Danger zone */}
        <SignOutButton />

        <p className="text-center text-lt-muted2 font-condensed text-xs pb-2">
          La Tribuna v1.0 · El juego de los que sí saben
        </p>
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MenuRow({
  icon,
  label,
  href,
}: {
  icon: string
  label: string
  href: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-3.5 border-t border-[rgba(255,255,255,0.06)] hover:bg-lt-card2 transition-colors"
    >
      <span className="text-base w-5 text-center">{icon}</span>
      <span className="flex-1 font-condensed text-sm text-lt-white">{label}</span>
      <ChevronRightIcon className="w-4 h-4 text-lt-muted2" />
    </Link>
  )
}

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 7.125L18 8.625" />
    </svg>
  )
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  )
}
