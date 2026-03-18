'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import Image from 'next/image'

interface LeaguePreview {
  id: string
  name: string
  description: string | null
  type: string
  status: string
  maxMembers: number
  inviteCode: string
  creator: { name: string | null; image: string | null }
  _count: { members: number }
}

export default function InvitePage() {
  const router = useRouter()
  const params = useParams<{ code: string }>()
  const code = params.code?.toUpperCase()

  const [league, setLeague] = useState<LeaguePreview | null>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!code) return
    fetch(`/api/leagues/preview?code=${code}`)
      .then(async (res) => {
        if (!res.ok) { setNotFound(true); return }
        setLeague(await res.json())
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [code])

  async function handleJoin() {
    setJoining(true)
    setError('')
    try {
      const res = await fetch('/api/leagues/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const data = await res.json()
      if (!res.ok) {
        // Si no está autenticado, redirigir a login con callback
        if (res.status === 401) {
          router.push(`/login?callbackUrl=${encodeURIComponent(`/invite/${code}`)}`)
          return
        }
        // Si ya es miembro, ir directo a la liga
        if (data.error === 'Ya eres miembro' && league) {
          router.push(`/ligas/${league.id}`)
          return
        }
        throw new Error(data.error ?? 'No se pudo unir')
      }
      router.push(`/ligas/${data.league.id}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al unirse')
    } finally {
      setJoining(false)
    }
  }

  // ── Loading state ─────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-lt-black flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-lt-green/30 border-t-lt-green rounded-full animate-spin" />
      </div>
    )
  }

  // ── Not found state ───────────────────────────────────────
  if (notFound || !league) {
    return (
      <div className="min-h-screen bg-lt-black flex flex-col items-center justify-center px-6 gap-5">
        <div className="w-20 h-20 rounded-full bg-lt-card2 border border-[rgba(255,255,255,0.1)] flex items-center justify-center">
          <span className="text-4xl">🔍</span>
        </div>
        <div className="text-center">
          <h1 className="font-bebas text-3xl text-lt-white tracking-wide">Liga no encontrada</h1>
          <p className="text-lt-muted2 font-condensed text-sm mt-2">
            El enlace de invitación no es válido o la liga ya no existe.
          </p>
        </div>
        <button
          onClick={() => router.push('/ligas')}
          className="px-6 py-3 rounded-btn bg-lt-green text-lt-black font-condensed font-700 text-sm"
        >
          Ir a mis ligas
        </button>
      </div>
    )
  }

  const isFull = league._count.members >= league.maxMembers
  const isInactive = league.status !== 'ACTIVE'

  // ── Invite card ───────────────────────────────────────────
  return (
    <div className="min-h-screen bg-lt-black flex flex-col items-center justify-center px-5 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        {/* Brand */}
        <div className="text-center mb-8">
          <h1 className="font-bebas text-4xl text-lt-green tracking-wider">La Tribuna</h1>
          <p className="font-condensed text-xs text-lt-muted2 uppercase tracking-widest mt-1">
            Te han invitado a una liga
          </p>
        </div>

        {/* League card */}
        <div className="bg-lt-card rounded-card border border-[rgba(255,255,255,0.1)] overflow-hidden">
          {/* Green accent bar */}
          <div className="h-1 bg-gradient-to-r from-lt-green via-lt-green/60 to-transparent" />

          <div className="p-6 flex flex-col items-center gap-4">
            {/* League icon */}
            <div className="w-16 h-16 rounded-full bg-lt-green/15 border-2 border-lt-green/30 flex items-center justify-center">
              <span className="text-3xl">⚽</span>
            </div>

            {/* League name */}
            <div className="text-center">
              <h2 className="font-bebas text-2xl text-lt-white tracking-wide leading-tight">
                {league.name}
              </h2>
              {league.description && (
                <p className="text-lt-muted2 font-barlow text-sm mt-1.5 leading-snug">
                  {league.description}
                </p>
              )}
            </div>

            {/* Creator */}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full overflow-hidden bg-lt-card2 flex-shrink-0">
                {league.creator.image ? (
                  <Image src={league.creator.image} alt="" width={24} height={24} className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bebas text-xs text-lt-muted2">
                    {(league.creator.name ?? '?')[0].toUpperCase()}
                  </div>
                )}
              </div>
              <span className="font-condensed text-xs text-lt-muted2">
                Creada por <span className="text-lt-white font-700">{league.creator.name ?? 'Anónimo'}</span>
              </span>
            </div>

            {/* Stats */}
            <div className="w-full grid grid-cols-2 gap-3 mt-1">
              <div className="bg-lt-card2 rounded-btn border border-[rgba(255,255,255,0.06)] p-3 text-center">
                <p className="font-bebas text-xl text-lt-white">{league._count.members}</p>
                <p className="font-condensed text-[10px] text-lt-muted2 uppercase tracking-wider">Miembros</p>
              </div>
              <div className="bg-lt-card2 rounded-btn border border-[rgba(255,255,255,0.06)] p-3 text-center">
                <p className="font-bebas text-xl text-lt-white">{league.maxMembers}</p>
                <p className="font-condensed text-[10px] text-lt-muted2 uppercase tracking-wider">Cupos</p>
              </div>
            </div>

            {/* Capacity bar */}
            <div className="w-full">
              <div className="h-1.5 bg-lt-card2 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    isFull ? 'bg-lt-red' : 'bg-lt-green'
                  )}
                  style={{ width: `${Math.min(100, (league._count.members / league.maxMembers) * 100)}%` }}
                />
              </div>
            </div>

            {/* Join button */}
            {isInactive ? (
              <div className="w-full bg-lt-card2 rounded-btn p-3 text-center">
                <p className="font-condensed text-sm text-lt-muted2">Esta liga ya no está activa</p>
              </div>
            ) : isFull ? (
              <div className="w-full bg-lt-card2 rounded-btn p-3 text-center">
                <p className="font-condensed text-sm text-lt-red">Liga llena — no hay cupos disponibles</p>
              </div>
            ) : (
              <button
                onClick={handleJoin}
                disabled={joining}
                className="w-full py-3.5 rounded-btn bg-lt-green text-lt-black font-condensed font-700 text-base disabled:opacity-50 active:scale-[0.97] transition-all"
              >
                {joining ? 'Uniéndome...' : 'Unirme a la liga'}
              </button>
            )}

            {error && (
              <p className="text-lt-red font-condensed text-sm text-center">{error}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-lt-muted2 font-condensed text-xs mt-6">
          Código: <span className="text-lt-white font-700 tracking-wider">{league.inviteCode}</span>
        </p>
      </motion.div>
    </div>
  )
}
