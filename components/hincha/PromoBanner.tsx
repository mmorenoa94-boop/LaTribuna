'use client'
import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'

interface PromoNotification {
  id: string
  title: string
  body: string
  imageUrl?: string | null
  createdAt: string
}

export function PromoBanner() {
  const [promos, setPromos] = useState<PromoNotification[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/notifications?limit=10')
        if (!res.ok) return
        const data = await res.json()
        const notifs = data.notifications ?? data ?? []
        // Filter only unread promotion notifications (readAt is null)
        const promoNotifs = notifs
          .filter((n: { type: string; readAt: string | null }) => n.type === 'PROMOTION' && !n.readAt)
          .slice(0, 3)
        setPromos(promoNotifs)
      } catch { /* ignore */ }
    }
    load()
  }, [])

  const dismiss = useCallback(async (id: string) => {
    // Remove from UI immediately
    setPromos((prev) => prev.filter((p) => p.id !== id))
    // Mark as read on server so it doesn't come back
    try {
      await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id] }),
      })
    } catch { /* ignore */ }
  }, [])

  if (promos.length === 0) return null

  return (
    <div className="space-y-2">
      {promos.map((promo) => {
        const isExpanded = expandedId === promo.id
        const isLong = promo.body.length > 120

        return (
          <div
            key={promo.id}
            className="bg-lt-card rounded-card border border-lt-amber/30 p-3 animate-fade-in"
          >
            <div className="flex items-start gap-3">
              <span className="text-lg flex-shrink-0">📢</span>
              <div className="flex-1 min-w-0">
                <p className="font-condensed text-xs text-lt-amber font-700 uppercase tracking-wide">
                  Promoción · {promo.title}
                </p>
                <p className={`text-lt-white font-barlow text-sm mt-1 leading-snug whitespace-pre-line ${!isExpanded && isLong ? 'line-clamp-3' : ''}`}>
                  {promo.body}
                </p>
                {isLong && (
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : promo.id)}
                    className="text-lt-amber font-condensed text-xs mt-1 hover:underline"
                  >
                    {isExpanded ? 'Ver menos' : 'Ver más'}
                  </button>
                )}
                {promo.imageUrl && (
                  <div className="relative w-full h-36 rounded-btn overflow-hidden mt-2">
                    <Image src={promo.imageUrl} alt="Promoción" fill className="object-cover" />
                  </div>
                )}
              </div>
              <button
                onClick={() => dismiss(promo.id)}
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
    </div>
  )
}
