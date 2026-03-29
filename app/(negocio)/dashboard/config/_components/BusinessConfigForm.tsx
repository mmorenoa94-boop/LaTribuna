'use client'
import { useState, useRef } from 'react'
import Image from 'next/image'

const BUSINESS_TYPES = [
  { value: 'BAR',          label: 'Bar' },
  { value: 'RESTAURANT',   label: 'Restaurante' },
  { value: 'CLUB_CASINO',  label: 'Club / Casino' },
  { value: 'OTHER',        label: 'Otro' },
]

interface BusinessData {
  name: string
  type: string
  logoUrl: string | null
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
  const [logoUrl, setLogoUrl] = useState<string | null>(business.logoUrl)
  const [logoUploading, setLogoUploading] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [geoLoading, setGeoLoading] = useState(false)
  const [geoOk, setGeoOk] = useState(!!business.lat)

  async function handleLogoUpload(file: File) {
    if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
      setError('Solo se permiten imágenes JPEG, PNG o WebP')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('La imagen no puede superar 2MB')
      return
    }
    setLogoUploading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'logos')
      const res = await fetch('/api/upload/image', { method: 'POST', body: formData })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error || 'Error al subir imagen')
        return
      }
      const data = await res.json()
      setLogoUrl(data.url)
      // Save immediately
      await fetch('/api/businesses/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logoUrl: data.url }),
      })
      setSaved(false)
    } catch {
      setError('Error al subir imagen')
    } finally {
      setLogoUploading(false)
    }
  }

  async function handleRemoveLogo() {
    setLogoUrl(null)
    await fetch('/api/businesses/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logoUrl: '' }),
    })
  }

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
      {/* Logo */}
      <div>
        <label className="block text-lt-white font-condensed text-sm mb-2">Logo del negocio</label>
        <p className="text-lt-muted2 font-condensed text-xs mb-3">
          Se muestra en tus ligas y perfil público. Recomendado: 400×400px, cuadrado.
        </p>
        <div className="flex items-center gap-4">
          {logoUrl ? (
            <div className="relative flex-shrink-0">
              <Image
                src={logoUrl}
                alt="Logo del negocio"
                width={80}
                height={80}
                className="w-20 h-20 rounded-card object-cover border border-[rgba(255,255,255,0.1)]"
              />
              <button
                type="button"
                onClick={handleRemoveLogo}
                className="absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center bg-lt-red rounded-full text-white text-xs hover:bg-lt-red/80 transition-colors"
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="w-20 h-20 rounded-card bg-lt-card2 border-2 border-dashed border-[rgba(255,255,255,0.15)] flex items-center justify-center flex-shrink-0">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-lt-muted2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
            </div>
          )}
          <div className="flex-1">
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              disabled={logoUploading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-btn bg-lt-card border border-lt-muted text-lt-white font-condensed text-sm hover:border-lt-amber/30 transition-colors disabled:opacity-50"
            >
              {logoUploading ? (
                <span className="w-4 h-4 border-2 border-lt-amber/30 border-t-lt-amber rounded-full animate-spin" />
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              )}
              {logoUploading ? 'Subiendo...' : logoUrl ? 'Cambiar logo' : 'Subir logo'}
            </button>
            <p className="text-lt-muted font-condensed text-[11px] mt-1.5">JPEG, PNG o WebP — máx. 2MB</p>
          </div>
        </div>
        <input
          ref={logoInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); e.target.value = '' }}
          className="hidden"
        />
      </div>

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
