'use client'
import { useState, useEffect } from 'react'
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
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/notifications?limit=10')
        if (!res.ok) return
        const data = await res.json()
        const notifs = data.notifications ?? data ?? []
        // Filter only unread promotion notifications
        const promoNotifs = notifs
          .filter((n: { type: string; read: boolean }) => n.type === 'PROMOTION' && !n.read)
          .slice(0, 3)
        setPromos(promoNotifs)
      } catch { /* ignore */ }
    }
    load()
  }, [])

  const visible = promos.filter((p) => !dismissed.has(p.id))
  if (visible.length === 0) return null

  return (
    <div className="space-y-2">
      {visible.map((promo) => (
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
              <p className="text-lt-white font-barlow text-sm mt-1 leading-snug">
                {promo.body}
              </p>
              {promo.imageUrl && expanded === promo.id && (
                <div className="relative w-full h-32 rounded-btn overflow-hidden mt-2">
                  <Image src={promo.imageUrl} alt="Promoción" fill className="object-cover" />
                </div>
              )}
              {promo.imageUrl && expanded !== promo.id && (
                <button
                  onClick={() => setExpanded(promo.id)}
                  className="text-lt-amber font-condensed text-xs mt-1 hover:underline"
                >
                  Ver imagen
                </button>
              )}
            </div>
            <button
              onClick={() => setDismissed((prev) => new Set(prev).add(promo.id))}
              className="text-lt-muted2 hover:text-lt-white transition-colors flex-shrink-0 p-0.5"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
