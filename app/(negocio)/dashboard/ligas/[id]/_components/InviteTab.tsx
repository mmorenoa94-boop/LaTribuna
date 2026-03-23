'use client'
import { useState, useEffect } from 'react'
import type { LeagueData } from './LeagueAdminPanel'

export function InviteTab({ league, onCodeRegenerated }: { league: LeagueData; onCodeRegenerated: (code: string) => void }) {
  const [copied, setCopied] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [origin, setOrigin] = useState('')

  useEffect(() => { setOrigin(window.location.origin) }, [])

  const inviteUrl = `${origin}/invite/${league.inviteCode}`

  async function copyCode() {
    await navigator.clipboard.writeText(league.inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function copyLink() {
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function shareLink() {
    if (navigator.share) {
      try {
        await navigator.share({ title: league.name, text: `Únete a ${league.name} en La Tribuna`, url: inviteUrl })
      } catch { /* cancelled */ }
    } else {
      await copyLink()
    }
  }

  async function regenerateCode() {
    setRegenerating(true)
    try {
      const res = await fetch(`/api/leagues/${league.id}/admin/settings`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) onCodeRegenerated(data.inviteCode)
    } finally {
      setRegenerating(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Invite Code Display */}
      <div className="bg-lt-card rounded-card border border-[rgba(255,255,255,0.07)] p-6 text-center">
        <p className="text-lt-muted2 font-condensed text-sm mb-2">Código de invitación</p>
        <div className="flex items-center justify-center gap-3 mb-4">
          <span className="font-bebas text-4xl text-lt-amber tracking-[0.3em]">{league.inviteCode}</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={copyCode}
            className="flex-1 py-2.5 rounded-btn border border-lt-muted text-lt-white font-condensed text-sm font-600 hover:border-lt-amber/30 transition-colors"
          >
            {copied ? '✓ Copiado' : '📋 Copiar código'}
          </button>
          <button
            onClick={regenerateCode}
            disabled={regenerating}
            className="py-2.5 px-4 rounded-btn border border-lt-muted text-lt-muted2 font-condensed text-sm hover:border-lt-red/30 hover:text-lt-red transition-colors"
          >
            {regenerating ? '...' : '🔄'}
          </button>
        </div>
      </div>

      {/* Share Link */}
      <div className="bg-lt-card rounded-card border border-[rgba(255,255,255,0.07)] p-6">
        <p className="text-lt-muted2 font-condensed text-sm mb-2">Link de invitación</p>
        <div className="bg-lt-card2 rounded-btn px-4 py-3 mb-4 overflow-hidden">
          <p className="text-lt-white font-barlow text-sm truncate">{inviteUrl}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={shareLink}
            className="flex-1 py-2.5 rounded-btn bg-lt-amber text-lt-black font-condensed text-sm font-700 active:scale-[0.97] transition-all"
          >
            📤 Compartir link
          </button>
          <button
            onClick={copyLink}
            className="flex-1 py-2.5 rounded-btn border border-lt-amber text-lt-amber font-condensed text-sm font-600 hover:bg-lt-amber/10 transition-colors"
          >
            🔗 Copiar link
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-lt-card rounded-card border border-[rgba(255,255,255,0.07)] p-4 text-center">
          <p className="font-bebas text-2xl text-lt-white">{league.memberCount}</p>
          <p className="font-condensed text-xs text-lt-muted2">Miembros</p>
        </div>
        <div className="bg-lt-card rounded-card border border-[rgba(255,255,255,0.07)] p-4 text-center">
          <p className="font-bebas text-2xl text-lt-white">{league.maxMembers}</p>
          <p className="font-condensed text-xs text-lt-muted2">Capacidad</p>
        </div>
      </div>
    </div>
  )
}
