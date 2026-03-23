'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { signIn } from 'next-auth/react'

const BUSINESS_TYPES = [
  { value: 'BAR',          label: 'Bar',              icon: '🍺' },
  { value: 'RESTAURANT',   label: 'Restaurante',      icon: '🍽️' },
  { value: 'CLUB_CASINO',  label: 'Club / Casino',    icon: '🎰' },
  { value: 'OTHER',        label: 'Otro',             icon: '🏢' },
] as const

interface FormData {
  name: string
  email: string
  password: string
  businessName: string
  businessType: string
  phone: string
  city: string
  address: string
  lat: number | null
  lng: number | null
}

export default function RegisterNegocioPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [geoLoading, setGeoLoading] = useState(false)
  const [geoOk, setGeoOk] = useState(false)
  const [form, setForm] = useState<FormData>({
    name: '', email: '', password: '',
    businessName: '', businessType: '', phone: '',
    city: '', address: '',
    lat: null, lng: null,
  })

  function update<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function getLocation() {
    if (!navigator.geolocation) return
    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        update('lat', pos.coords.latitude)
        update('lng', pos.coords.longitude)
        setGeoOk(true)
        setGeoLoading(false)
      },
      () => setGeoLoading(false),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  async function handleSubmit() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, role: 'NEGOCIO' }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? 'Error al registrarse')
      }
      await signIn('credentials', {
        email: form.email,
        password: form.password,
        callbackUrl: '/dashboard',
      })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al registrarse')
      setLoading(false)
    }
  }

  const inputCls = 'w-full bg-lt-card border border-lt-muted rounded-btn px-4 py-3 text-lt-white font-barlow text-sm focus:outline-none focus:border-lt-amber transition-colors placeholder:text-lt-muted2'
  const TOTAL_STEPS = 4

  const canNext: Record<number, boolean> = {
    1: !!(form.name && form.email && form.password.length >= 8),
    2: !!(form.businessName && form.businessType),
    3: !!form.city,
    4: true,
  }

  return (
    <div className="flex flex-col min-h-screen px-6 pt-6 pb-10">
      <button
        onClick={() => step === 1 ? router.push('/onboarding') : setStep((s) => s - 1)}
        className="text-lt-muted2 text-sm font-condensed mb-6 flex items-center gap-1 hover:text-lt-white transition-colors w-fit"
      >
        ← {step === 1 ? 'Volver' : 'Paso anterior'}
      </button>

      {/* Progress */}
      <div className="flex gap-2 mb-8">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
          <div
            key={s}
            className={`flex-1 h-1 rounded-full transition-colors ${s <= step ? 'bg-lt-amber' : 'bg-lt-muted'}`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="flex-1 flex flex-col gap-6"
        >
          {/* ── Paso 1: Datos personales ──────────────────────────── */}
          {step === 1 && (
            <>
              <div>
                <h2 className="font-bebas text-3xl text-lt-white">Tus datos de contacto</h2>
                <p className="text-lt-muted2 font-condensed text-sm mt-1">Paso 1 de {TOTAL_STEPS} — Persona responsable</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-lt-white font-condensed text-sm mb-1.5">Nombre</label>
                  <input type="text" value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Tu nombre completo" className={inputCls} />
                </div>
                <div>
                  <label className="block text-lt-white font-condensed text-sm mb-1.5">Email</label>
                  <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="negocio@email.com" className={inputCls} />
                </div>
                <div>
                  <label className="block text-lt-white font-condensed text-sm mb-1.5">Contraseña</label>
                  <input type="password" value={form.password} onChange={(e) => update('password', e.target.value)} placeholder="Mínimo 8 caracteres" className={inputCls} />
                </div>
              </div>
              <button
                onClick={() => setStep(2)}
                disabled={!canNext[1]}
                className="w-full bg-lt-amber text-lt-black font-condensed font-700 text-base py-3.5 rounded-btn disabled:opacity-40 mt-auto"
              >
                Continuar →
              </button>
            </>
          )}

          {/* ── Paso 2: Info del negocio ──────────────────────────── */}
          {step === 2 && (
            <>
              <div>
                <h2 className="font-bebas text-3xl text-lt-white">Tu negocio</h2>
                <p className="text-lt-muted2 font-condensed text-sm mt-1">Paso 2 de {TOTAL_STEPS} — Información del establecimiento</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-lt-white font-condensed text-sm mb-1.5">Nombre del negocio <span className="text-lt-red">*</span></label>
                  <input type="text" value={form.businessName} onChange={(e) => update('businessName', e.target.value)} placeholder="Ej: Sports Bar La 80" className={inputCls} />
                </div>
                <div>
                  <label className="block text-lt-white font-condensed text-sm mb-2">Tipo de negocio <span className="text-lt-red">*</span></label>
                  <div className="grid grid-cols-2 gap-2">
                    {BUSINESS_TYPES.map(({ value, label, icon }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => update('businessType', value)}
                        className={`flex items-center gap-2 py-3 px-3 rounded-btn border font-condensed text-sm font-600 transition-all text-left ${
                          form.businessType === value
                            ? 'bg-lt-amber/20 border-lt-amber text-lt-amber'
                            : 'bg-lt-card border-lt-muted text-lt-white hover:border-lt-amber/30'
                        }`}
                      >
                        <span className="text-lg">{icon}</span>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-lt-white font-condensed text-sm mb-1.5">Teléfono <span className="text-lt-muted2">(opcional)</span></label>
                  <input type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+57 300 123 4567" className={inputCls} />
                </div>
              </div>
              <button
                onClick={() => setStep(3)}
                disabled={!canNext[2]}
                className="w-full bg-lt-amber text-lt-black font-condensed font-700 text-base py-3.5 rounded-btn disabled:opacity-40 mt-auto"
              >
                Continuar →
              </button>
            </>
          )}

          {/* ── Paso 3: Ubicación ─────────────────────────────────── */}
          {step === 3 && (
            <>
              <div>
                <h2 className="font-bebas text-3xl text-lt-white">Ubicación</h2>
                <p className="text-lt-muted2 font-condensed text-sm mt-1">Paso 3 de {TOTAL_STEPS} — ¿Dónde queda tu negocio?</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-lt-white font-condensed text-sm mb-1.5">Ciudad <span className="text-lt-red">*</span></label>
                  <input type="text" value={form.city} onChange={(e) => update('city', e.target.value)} placeholder="Bogotá, Medellín, Cali..." className={inputCls} />
                </div>
                <div>
                  <label className="block text-lt-white font-condensed text-sm mb-1.5">Dirección <span className="text-lt-muted2">(opcional)</span></label>
                  <input type="text" value={form.address} onChange={(e) => update('address', e.target.value)} placeholder="Cra 80 #34-12" className={inputCls} />
                </div>
                <div>
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
                      <>
                        <span className="w-4 h-4 border-2 border-lt-amber/30 border-t-lt-amber rounded-full animate-spin" />
                        Obteniendo ubicación...
                      </>
                    ) : geoOk ? (
                      <>
                        <span>✓</span>
                        Ubicación capturada
                      </>
                    ) : (
                      <>
                        <span>📍</span>
                        Usar mi ubicación actual
                      </>
                    )}
                  </button>
                  {geoOk && form.lat && form.lng && (
                    <p className="text-lt-muted2 text-xs font-condensed mt-1.5 text-center">
                      {form.lat.toFixed(4)}, {form.lng.toFixed(4)}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setStep(4)}
                disabled={!canNext[3]}
                className="w-full bg-lt-amber text-lt-black font-condensed font-700 text-base py-3.5 rounded-btn disabled:opacity-40 mt-auto"
              >
                Continuar →
              </button>
            </>
          )}

          {/* ── Paso 4: Confirmación ──────────────────────────────── */}
          {step === 4 && (
            <>
              <div>
                <h2 className="font-bebas text-3xl text-lt-white">Confirmar datos</h2>
                <p className="text-lt-muted2 font-condensed text-sm mt-1">Paso 4 de {TOTAL_STEPS} — Revisa y confirma</p>
              </div>

              <div className="bg-lt-card rounded-card border border-[rgba(255,255,255,0.07)] p-5 space-y-3">
                <SummaryRow label="Contacto" value={form.name} />
                <SummaryRow label="Email" value={form.email} />
                <div className="border-t border-[rgba(255,255,255,0.06)] my-1" />
                <SummaryRow label="Negocio" value={form.businessName} />
                <SummaryRow
                  label="Tipo"
                  value={BUSINESS_TYPES.find((t) => t.value === form.businessType)?.label ?? ''}
                />
                {form.phone && <SummaryRow label="Teléfono" value={form.phone} />}
                <div className="border-t border-[rgba(255,255,255,0.06)] my-1" />
                <SummaryRow label="Ciudad" value={form.city} />
                {form.address && <SummaryRow label="Dirección" value={form.address} />}
                {geoOk && <SummaryRow label="GPS" value="✓ Ubicación capturada" accent />}
              </div>

              {error && <p className="text-lt-red text-sm font-condensed">{error}</p>}

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-lt-amber text-lt-black font-condensed font-700 text-base py-3.5 rounded-btn disabled:opacity-50 mt-auto"
              >
                {loading ? 'Creando tu cuenta...' : 'Abrir mi negocio en La Tribuna'}
              </button>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function SummaryRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-lt-muted2 font-condensed text-sm">{label}</span>
      <span className={`font-condensed text-sm font-700 ${accent ? 'text-lt-amber' : 'text-lt-white'}`}>
        {value}
      </span>
    </div>
  )
}
