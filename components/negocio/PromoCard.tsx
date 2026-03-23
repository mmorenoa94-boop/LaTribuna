'use client'
import { cn } from '@/lib/utils'

export interface PromoData {
  id: string
  message: string
  segment: string
  channels: string[]
  timing: string
  scheduledAt: string | null
  sentAt: string | null
  status: string
  reach: number
  createdAt: string
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  DRAFT:     { label: 'Borrador',    color: 'text-lt-muted2', bg: 'border-lt-muted' },
  SENT:      { label: 'Enviada',     color: 'text-lt-green',  bg: 'border-lt-green/40' },
  SCHEDULED: { label: 'Programada',  color: 'text-lt-amber',  bg: 'border-lt-amber/40' },
  EXPIRED:   { label: 'Expirada',    color: 'text-lt-muted2', bg: 'border-lt-muted' },
}

const SEGMENT_MAP: Record<string, string> = {
  ALL_IN_VENUE:        '📍 En el local',
  LEAGUE_PLAYERS:      '🏆 Jugadores de liga',
  VERIFIED_CONSUMERS:  '✅ Consumidores verificados',
  RECURRING:           '🔁 Recurrentes',
}

const CHANNEL_MAP: Record<string, string> = {
  push:   '🔔 Push',
  email:  '📧 Email',
  'in-app': '📱 In-app',
}

export function PromoCard({ promo, onSend }: { promo: PromoData; onSend?: (id: string) => void }) {
  const st = STATUS_MAP[promo.status] ?? STATUS_MAP.DRAFT

  return (
    <div className="bg-lt-card rounded-card border border-[rgba(255,255,255,0.07)] p-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <p className="font-condensed text-sm text-lt-white font-600 flex-1">{promo.message}</p>
        <span className={cn('font-condensed text-[10px] font-700 border px-2 py-0.5 rounded-full flex-shrink-0', st.color, st.bg)}>
          {st.label}
        </span>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-3">
        <span className="font-condensed text-xs text-lt-muted2">
          {SEGMENT_MAP[promo.segment] ?? promo.segment}
        </span>
        <span className="font-condensed text-xs text-lt-muted2">
          {(promo.channels ?? []).map((ch) => CHANNEL_MAP[ch] ?? ch).join(', ')}
        </span>
        {promo.status === 'SENT' && (
          <span className="font-condensed text-xs text-lt-green">
            👥 {promo.reach} alcanzados
          </span>
        )}
      </div>

      {/* Dates */}
      <div className="flex items-center justify-between">
        <span className="font-condensed text-[11px] text-lt-muted2">
          {promo.sentAt
            ? `Enviada ${formatDate(promo.sentAt)}`
            : promo.scheduledAt
              ? `Programada ${formatDate(promo.scheduledAt)}`
              : `Creada ${formatDate(promo.createdAt)}`}
        </span>

        {/* Send button for drafts */}
        {promo.status === 'DRAFT' && onSend && (
          <button
            onClick={() => onSend(promo.id)}
            className="px-3 py-1.5 rounded-btn bg-lt-amber text-lt-black font-condensed text-xs font-700 active:scale-95 transition-all"
          >
            Enviar ahora
          </button>
        )}
      </div>
    </div>
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Bogota',
  })
}
