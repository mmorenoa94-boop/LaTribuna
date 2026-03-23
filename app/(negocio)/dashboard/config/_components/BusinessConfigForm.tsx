'use client'
import { useState } from 'react'

const BUSINESS_TYPES = [
  { value: 'BAR',          label: 'Bar' },
  { value: 'RESTAURANT',   label: 'Restaurante' },
  { value: 'CLUB_CASINO',  label: 'Club / Casino' },
  { value: 'OTHER',        label: 'Otro' },
]

interface BusinessData {
  name: string
  type: string
  address: string | null
  city: string | null
  phone: string | null
  checkinRadius: number
  maxCapacity: number | null
  lat: number | null
  lng: number | null
}

export function BusinessConfigForm({ business }: { business: BusinessData }) {
  const [form, setForm] = useState({
    name: business.name,
    type: business.type,
    address: business.address ?? '',
    city: business.city ?? '',
    phone: business.phone ?? '',
    checkinRadius: business.checkinRadius,
    maxCapacity: business.maxCapacity ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [geoLoading, setGeoLoading] = useState(false)
  const [geoOk, setGeoOk] = useState(!!business.lat)

  function update(key: string, value: string | number) {
    setForm((f) => ({ ...f, [key]: value }))
    setSaved(false)
  }

  function getLocation() {
    if (!navigator.geolocation) return
    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await fetch('/api/businesses/me', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          })
          setGeoOk(true)
        } finally {
          setGeoLoading(false)
        }
      },
      () => setGeoLoading(false),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/businesses/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          address: form.address || null,
          city: form.city || null,
          phone: form.phone || null,
          checkinRadius: form.checkinRadius,
          maxCapacity: form.maxCapacity ? Number(form.maxCapacity) : null,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? 'Error al guardar')
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full bg-lt-card2 border border-lt-muted rounded-btn px-4 py-3 text-lt-white font-barlow text-sm focus:outline-none focus:border-lt-amber transition-colors placeholder:text-lt-muted2'

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Nombre */}
      <div>
        <label className="block text-lt-white font-condensed text-sm mb-1.5">Nombre del negocio</label>
        <input type="text" value={form.name} onChange={(e) => update('name', e.target.value)} className={inputCls} />
      </div>

      {/* Tipo */}
      <div>
        <label className="block text-lt-white font-condensed text-sm mb-2">Tipo de negocio</label>
        <div className="grid grid-cols-2 gap-2">
          {BUSINESS_TYPES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => update('type', value)}
              className={`py-2.5 px-3 rounded-btn border font-condensed text-sm font-600 transition-all ${
                form.type === value
                  ? 'bg-lt-amber/20 border-lt-amber text-lt-amber'
                  : 'bg-lt-card border-lt-muted text-lt-white hover:border-lt-amber/30'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Ciudad + Dirección */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-lt-white font-condensed text-sm mb-1.5">Ciudad</label>
          <input type="text" value={form.city} onChange={(e) => update('city', e.target.value)} placeholder="Bogotá" className={inputCls} />
        </div>
        <div>
          <label className="block text-lt-white font-condensed text-sm mb-1.5">Dirección</label>
          <input type="text" value={form.address} onChange={(e) => update('address', e.target.value)} placeholder="Cra 80 #34-12" className={inputCls} />
        </div>
      </div>

      {/* Teléfono */}
      <div>
        <label className="block text-lt-white font-condensed text-sm mb-1.5">Teléfono</label>
        <input type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+57 300 123 4567" className={inputCls} />
      </div>

      {/* Check-in radius */}
      <div>
        <label className="block text-lt-white font-condensed text-sm mb-1.5">
          Radio de check-in <span className="text-lt-muted2">({form.checkinRadius}m)</span>
        </label>
        <input
          type="range"
          min={50}
          max={500}
          step={10}
          value={form.checkinRadius}
          onChange={(e) => update('checkinRadius', Number(e.target.value))}
          className="w-full accent-lt-amber"
        />
        <div className="flex justify-between text-lt-muted2 font-condensed text-xs mt-1">
          <span>50m</span>
          <span>500m</span>
        </div>
      </div>

      {/* Capacidad */}
      <div>
        <label className="block text-lt-white font-condensed text-sm mb-1.5">Capacidad máxima <span className="text-lt-muted2">(opcional)</span></label>
        <input
          type="number"
          value={form.maxCapacity}
          onChange={(e) => update('maxCapacity', e.target.value)}
          placeholder="Ej: 100"
          min={1}
          className={inputCls}
        />
      </div>

      {/* Ubicación GPS */}
      <div>
        <label className="block text-lt-white font-condensed text-sm mb-1.5">Ubicación GPS</label>
        <button
          type="button"
          onClick={getLocation}
          disabled={geoLoading}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-btn border font-condensed text-sm font-600 transition-all ${
            geoOk
              ? 'bg-lt-amber/15 border-lt-amber text-lt-amber'
              : 'bg-lt-card border-lt-muted text-lt-white hover:border-lt-amber/30'
          }`}
        >
          {geoLoading ? (
            <span className="w-4 h-4 border-2 border-lt-amber/30 border-t-lt-amber rounded-full animate-spin" />
          ) : geoOk ? (
            '✓ Ubicación guardada'
          ) : (
            '📍 Actualizar ubicación'
          )}
        </button>
      </div>

      {error && <p className="text-lt-red text-sm font-condensed">{error}</p>}

      <button
        type="submit"
        disabled={saving || !form.name.trim()}
        className={`w-full font-condensed font-700 text-base py-3.5 rounded-btn transition-all ${
          saved
            ? 'bg-lt-green text-lt-black'
            : 'bg-lt-amber text-lt-black disabled:opacity-40'
        }`}
      >
        {saving ? 'Guardando...' : saved ? '✓ Guardado' : 'Guardar cambios'}
      </button>
    </form>
  )
}
