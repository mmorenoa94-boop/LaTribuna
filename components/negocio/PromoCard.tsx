'use client'
import Image from 'next/image'
import { cn } from '@/lib/utils'

export interface PromoData {
  id: string
  title: string | null
  message: string
  imageUrl: string | null
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

export function PromoCard({
  promo,
  onSend,
  onEdit,
  onDelete,
}: {
  promo: PromoData
  onSend?: (id: string) => void
  onEdit?: (promo: PromoData) => void
  onDelete?: (id: string) => void
}) {
  const st = STATUS_MAP[promo.status] ?? STATUS_MAP.DRAFT

  return (
    <div className="bg-lt-card rounded-card border border-[rgba(255,255,255,0.07)] p-4">
      {/* Image */}
      {promo.imageUrl && (
        <div className="relative w-full h-32 rounded-btn overflow-hidden mb-3">
          <Image src={promo.imageUrl} alt="Promoción" fill className="object-cover" />
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          {promo.title && (
            <p className="font-condensed text-xs text-lt-amber font-700 uppercase tracking-wide mb-1">{promo.title}</p>
          )}
          <p className="font-condensed text-sm text-lt-white font-600">{promo.message}</p>
        </div>
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

      {/* Dates + Actions */}
      <div className="flex items-center justify-between gap-2">
        <span className="font-condensed text-[11px] text-lt-muted2">
          {promo.sentAt
            ? `Enviada ${formatDate(promo.sentAt)}`
            : promo.scheduledAt
              ? `Programada ${formatDate(promo.scheduledAt)}`
              : `Creada ${formatDate(promo.createdAt)}`}
        </span>

        <div className="flex items-center gap-2">
          {/* Edit button (only for drafts/scheduled) */}
          {promo.status !== 'SENT' && onEdit && (
            <button
              onClick={() => onEdit(promo)}
              className="p-1.5 rounded-btn text-lt-muted2 hover:text-lt-amber transition-colors"
              title="Editar"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          )}

          {/* Delete button */}
          {onDelete && (
            <button
              onClick={() => onDelete(promo.id)}
              className="p-1.5 rounded-btn text-lt-muted2 hover:text-lt-red transition-colors"
              title="Eliminar"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          )}

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
