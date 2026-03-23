'use client'
import { useState, useRef, useTransition, useCallback } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────────

type Gender = 'MASCULINO' | 'FEMENINO' | 'OTRO' | 'PREFIERO_NO_DECIR' | ''

interface InitialData {
  name: string
  image: string | null
  city: string
  phone: string
  bio: string
  favoriteTeam: string
  birthDate: string  // 'YYYY-MM-DD' or ''
  gender: Gender
  profilePct: number
}

interface Props {
  initialData: InitialData
}

// ── ProfilePct calculator (mirrors server) ────────────────────────────────────
function calcPct(d: Omit<InitialData, 'profilePct'>): number {
  let pct = 15
  if (d.image)        pct += 15
  if (d.city)         pct += 15
  if (d.phone)        pct += 15
  if (d.bio)          pct += 10
  if (d.favoriteTeam) pct += 15
  if (d.birthDate)    pct += 10
  if (d.gender)       pct += 5
  return Math.min(pct, 100)
}

// ── Gender options ────────────────────────────────────────────────────────────
const GENDER_OPTIONS: { value: Gender; label: string; emoji: string }[] = [
  { value: 'MASCULINO',         label: 'Masculino',          emoji: '♂️' },
  { value: 'FEMENINO',          label: 'Femenino',           emoji: '♀️' },
  { value: 'OTRO',              label: 'Otro',               emoji: '⚧️' },
  { value: 'PREFIERO_NO_DECIR', label: 'Prefiero no decir',  emoji: '🔒' },
]

// ── Colombian cities (quick list) ─────────────────────────────────────────────
const CITIES = [
  'Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena',
  'Cúcuta', 'Bucaramanga', 'Pereira', 'Manizales', 'Ibagué',
  'Santa Marta', 'Villavicencio', 'Pasto', 'Armenia', 'Montería',
  'Soledad', 'Bello', 'Soacha', 'Itagüí', 'Valledupar',
]

// ── Component ─────────────────────────────────────────────────────────────────

