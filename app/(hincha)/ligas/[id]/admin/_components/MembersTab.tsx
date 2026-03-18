'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface Member {
  id: string
  userId: string
  totalPoints: number
  joinedAt: string
  user: {
    id: string
    name: string | null
    image: string | null
    level: number
  }
}

interface Props {
  leagueId: string
  creatorId: string   // para no mostrar botón de expulsar al creador
  sessionUserId: string
}

export function MembersTab({ leagueId, creatorId, sessionUserId }: Props) {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [kicking, setKicking] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchMembers()
  }, [])

  async function fetchMembers() {
    setLoading(true)
    try {
      const res = await fetch(`/api/leagues/${leagueId}/members`)
      if (res.ok) setMembers(await res.json())
    } finally {
      setLoading(false)
    }
  }

  async function kickMember(userId: string) {
    setKicking(userId)
    try {
      const res = await fetch(`/api/leagues/${leagueId}/admin/members/${userId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setMembers((prev) => prev.filter((m) => m.userId !== userId))
      }
    } finally {
      setKicking(null)
      setConfirmId(null)
    }
  }

  const filtered = members.filter((m) =>
    (m.user.name ?? '').toLowerCase().includes(search.toLowerCase())
  )

  function formatDate(s: string) {
    return new Date(s).toLocaleDateString('es-CO', {
      day: 'numeric', month: 'short', year: 'numeric',
      timeZone: 'America/Bogota',
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header count + search */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-condensed text-base font-700 text-lt-white uppercase tracking-wide">
          Miembros ({members.length})
        </h2>
        {members.length > 5 && (
          <div className="relative flex-1 max-w-[180px]">
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-lt-muted2"
            >
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar…"
              className="w-full pl-8 pr-3 py-1.5 bg-lt-card2 border border-[rgba(255,255,255,0.07)] rounded-btn font-condensed text-sm text-lt-white placeholder:text-lt-muted2 outline-none focus:border-lt-green/40"
            />
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-lt-green/30 border-t-lt-green rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-lt-card rounded-card border border-[rgba(255,255,255,0.07)] p-8 text-center">
          <p className="text-4xl mb-3">👥</p>
          <p className="font-condensed text-base text-lt-white font-700">
            {search ? 'Sin resultados' : 'Sin miembros todavía'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <AnimatePresence initial={false}>
            {filtered.map((m, idx) => {
              const isCreator  = m.userId === creatorId
              const isSelf     = m.userId === sessionUserId
              const isConfirming = confirmId === m.userId
              const isKicking  = kicking === m.userId

              return (
                <motion.div
                  key={m.userId}
                  layout
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 40, transition: { duration: 0.2 } }}
                  className={cn(
                    'bg-lt-card rounded-card border p-3 flex items-center gap-3',
                    isCreator
                      ? 'border-lt-green/25'
                      : 'border-[rgba(255,255,255,0.07)]'
                  )}
                >
                  {/* Rank */}
                  <span className="font-bebas text-lg text-lt-muted2 w-6 text-center flex-shrink-0">
                    {idx + 1}
                  </span>

                  {/* Avatar */}
                  <div className="relative w-9 h-9 rounded-full overflow-hidden bg-lt-card2 flex-shrink-0">
                    {m.user.image ? (
                      <Image src={m.user.image} alt={m.user.name ?? ''} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="font-bebas text-base text-lt-muted2">
                          {(m.user.name ?? '?')[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="font-condensed text-sm font-700 text-lt-white truncate">
                        {m.user.name ?? 'Sin nombre'}
                      </p>
                      {isCreator && (
                        <span className="bg-lt-green/15 border border-lt-green/30 text-lt-green font-condensed text-[10px] px-1.5 py-0.5 rounded-full leading-none">
                          Admin
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-condensed text-xs text-lt-green font-700">
                        {m.totalPoints} pts
                      </span>
                      <span className="text-lt-muted2 font-condensed text-[10px]">·</span>
                      <span className="font-condensed text-[10px] text-lt-muted2">
                        desde {formatDate(m.joinedAt)}
                      </span>
                    </div>
                  </div>

                  {/* Kick button — solo si no es el creador ni yo mismo */}
                  {!isCreator && !isSelf && (
                    <div className="flex-shrink-0">
                      {!isConfirming ? (
                        <button
                          onClick={() => setConfirmId(m.userId)}
                          className="p-2 rounded-btn bg-lt-red/10 border border-lt-red/25 text-lt-red hover:bg-lt-red/20 transition-colors"
                          title="Expulsar miembro"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <line x1="17" y1="11" x2="23" y2="11" />
                          </svg>
                        </button>
                      ) : (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex items-center gap-1.5"
                        >
                          <span className="font-condensed text-xs text-lt-muted2 hidden sm:block">¿Expulsar?</span>
                          <button
                            onClick={() => kickMember(m.userId)}
                            disabled={isKicking}
                            className="px-2.5 py-1.5 rounded-btn bg-lt-red text-white font-condensed text-xs font-700 disabled:opacity-50 active:scale-95 transition-all"
                          >
                            {isKicking ? '…' : 'Sí'}
                          </button>
                          <button
                            onClick={() => setConfirmId(null)}
                            className="px-2.5 py-1.5 rounded-btn bg-lt-card2 border border-[rgba(255,255,255,0.07)] text-lt-muted2 font-condensed text-xs hover:text-lt-white transition-colors"
                          >
                            No
                          </button>
                        </motion.div>
                      )}
                    </div>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
