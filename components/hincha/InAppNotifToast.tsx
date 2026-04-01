'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

interface NewNotif {
  id: string
  type: string
  title: string
  body: string
  data: Record<string, unknown> | null
}

const TYPE_META: Record<string, { emoji: string; color: string }> = {
  ADMIN_MESSAGE: { emoji: '📣', color: 'border-lt-green' },
  QUESTION_REMINDER: { emoji: '⏰', color: 'border-lt-amber' },
  QUESTION_OPEN: { emoji: '❓', color: 'border-lt-green' },
  PROMOTION: { emoji: '📢', color: 'border-lt-amber' },
  QUESTION_RESOLVED: { emoji: '✅', color: 'border-lt-green' },
  LEAGUE_INVITE: { emoji: '🏆', color: 'border-lt-green' },
  WALLET_CREDIT: { emoji: '💰', color: 'border-lt-green' },
}

/**
 * Polls for new notifications and shows in-app toast popups.
 * Works without push notifications — purely HTTP polling.
 */
export function InAppNotifToast() {
  const [visible, setVisible] = useState<NewNotif | null>(null)
  const [exiting, setExiting] = useState(false)
  const seenIds = useRef<Set<string>>(new Set())
  const lastCheck = useRef<string | null>(null)
  const pathname = usePathname()

  // Don't show toasts on the notifications page itself
  const isNotifPage = pathname === '/notificaciones'

  const dismiss = useCallback(() => {
    setExiting(true)
    setTimeout(() => {
      setVisible(null)
      setExiting(false)
    }, 300)
  }, [])

  useEffect(() => {
    if (isNotifPage) return

    let mounted = true

    async function poll() {
      try {
        const res = await fetch('/api/notifications?limit=5')
        if (!res.ok || !mounted) return
        const data = await res.json()
        const notifs: NewNotif[] = data.notifications ?? []

        // On first load, just seed the seen set — don't toast old notifications
        if (!lastCheck.current) {
          notifs.forEach((n) => seenIds.current.add(n.id))
          lastCheck.current = new Date().toISOString()
          return
        }

        // Find new notifications we haven't seen
        for (const n of notifs) {
          if (!seenIds.current.has(n.id)) {
            seenIds.current.add(n.id)
            if (mounted) {
              setVisible(n)
              // Auto-dismiss after 6 seconds
              setTimeout(() => {
                if (mounted) dismiss()
              }, 6000)
              // Also show desktop notification if permission granted
              if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
                try {
                  new Notification(n.title, {
                    body: n.body,
                    icon: '/icons/icon-192.png',
                    tag: `lt-${n.id}`,
                  })
                } catch { /* ignore — mobile doesn't support new Notification() */ }
              }
              break // Show one at a time
            }
          }
        }
      } catch { /* ignore */ }
    }

    // Poll every 15 seconds
    poll()
    const interval = setInterval(poll, 15_000)
    return () => { mounted = false; clearInterval(interval) }
  }, [isNotifPage, dismiss])

  if (!visible) return null

  const meta = TYPE_META[visible.type] ?? { emoji: '🔔', color: 'border-lt-green' }

  // Build link based on notification type
  let href = '/notificaciones'
  if (visible.type === 'QUESTION_OPEN' || visible.type === 'QUESTION_REMINDER') {
    const d = visible.data
    if (d?.leagueId) href = `/ligas/${d.leagueId}`
  } else if (visible.type === 'LEAGUE_INVITE' && visible.data?.inviteCode) {
    href = `/invite/${visible.data.inviteCode}`
  }

  return (
    <div className={`fixed top-4 left-4 right-4 z-[100] transition-all duration-300 ${exiting ? 'opacity-0 -translate-y-4' : 'opacity-100 translate-y-0 animate-slide-up'}`}>
      <Link
        href={href}
        onClick={dismiss}
        className={`block bg-lt-dark/95 backdrop-blur-md rounded-card border-l-4 ${meta.color} border border-[rgba(255,255,255,0.1)] p-4 shadow-2xl`}
      >
        <div className="flex items-start gap-3">
          <span className="text-xl flex-shrink-0">{meta.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className="font-condensed text-sm font-700 text-lt-white leading-snug">
              {visible.title}
            </p>
            <p className="text-lt-muted2 font-barlow text-xs mt-0.5 leading-snug line-clamp-2">
              {visible.body}
            </p>
          </div>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); dismiss() }}
            className="text-lt-muted2 hover:text-lt-white transition-colors flex-shrink-0 p-1"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </Link>
    </div>
  )
}
