'use client'
import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { PromoCard, type PromoData } from '@/components/negocio/PromoCard'

const SEGMENTS = [
  { value: 'ALL_IN_VENUE',       label: 'En el local',              icon: '📍', desc: 'Personas que están ahora en tu negocio' },
  { value: 'LEAGUE_PLAYERS',     label: 'Jugadores de liga',        icon: '🏆', desc: 'Miembros aprobados de tus ligas' },
  { value: 'VERIFIED_CONSUMERS', label: 'Consumidores verificados', icon: '✅', desc: 'Con consumo verificado' },
  { value: 'RECURRING',          label: 'Recurrentes',              icon: '🔁', desc: '3+ visitas a tu negocio' },
]

const CHANNELS = [
  { value: 'push',   label: 'Push',   icon: '🔔' },
  { value: 'in-app', label: 'In-app', icon: '📱' },
  { value: 'email',  label: 'Email',  icon: '📧' },
]

const TIMINGS = [
  { value: 'IMMEDIATE', label: 'Enviar ahora',      icon: '⚡' },
  { value: 'HALFTIME',  label: 'Al medio tiempo',   icon: '⏸️' },
  { value: 'SCHEDULED', label: 'Programar',          icon: '📅' },
]

type StatusFilter = 'all' | 'DRAFT' | 'SENT' | 'SCHEDULED' | 'EXPIRED'