export function EditProfileForm({ initialData }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState<Omit<InitialData, 'profilePct'>>({
    name:         initialData.name,
    image:        initialData.image,
    city:         initialData.city,
    phone:        initialData.phone,
    bio:          initialData.bio,
    favoriteTeam: initialData.favoriteTeam,
    birthDate:    initialData.birthDate,
    gender:       initialData.gender,
  })
  const [imagePreview, setImagePreview] = useState<string | null>(initialData.image)
  const [error, setError]   = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const livePct = calcPct({ ...form, image: imagePreview })

  // ── Field change ────────────────────────────────────────────────────────────
  const set = (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm((f) => ({ ...f, [key]: e.target.value }))
      setError(null)
    }

  // ── Avatar pick ─────────────────────────────────────────────────────────────
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no puede superar 5 MB')
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string
      setImagePreview(base64)
      setForm((f) => ({ ...f, image: base64 }))
      setError(null)
    }
    reader.readAsDataURL(file)
  }, [])

  // ── Submit ───────────────────────────────────────────────────────────────────
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!form.name.trim()) {
      setError('El nombre es requerido')
      return
    }

    startTransition(async () => {
      try {
        const payload: Record<string, unknown> = {
          name:         form.name.trim(),
          city:         form.city,
          phone:        form.phone,
          bio:          form.bio,
          favoriteTeam: form.favoriteTeam,
          birthDate:    form.birthDate || null,
          gender:       form.gender || null,
        }

        // Only include image if it changed
        if (form.image !== initialData.image) {
          payload.image = form.image
        }

        const res = await fetch('/api/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!res.ok) {
          const data = await res.json()
          setError(data.error ?? 'Error al guardar')
          return
        }

        setSuccess(true)
        setTimeout(() => {
          router.push('/perfil')
          router.refresh()
        }, 900)
      } catch {
        setError('Error de red. Intenta de nuevo.')
      }
    })
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="px-4 space-y-6 mt-5">

      {/* Profile completeness */}
      <div className="bg-lt-card rounded-card border border-[rgba(255,255,255,0.07)] p-4">
        <div className="flex justify-between items-center mb-2">
          <p className="text-lt-white font-condensed text-sm font-700">Completitud del perfil</p>
          <span className={cn(
            'font-condensed font-700 text-sm transition-colors',
            livePct === 100 ? 'text-lt-amber' : 'text-lt-green'
          )}>
            {livePct}%
          </span>
        </div>
        <div className="h-1.5 bg-lt-card2 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              livePct === 100 ? 'bg-lt-amber' : 'bg-lt-green'
            )}
            style={{ width: `${livePct}%` }}
          />
        </div>
        <p className="text-lt-muted2 font-condensed text-xs mt-2">
          {livePct === 100
            ? '🏆 ¡Perfil completo! Máximos puntos'
            : 'Completa tu perfil para ganar más puntos'}
        </p>
      </div>

      {/* ── FOTO ── */}
      <Section title="Foto de perfil" icon="📸">
        <div className="flex items-center gap-4">
          {/* Avatar preview */}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-lt-green/40 bg-lt-card2 flex-shrink-0 group hover:border-lt-green transition-colors"
          >
            {imagePreview ? (
              <Image src={imagePreview} alt="Avatar" fill className="object-cover" sizes="80px" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-bebas text-4xl text-lt-green">
                {form.name.charAt(0).toUpperCase()}
              </div>
            )}
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <CameraIcon className="w-6 h-6 text-white" />
            </div>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
          <div className="flex-1">
            <p className="text-lt-white font-condensed text-sm font-700">
              {imagePreview ? 'Cambiar foto' : 'Subir foto'}
            </p>
            <p className="text-lt-muted2 font-condensed text-xs mt-0.5">
              JPG, PNG o WebP · máx. 5 MB
            </p>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="mt-2 px-3 py-1.5 rounded-btn border border-lt-green/30 bg-lt-green/10 text-lt-green font-condensed text-xs font-600 hover:bg-lt-green/15 transition-colors"
            >
              Seleccionar imagen
            </button>
          </div>
        </div>
      </Section>

      {/* ── DATOS PERSONALES ── */}
      <Section title="Datos personales" icon="👤">
        <div className="space-y-4">
          {/* Nombre */}
          <Field label="Nombre completo" required>
            <input
              type="text"
              value={form.name}
              onChange={set('name')}
              placeholder="Tu nombre"
              maxLength={60}
              className={inputClass}
            />
          </Field>

          {/* Fecha de nacimiento */}
          <Field label="Fecha de nacimiento" hint="+10% de completitud">
            <input
              type="date"
              value={form.birthDate}
              onChange={set('birthDate')}
              max={(() => {
                const d = new Date()
                d.setUTCFullYear(d.getUTCFullYear() - 13)
                return d.toISOString().split('T')[0]
              })()}
              className={cn(inputClass, 'date-input')}
            />
          </Field>

          {/* Género */}
          <Field label="Género" hint="+5% de completitud">
            <div className="grid grid-cols-2 gap-2">
              {GENDER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, gender: opt.value }))}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2.5 rounded-btn border font-condensed text-sm transition-all',
                    form.gender === opt.value
                      ? 'bg-lt-green/15 border-lt-green text-lt-green'
                      : 'bg-lt-card2 border-[rgba(255,255,255,0.1)] text-lt-muted hover:border-lt-green/30'
                  )}
                >
                  <span>{opt.emoji}</span>
                  <span className="font-600 truncate">{opt.label}</span>
                  {form.gender === opt.value && (
                    <CheckIcon className="w-3.5 h-3.5 ml-auto flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </Field>
        </div>
      </Section>

      {/* ── CONTACTO ── */}
      <Section title="Contacto y ubicación" icon="📍">
        <div className="space-y-4">
          {/* Celular */}
          <Field label="Número de celular" hint="+15% de completitud">
            <div className="flex items-center gap-0">
              <span className="h-11 flex items-center px-3 bg-lt-card2 border border-r-0 border-[rgba(255,255,255,0.1)] rounded-l-btn text-lt-muted2 font-condensed text-sm">
                🇨🇴 +57
              </span>
              <input
                type="tel"
                value={form.phone}
                onChange={set('phone')}
                placeholder="300 000 0000"
                maxLength={15}
                inputMode="numeric"
                className={cn(inputClass, 'rounded-l-none border-l-0')}
              />
            </div>
          </Field>

          {/* Ciudad */}
          <Field label="Ciudad" hint="+15% de completitud">
            <div className="relative">
              <input
                type="text"
                value={form.city}
                onChange={set('city')}
                placeholder="Tu ciudad"
                list="cities-list"
                maxLength={60}
                className={inputClass}
              />
              <datalist id="cities-list">
                {CITIES.map((c) => <option key={c} value={c} />)}
              </datalist>
            </div>
          </Field>
        </div>
      </Section>

      {/* ── SOBRE TI ── */}
      <Section title="Sobre ti" icon="⚽">
        <div className="space-y-4">
          {/* Equipo favorito */}
          <Field label="Equipo favorito" hint="+15% de completitud">
            <input
              type="text"
              value={form.favoriteTeam}
              onChange={set('favoriteTeam')}
              placeholder="Ej: América de Cali"
              maxLength={60}
              className={inputClass}
            />
          </Field>

          {/* Bio */}
          <Field label="Bio" hint="+10% de completitud">
            <textarea
              value={form.bio}
              onChange={set('bio')}
              placeholder="Cuéntanos algo sobre ti como hincha..."
              maxLength={200}
              rows={3}
              className={cn(inputClass, 'resize-none')}
            />
            <p className="text-lt-muted2 font-condensed text-[10px] text-right mt-1">
              {form.bio.length}/200
            </p>
          </Field>
        </div>
      </Section>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-btn px-4 py-3">
          <p className="text-red-400 font-condensed text-sm">{error}</p>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending || success}
        className={cn(
          'w-full py-4 rounded-btn font-condensed font-700 text-sm tracking-wide transition-all',
          success
            ? 'bg-lt-green/20 border border-lt-green text-lt-green'
            : 'bg-lt-green text-lt-black hover:bg-lt-green/90 disabled:opacity-60'
        )}
      >
        {success ? '✓ ¡Guardado!' : isPending ? 'Guardando...' : 'Guardar cambios'}
      </button>
    </form>
  )
}

// ── Shared sub-components ─────────────────────────────────────────────────────

const inputClass =
  'w-full h-11 bg-lt-card2 border border-[rgba(255,255,255,0.1)] rounded-btn px-3 text-lt-white font-condensed text-sm placeholder:text-lt-muted2 focus:outline-none focus:border-lt-green/60 transition-colors'

function Section({
  title,
  icon,
  children,
}: {
  title: string
  icon: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-lt-card rounded-card border border-[rgba(255,255,255,0.07)] p-4 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-base">{icon}</span>
        <h2 className="font-condensed font-700 text-sm text-lt-white uppercase tracking-wider">
          {title}
        </h2>
      </div>
      {children}
    </div>
  )
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string
  hint?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="font-condensed text-xs text-lt-muted uppercase tracking-wider">
          {label}
          {required && <span className="text-lt-green ml-0.5">*</span>}
        </label>
        {hint && (
          <span className="text-lt-green font-condensed text-[10px] font-600">{hint}</span>
        )}
      </div>
      {children}
    </div>
  )
}

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m20 6-11 11-5-5" />
    </svg>
  )
}
