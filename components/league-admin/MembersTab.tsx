'use client'
import { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import type { MemberAdminData } from './types'

export function MembersTab({
  leagueId,
  members,
  onMembersChange,
}: {
  leagueId: string
  members: MemberAdminData[]
  onMembersChange: (members: MemberAdminData[]) => void
}) {
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState<string | null>(null)
  const [confirmKick, setConfirmKick] = useState<string | null>(null)

  const pending = members.filter((m) => m.status === 'PENDING')
  const approved = members.filter((m) => m.status === 'APPROVED')

  const filtered = approved.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase())
  )

  async function approveMember(userId: string) {
    setLoading(userId)
    try {
      const res = await fetch(`/api/leagues/${leagueId}/admin/members/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'APPROVED' }),
      })
      if (res.ok) {
        onMembersChange(members.map((m) => (m.id === userId ? { ...m, status: 'APPROVED' } : m)))
      }
    } finally {
      setLoading(null)
    }
  }

  async function rejectMember(userId: string) {
    setLoading(userId)
    try {
      const res = await fetch(`/api/leagues/${leagueId}/admin/members/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REJECTED' }),
      })
      if (res.ok) {
        onMembersChange(members.filter((m) => m.id !== userId))
      }
    } finally {
      setLoading(null)
    }
  }

  async function kickMember(userId: string) {
    setLoading(userId)
    try {
      const res = await fetch(`/api/leagues/${leagueId}/admin/members/${userId}`, { method: 'DELETE' })
      if (res.ok) {
        onMembersChange(members.filter((m) => m.id !== userId))
        setConfirmKick(null)
      }
    } finally {
      setLoading(null)
    }
  }

  async function toggleVerified(userId: string, current: boolean) {
    setLoading(userId)
    try {
      const res = await fetch(`/api/leagues/${leagueId}/admin/members/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consumptionVerified: !current }),
      })
      if (res.ok) {
        onMembersChange(members.map((m) => (m.id === userId ? { ...m, consumptionVerified: !current } : m)))
      }
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-5">
      {/* Pending approvals */}
      {pending.length > 0 && (
        <div>
          <h3 className="text-lt-amber font-condensed text-sm font-700 uppercase tracking-wide mb-3">
            Solicitudes pendientes ({pending.length})
          </h3>
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {pending.map((m) => (
                <motion.div
                  key={m.id}
                  layout
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 40, transition: { duration: 0.2 } }}
                  className="bg-lt-card rounded-btn border border-lt-amber/20 px-4 py-3 flex items-center gap-3"
                >
                  <div className="w-9 h-9 rounded-full bg-lt-amber/15 border border-lt-amber/30 flex items-center justify-center flex-shrink-0">
                    {m.image ? (
                      <Image src={m.image} alt={m.name} width={36} height={36} className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                      <span className="font-bebas text-sm text-lt-amber">{m.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-condensed text-sm text-lt-white truncate">{m.name}</p>
                    <p className="font-barlow text-xs text-lt-muted2 truncate">{m.email}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => approveMember(m.id)}
                      disabled={loading === m.id}
                      className="px-3 py-1.5 rounded-btn bg-lt-green/20 text-lt-green font-condensed text-xs font-700 hover:bg-lt-green/30 transition-colors"
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => rejectMember(m.id)}
                      disabled={loading === m.id}
                      className="px-3 py-1.5 rounded-btn bg-lt-red/20 text-lt-red font-condensed text-xs font-700 hover:bg-lt-red/30 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Search */}
      {approved.length > 3 && (
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar miembro..."
          className="w-full bg-lt-card2 border border-lt-muted rounded-btn px-4 py-3 text-lt-white font-barlow text-sm focus:outline-none focus:border-lt-amber transition-colors placeholder:text-lt-muted2"
        />
      )}

      {/* Approved members list */}
      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {filtered.map((m, i) => (
            <motion.div
              key={m.id}
              layout
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 40, transition: { duration: 0.2 } }}
              className="bg-lt-card rounded-btn border border-[rgba(255,255,255,0.07)] px-4 py-3 flex items-center gap-3"
            >
              <span className="font-condensed text-xs text-lt-muted2 w-5 text-center flex-shrink-0">
                {i + 1}
              </span>
              <div className="w-9 h-9 rounded-full bg-lt-card2 flex items-center justify-center flex-shrink-0">
                {m.image ? (
                  <Image src={m.image} alt={m.name} width={36} height={36} className="w-9 h-9 rounded-full object-cover" />
                ) : (
                  <span className="font-bebas text-sm text-lt-muted2">{m.name.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-condensed text-sm text-lt-white truncate">{m.name}</p>
                  {m.isCreator && (
                    <span className="text-[10px] font-condensed font-700 bg-lt-amber/20 text-lt-amber px-1.5 py-0.5 rounded-full">
                      Admin
                    </span>
                  )}
                  {m.consumptionVerified && (
                    <span className="text-[10px] font-condensed font-700 bg-lt-blue/15 text-lt-blue px-1.5 py-0.5 rounded-full border border-lt-blue/30">
                      ✓ Verificado
                    </span>
                  )}
                </div>
                <p className="font-condensed text-xs text-lt-amber">{m.points} pts</p>
              </div>

              {/* Actions (not for creator) */}
              {!m.isCreator && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Verify toggle */}
                  <button
                    onClick={() => toggleVerified(m.id, m.consumptionVerified)}
                    disabled={loading === m.id}
                    className={`p-1.5 rounded-btn transition-colors ${
                      m.consumptionVerified
                        ? 'text-lt-blue hover:text-lt-blue/70'
                        : 'text-lt-muted2 hover:text-lt-blue'
                    }`}
                    title={m.consumptionVerified ? 'Quitar verificación de consumo' : 'Verificar consumo'}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  </button>

                  {/* Kick */}
                  {confirmKick === m.id ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex gap-1.5"
                    >
                      <button
                        onClick={() => kickMember(m.id)}
                        disabled={loading === m.id}
                        className="px-2.5 py-1 rounded-btn bg-lt-red text-white font-condensed text-xs font-700"
                      >
                        Sí
                      </button>
                      <button
                        onClick={() => setConfirmKick(null)}
                        className="px-2.5 py-1 rounded-btn border border-lt-muted text-lt-muted2 font-condensed text-xs"
                      >
                        No
                      </button>
                    </motion.div>
                  ) : (
                    <button
                      onClick={() => setConfirmKick(m.id)}
                      className="text-lt-muted2 hover:text-lt-red transition-colors p-1"
                      title="Expulsar"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <line x1="17" y1="8" x2="23" y2="14" />
                        <line x1="23" y1="8" x2="17" y2="14" />
                      </svg>
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {filtered.length === 0 && approved.length > 0 && (
          <p className="text-lt-muted2 font-condensed text-sm text-center py-4">Sin resultados</p>
        )}
        {approved.length === 0 && pending.length === 0 && (
          <div className="bg-lt-card rounded-card border border-[rgba(255,255,255,0.07)] p-8 text-center">
            <span className="text-3xl block mb-2">👥</span>
            <p className="font-condensed text-sm text-lt-muted2">Sin miembros aún. Comparte el código de invitación.</p>
          </div>
        )}
      </div>
    </div>
  )
}