export default function PromocionesPage() {
  const [promos, setPromos] = useState<PromoData[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [sending, setSending] = useState<string | null>(null)

  const fetchPromos = useCallback(async () => {
    const res = await fetch('/api/promotions')
    if (res.ok) setPromos(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { fetchPromos() }, [fetchPromos])

  async function handleSend(id: string) {
    setSending(id)
    try {
      const res = await fetch(`/api/promotions/${id}/send`, { method: 'POST' })
      if (res.ok) {
        const updated = await res.json()
        setPromos((prev) => prev.map((p) => (p.id === id ? { ...updated, channels: updated.channels } : p)))
      }
    } finally {
      setSending(null)
    }
  }

  const filtered = filter === 'all' ? promos : promos.filter((p) => p.status === filter)

  const counts = {
    all: promos.length,
    DRAFT: promos.filter((p) => p.status === 'DRAFT').length,
    SENT: promos.filter((p) => p.status === 'SENT').length,
    SCHEDULED: promos.filter((p) => p.status === 'SCHEDULED').length,
    EXPIRED: promos.filter((p) => p.status === 'EXPIRED').length,
  }

  return (
    <div className="px-4 md:px-8 pt-4 md:pt-8 space-y-6 animate-fade-in max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lt-muted2 text-sm font-condensed">Marketing</p>
          <h1 className="text-lt-white font-bebas text-3xl leading-tight">Promociones</h1>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-btn bg-lt-amber text-lt-black font-condensed text-sm font-700 active:scale-95 transition-all"
        >
          <span className="text-lg leading-none">+</span>
          Nueva
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <CreatePromoForm
          onCreated={(p) => { setPromos((prev) => [p, ...prev]); setShowForm(false) }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 overflow-x-auto no-scrollbar">
        {([
          { key: 'all' as StatusFilter, label: 'Todas' },
          { key: 'DRAFT' as StatusFilter, label: 'Borrador' },
          { key: 'SENT' as StatusFilter, label: 'Enviadas' },
          { key: 'SCHEDULED' as StatusFilter, label: 'Programadas' },
        ]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={cn(
              'px-3 py-1.5 rounded-full font-condensed text-xs font-600 transition-all flex-shrink-0',
              filter === key
                ? 'bg-lt-amber/20 text-lt-amber'
                : 'text-lt-muted2 hover:text-lt-white'
            )}
          >
            {label} {counts[key] > 0 && <span className="ml-1 opacity-70">({counts[key]})</span>}
          </button>
        ))}
      </div>

      {/* Promos list */}
      {loading ? (
        <div className="text-center py-8">
          <span className="w-6 h-6 border-2 border-lt-amber/30 border-t-lt-amber rounded-full animate-spin inline-block" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-lt-card rounded-card border border-[rgba(255,255,255,0.07)] p-8 text-center">
          <span className="text-3xl block mb-2">📢</span>
          <p className="font-condensed text-sm text-lt-white font-700">Sin promociones</p>
          <p className="text-lt-muted2 font-barlow text-xs mt-1">
            Crea tu primera promoción para alcanzar a tus clientes
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => (
            <PromoCard
              key={p.id}
              promo={p}
              onSend={sending === p.id ? undefined : handleSend}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Create Promo Form ─────────────────────────────────────────
function CreatePromoForm({
  onCreated,
  onCancel,
}: {
  onCreated: (p: PromoData) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState({
    message: '',
    segment: 'ALL_IN_VENUE',
    channels: ['push'] as string[],
    timing: 'IMMEDIATE',
    scheduledAt: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function toggleChannel(ch: string) {
    setForm((f) => ({
      ...f,
      channels: f.channels.includes(ch)
        ? f.channels.filter((c) => c !== ch)
        : [...f.channels, ch],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.message.trim() || form.channels.length === 0) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al crear')
      onCreated(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-lt-card rounded-card border border-lt-amber/20 p-5 space-y-5">
      <p className="font-condensed text-base text-lt-amber font-700">Nueva promoción</p>

      {/* Message */}
      <div>
        <label className="block text-lt-white font-condensed text-sm mb-1.5">
          Mensaje <span className="text-lt-muted2">({form.message.length}/120)</span>
        </label>
        <textarea
          value={form.message}
          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value.slice(0, 120) }))}
          placeholder="Ej: 2x1 en cervezas durante el partido 🍻"
          rows={2}
          className="w-full bg-lt-card2 border border-lt-muted rounded-btn px-4 py-3 text-lt-white font-barlow text-sm focus:outline-none focus:border-lt-amber transition-colors placeholder:text-lt-muted2 resize-none"
        />
      </div>

      {/* Segment */}
      <div>
        <label className="block text-lt-white font-condensed text-sm mb-2">Audiencia</label>
        <div className="grid grid-cols-2 gap-2">
          {SEGMENTS.map(({ value, label, icon, desc }) => (
            <button
              key={value}
              type="button"
              onClick={() => setForm((f) => ({ ...f, segment: value }))}
              className={cn(
                'py-3 px-3 rounded-btn border text-left transition-all',
                form.segment === value
                  ? 'bg-lt-amber/20 border-lt-amber'
                  : 'bg-lt-card2 border-lt-muted hover:border-lt-amber/30'
              )}
            >
              <p className={cn('font-condensed text-xs font-600', form.segment === value ? 'text-lt-amber' : 'text-lt-white')}>
                {icon} {label}
              </p>
              <p className="font-barlow text-[10px] text-lt-muted2 mt-0.5">{desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Channels */}
      <div>
        <label className="block text-lt-white font-condensed text-sm mb-2">Canales de envío</label>
        <div className="flex gap-2">
          {CHANNELS.map(({ value, label, icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => toggleChannel(value)}
              className={cn(
                'flex-1 py-2.5 rounded-btn border font-condensed text-xs font-600 transition-all',
                form.channels.includes(value)
                  ? 'bg-lt-amber/20 border-lt-amber text-lt-amber'
                  : 'bg-lt-card2 border-lt-muted text-lt-muted2 hover:border-lt-amber/30'
              )}
            >
              {icon} {label}
            </button>
          ))}
        </div>
      </div>

      {/* Timing */}
      <div>
        <label className="block text-lt-white font-condensed text-sm mb-2">Cuándo enviar</label>
        <div className="flex gap-2">
          {TIMINGS.map(({ value, label, icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setForm((f) => ({ ...f, timing: value }))}
              className={cn(
                'flex-1 py-2.5 rounded-btn border font-condensed text-xs font-600 transition-all',
                form.timing === value
                  ? 'bg-lt-amber/20 border-lt-amber text-lt-amber'
                  : 'bg-lt-card2 border-lt-muted text-lt-muted2 hover:border-lt-amber/30'
              )}
            >
              {icon} {label}
            </button>
          ))}
        </div>
      </div>

      {/* Scheduled date */}
      {form.timing === 'SCHEDULED' && (
        <div>
          <label className="block text-lt-white font-condensed text-sm mb-1.5">Fecha y hora de envío</label>
          <input
            type="datetime-local"
            value={form.scheduledAt}
            onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))}
            className="w-full bg-lt-card2 border border-lt-muted rounded-btn px-4 py-3 text-lt-white font-barlow text-sm focus:outline-none focus:border-lt-amber transition-colors"
          />
        </div>
      )}

      {error && <p className="text-lt-red text-sm font-condensed">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving || !form.message.trim() || form.channels.length === 0}
          className="flex-1 py-3 rounded-btn bg-lt-amber text-lt-black font-condensed text-sm font-700 disabled:opacity-40 transition-opacity"
        >
          {saving ? 'Creando...' : form.timing === 'IMMEDIATE' ? 'Crear borrador' : form.timing === 'SCHEDULED' ? 'Programar' : 'Crear borrador'}
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-3 rounded-btn border border-lt-muted text-lt-muted2 font-condensed text-sm">
          Cancelar
        </button>
      </div>
    </form>
  )
}
