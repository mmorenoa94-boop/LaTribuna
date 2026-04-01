'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface AdminNotif {
  id: string
  type: string
  title: string
  body: string
  createdAt: string
}

const TYPE_META: Record<string, { emoji: string; label: string }> = {
  ADMIN_MESSAGE: { emoji: '📣', label: 'Mensaje del admin' },
  QUESTION_REMINDER: { emoji: '⏰', label: 'Recordatorio' },
}

export function NotifBanner() {
  const [notifs, setNotifs] = useState<AdminNotif[]>([])

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/notifications?limit=20')
        if (!res.ok) return
        const data = await res.json()
        const all = data.notifications ?? data ?? []
        const admin = all
          .filter((n: { type: string; readAt: string | null }) =>
            (n.type === 'ADMIN_MESSAGE' || n.type === 'QUESTION_REMINDER') && !n.readAt
          )
          .slice(0, 5)
        setNotifs(admin)
      } catch { /* ignore */ }
    }
    load()
  }, [])

  const dismiss = useCallback(async (id: string) => {
    setNotifs((prev) => prev.filter((n) => n.id !== id))
    try {
      await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id] }),
      })
    } catch { /* ignore */ }
  }, [])

  if (notifs.length === 0) return null

  return (
    <div className="space-y-2">
      {notifs.map((n) => {
        const meta = TYPE_META[n.type] ?? { emoji: '🔔', label: 'Notificación' }
        return (
          <div
            key={n.id}
            className="bg-lt-card rounded-card border border-lt-green/30 p-3 animate-fade-in"
          >
            <div className="flex items-start gap-3">
              <span className="text-lg flex-shrink-0">{meta.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="font-condensed text-xs text-lt-green font-700 uppercase tracking-wide">
                  {meta.label} · {n.title}
                </p>
                <p className="text-lt-white font-barlow text-sm mt-1 leading-snug whitespace-pre-line">
                  {n.body}
                </p>
              </div>
              <button
                onClick={() => dismiss(n.id)}
                className="text-lt-muted2 hover:text-lt-white transition-colors flex-shrink-0 p-0.5"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>
        )
      })}
      <Link
        href="/notificaciones"
        className="block text-center text-lt-green text-xs font-condensed py-1 hover:underline"
      >
        Ver todas las notificaciones →
      </Link>
    </div>
  )
}
