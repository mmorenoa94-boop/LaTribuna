'use client'
import { useState } from 'react'
import Image from 'next/image'
import { cn, formatPoints } from '@/lib/utils'
import type { SLeague } from './types'

interface Props {
  league: SLeague
  userId: string
  isCreator: boolean
}

export function TabMiembros({ league, userId, isCreator }: Props) {
  const [copied, setCopied] = useState<'code' | 'link' | null>(null)
  const [confirmLeave, setConfirmLeave] = useState(false)
  const [leaving, setLeaving] = useState(false)

  const inviteLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/invite/${league.inviteCode}`

  async function copyCode() {
    await navigator.clipboard.writeText(league.inviteCode)
    setCopied('code')
    setTimeout(() => setCopied(null), 2000)
  }

  async function copyLink() {
    await navigator.clipboard.writeText(inviteLink)
    setCopied('link')
    setTimeout(() => setCopied(null), 2000)
  }

  async function shareLink() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Únete a ${league.name} en La Tribuna`,
          text: `¡Te invito a jugar trivia deportiva en mi liga "${league.name}"!`,
          url: inviteLink,
        })
      } catch {
        // User cancelled share — ignore
      }
    } else {
      copyLink()
    }
  }

  return (
    <div className="space-y-5">

      {/* Invitación — solo visible para admin o si allowMemberInvites está activo */}
      {(isCreator || league.allowMemberInvites) && (
        <div className="bg-lt-card rounded-card border border-[rgba(255,255,255,0.07)] p-4">
          <p className="text-lt-muted2 font-condensed text-xs uppercase tracking-widest mb-3">
            Invitar jugadores
          </p>

          {/* Código */}
          <div className="flex items-center justify-between gap-3">
            <span className="font-bebas text-3xl tracking-[0.25em] text-lt-green">
              {league.inviteCode}
            </span>
            <button
              onClick={copyCode}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-btn border font-condensed text-sm font-600 transition-all',
                copied === 'code'
                  ? 'bg-lt-green/20 border-lt-green text-lt-green'
                  : 'bg-lt-card2 border-lt-muted text-lt-white hover:border-lt-green/40'
              )}
            >
              {copied === 'code' ? <CheckIcon className="w-3.5 h-3.5" /> : <CopyIcon className="w-3.5 h-3.5" />}
              {copied === 'code' ? 'Copiado' : 'Código'}
            </button>
          </div>

          {/* Compartir link */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={shareLink}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-btn bg-lt-green text-lt-black font-condensed text-sm font-700 active:scale-[0.97] transition-all"
            >
              <ShareIcon className="w-4 h-4" />
              Compartir link
            </button>
            <button
              onClick={copyLink}
              className={cn(
                'flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-btn border font-condensed text-sm font-600 transition-all',
                copied === 'link'
                  ? 'bg-lt-green/20 border-lt-green text-lt-green'
                  : 'bg-lt-card2 border-lt-muted text-lt-white hover:border-lt-green/40'
              )}
            >
              {copied === 'link' ? <CheckIcon className="w-3.5 h-3.5" /> : <LinkIcon className="w-3.5 h-3.5" />}
              {copied === 'link' ? 'Copiado' : 'Link'}
            </button>
          </div>

          <p className="text-lt-muted2 font-barlow text-xs mt-2.5 leading-snug">
            Comparte el código o envía el link para que otros hinchas se unan
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatPill label="Miembros" value={`${league._count.members}/${league.maxMembers}`} />
        <StatPill
          label="Remotos"
          value={league.allowRemote ? 'Permitidos' : 'No permitidos'}
          valueColor={league.allowRemote ? 'text-lt-green' : 'text-lt-muted2'}
        />
      </div>

      {/* Lista */}
      <div>
        <p className="text-lt-muted2 font-condensed text-xs uppercase tracking-widest mb-3">
          {league._count.members} jugadores
        </p>
        <div className="space-y-2">
          {league.members.map((m, i) => {
            const isUser = m.userId === userId
            const isCreatorMember = m.userId === league.creatorId
            const pos = i + 1

            return (
              <div
                key={m.id}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-btn border',
                  isUser
                    ? 'bg-lt-green/10 border-lt-green/30'
                    : 'bg-lt-card border-[rgba(255,255,255,0.06)]'
                )}
              >
                {/* Posición */}
                <span className="w-6 text-center text-lt-muted2 font-condensed text-xs flex-shrink-0">
                  #{pos}
                </span>

                {/* Avatar */}
                <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 bg-lt-card2 border border-lt-muted">
                  {m.user.image ? (
                    <Image
                      src={m.user.image}
                      alt={m.user.name}
                      width={36}
                      height={36}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bebas text-base text-lt-muted2">
                      {m.user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className={cn(
                      'font-condensed text-sm font-700 leading-none truncate',
                      isUser ? 'text-lt-green' : 'text-lt-white'
                    )}>
                      {isUser ? 'Tú' : m.user.name}
                    </p>
                    {isCreatorMember && (
                      <span className="text-[9px] font-condensed px-1.5 py-0.5 rounded-full bg-lt-amber/15 border border-lt-amber/30 text-lt-amber uppercase tracking-wider flex-shrink-0">
                        Admin
                      </span>
                    )}
                    {m.consumptionVerified && (
                      <span className="text-[9px] font-condensed px-1.5 py-0.5 rounded-full bg-lt-blue/15 border border-lt-blue/30 text-lt-blue uppercase tracking-wider flex-shrink-0">
                        ✓ Local
                      </span>
                    )}
                  </div>
                  <p className="text-lt-muted2 font-condensed text-xs mt-0.5">
                    Niv. {m.user.level}
                  </p>
                </div>

                {/* Puntos */}
                <div className="text-right flex-shrink-0">
                  <p className={cn(
                    'font-condensed font-700 text-sm tabular-nums',
                    isUser ? 'text-lt-green' : 'text-lt-white'
                  )}>
                    {formatPoints(m.totalPoints)}
                  </p>
                  <p className="text-lt-muted2 font-condensed text-xs">pts</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Capacidad */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-lt-muted2 font-condensed text-xs">Capacidad</span>
          <span className="text-lt-muted2 font-condensed text-xs">
            {league._count.members} / {league.maxMembers}
          </span>
        </div>
        <div className="h-1.5 bg-lt-card2 rounded-full overflow-hidden">
          <div
            className="h-full bg-lt-green rounded-full transition-all"
            style={{ width: `${Math.min(100, (league._count.members / league.maxMembers) * 100)}%` }}
          />
        </div>
      </div>

      {/* Salir de liga — solo para miembros que no son el creador */}
      {!isCreator && (
        <div className="pt-2 border-t border-[rgba(255,255,255,0.05)]">
          {!confirmLeave ? (
            <button
              onClick={() => setConfirmLeave(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-btn border border-lt-red/30 text-lt-red font-condensed text-sm font-600 hover:bg-lt-red/10 transition-all"
            >
              <ExitIcon className="w-4 h-4" />
              Salir de la liga
            </button>
          ) : (
            <div className="bg-lt-red/10 border border-lt-red/30 rounded-card p-4 space-y-3 animate-fade-in">
              <p className="font-condensed text-sm text-lt-white font-700 text-center">
                ¿Seguro que quieres salir?
              </p>
              <p className="font-barlow text-xs text-lt-muted2 text-center leading-snug">
                Perderás tus puntos y respuestas en esta liga. Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    setLeaving(true)
                    try {
                      const res = await fetch(`/api/leagues/${league.id}/leave`, { method: 'POST' })
                      if (res.ok) {
                        window.location.href = '/ligas'
                      }
                    } finally {
                      setLeaving(false)
                    }
                  }}
                  disabled={leaving}
                  className="flex-1 py-2.5 rounded-btn bg-lt-red text-white font-condensed text-sm font-700 disabled:opacity-50 transition-opacity"
                >
                  {leaving ? 'Saliendo...' : 'Sí, salir'}
                </button>
                <button
                  onClick={() => setConfirmLeave(false)}
                  className="flex-1 py-2.5 rounded-btn border border-lt-muted text-lt-muted2 font-condensed text-sm"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function StatPill({
  label, value, valueColor = 'text-lt-white',
}: {
  label: string
  value: string
  valueColor?: string
}) {
  return (
    <div className="bg-lt-card rounded-btn border border-[rgba(255,255,255,0.07)] px-3 py-3">
      <p className="text-lt-muted2 font-condensed text-xs uppercase tracking-wider mb-1">{label}</p>
      <p className={cn('font-condensed text-base font-700', valueColor)}>{value}</p>
    </div>
  )
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m20 6-11 11-5-5" />
    </svg>
  )
}
function ShareIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  )
}
function LinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  )
}
function ExitIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  )
}
