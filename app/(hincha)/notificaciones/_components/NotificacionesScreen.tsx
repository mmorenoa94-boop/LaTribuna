'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Notification {
  id: string
  type: string
  title: string
  body: string
  read: boolean
  createdAt: string
}

const TYPE_ICONS: Record<string, string> = {
  PROMOTION: '\uD83D\uDCE2',      // megaphone
  POWERUP_ANSWER: '\u26A1',       // lightning
  LEAGUE_INVITE: '\uD83C\uDFC6', // trophy
  QUESTION_OPEN: '\u2753',       // question
  QUESTION_RESOLVED: '\u2705',   // checkmark
  WALLET_CREDIT: '\uD83D\uDCB0', // money bag
  ACHIEVEMENT: '\uD83C\uDF1F',   // star
}

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `hace ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `hace ${hours}h`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'ayer'
  if (days < 7) return `hace ${days}d`
  const weeks = Math.floor(days / 7)
  return `hace ${weeks}sem`
}

export function NotificacionesScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/notifications?limit=30')
        if (res.ok) {
          const data = await res.json()
          setNotifications(data.notifications ?? data ?? [])
        }
      } catch { /* ignore */ }
      setLoading(false)
    }

    // Mark all as read
    fetch('/api/notifications/mark-read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true }),
    }).catch(() => {})

    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-lt-green/30 border-t-lt-green rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-full animate-fade-in">
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <Link
          href="/home"
          className="inline-flex items-center gap-1 text-lt-muted2 text-sm font-condensed mb-3 hover:text-lt-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m15 18-6-6 6-6" />
          </svg>
          Inicio
        </Link>
        <h1 className="text-lt-white font-bebas text-3xl tracking-wide">
          Notificaciones
        </h1>
      </div>

      {/* List */}
      <div className="flex-1 px-4 pb-24">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <svg className="w-16 h-16 text-lt-muted2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
            </svg>
            <p className="text-lt-white font-condensed text-lg font-700">
              No tienes notificaciones
            </p>
            <p className="text-lt-muted2 font-condensed text-sm">
              Aqui apareceran tus alertas y actualizaciones
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`flex items-start gap-3 p-3 rounded-card bg-lt-card border border-[rgba(255,255,255,0.06)] transition-colors ${
                  !n.read ? 'border-l-2 border-l-lt-green' : ''
                }`}
              >
                {/* Icon */}
                <span className="text-xl flex-shrink-0 mt-0.5">
                  {TYPE_ICONS[n.type] ?? '\uD83D\uDD14'}
                </span>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-lt-white font-condensed text-sm font-700 leading-snug">
                    {n.title}
                  </p>
                  <p className="text-lt-muted2 text-xs mt-0.5 leading-relaxed">
                    {n.body}
                  </p>
                  <p className="text-lt-muted2/60 text-[10px] font-condensed mt-1">
                    {timeAgo(n.createdAt)}
                  </p>
                </div>

                {/* Unread dot */}
                {!n.read && (
                  <span className="w-2 h-2 rounded-full bg-lt-green flex-shrink-0 mt-2" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
