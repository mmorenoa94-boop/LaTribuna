'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { signIn } from 'next-auth/react'

const EQUIPOS_COLOMBIA = [
  'Atlético Nacional', 'Millonarios', 'América de Cali', 'Santa Fe',
  'Deportivo Cali', 'Junior', 'Medellín', 'Deportes Tolima',
  'Atlético Bucaramanga', 'Once Caldas', 'Otro',
]

interface FormData {
  name: string
  email: string
  password: string
  city: string
  favoriteTeam: string
}

export default function RegisterHinchaPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-lt-black" />}>
      <RegisterHinchaContent />
    </Suspense>
  )
}

function RegisterHinchaContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/home'
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState<FormData>({
    name: '', email: '', password: '', city: '', favoriteTeam: '',
  })

  function update(field: keyof FormData, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, role: 'HINCHA' }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? 'Error al registrarse')
      }
      await signIn('credentials', { email: form.email, password: form.password, callbackUrl })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al registrarse')
      setLoading(false)
    }
  }

  const inputCls = 'w-full bg-lt-card border border-lt-muted rounded-btn px-4 py-3 text-lt-white font-barlow text-sm focus:outline-none focus:border-lt-green transition-colors placeholder:text-lt-muted2'

  return (
    <div className="flex flex-col min-h-screen px-6 pt-6 pb-10">
      <button onClick={() => step === 1 ? router.push('/onboarding') : setStep(s => s - 1)} className="text-lt-muted2 text-sm font-condensed mb-6 flex items-center gap-1 hover:text-lt-white transition-colors w-fit">
        ← {step === 1 ? 'Volver' : 'Paso anterior'}
      </button>

      {/* Progress */}
      <div className="flex gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className={`flex-1 h-1 rounded-full transition-colors ${s <= step ? 'bg-lt-green' : 'bg-lt-muted'}`} />
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
          {step === 1 && (
            <>
              <div>
                <h2 className="font-bebas text-3xl text-lt-white">Tu nombre en la tribuna</h2>
                <p className="text-lt-muted2 font-condensed text-sm mt-1">Paso 1 de 3 — Datos básicos</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-lt-white font-condensed text-sm mb-1.5">Nombre</label>
                  <input type="text" value={form.name} onChange={e => update('name', e.target.value)} placeholder="Tu nombre" className={inputCls} />
                </div>
                <div>
                  <label className="block text-lt-white font-condensed text-sm mb-1.5">Email</label>
                  <input type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="tu@email.com" className={inputCls} />
                </div>
                <div>
                  <label className="block text-lt-white font-condensed text-sm mb-1.5">Contraseña</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={e => update('password', e.target.value)} placeholder="Mínimo 8 caracteres" className={`${inputCls} pr-12`} />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-lt-muted2 hover:text-lt-white transition-colors p-1"
                    >
                      {showPassword ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
              <button
                onClick={() => { if (form.name && form.email && form.password.length >= 8) setStep(2) }}
                disabled={!form.name || !form.email || form.password.length < 8}
                className="w-full bg-lt-green text-lt-black font-condensed font-700 text-base py-3.5 rounded-btn disabled:opacity-40 mt-auto"
              >
                Continuar →
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <h2 className="font-bebas text-3xl text-lt-white">¿De dónde eres?</h2>
                <p className="text-lt-muted2 font-condensed text-sm mt-1">Paso 2 de 3 — Tu ciudad</p>
              </div>
              <div>
                <label className="block text-lt-white font-condensed text-sm mb-1.5">Ciudad</label>
                <input type="text" value={form.city} onChange={e => update('city', e.target.value)} placeholder="Bogotá, Medellín, Cali..." className={inputCls} />
              </div>
              <button
                onClick={() => setStep(3)}
                disabled={!form.city}
                className="w-full bg-lt-green text-lt-black font-condensed font-700 text-base py-3.5 rounded-btn disabled:opacity-40 mt-auto"
              >
                Continuar →
              </button>
            </>
          )}

          {step === 3 && (
            <>
              <div>
                <h2 className="font-bebas text-3xl text-lt-white">¿Cuál es tu equipo?</h2>
                <p className="text-lt-muted2 font-condensed text-sm mt-1">Paso 3 de 3 — Tu equipo del alma</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {EQUIPOS_COLOMBIA.map((equipo) => (
                  <button
                    key={equipo}
                    onClick={() => update('favoriteTeam', equipo)}
                    className={`py-3 px-3 rounded-btn border font-condensed text-sm font-600 transition-all text-left ${
                      form.favoriteTeam === equipo
                        ? 'bg-lt-green/20 border-lt-green text-lt-green'
                        : 'bg-lt-card border-lt-muted text-lt-white hover:border-lt-green/30'
                    }`}
                  >
                    {equipo}
                  </button>
                ))}
              </div>
              {error && <p className="text-lt-red text-sm font-condensed">{error}</p>}
              <button
                onClick={handleSubmit}
                disabled={!form.favoriteTeam || loading}
                className="w-full bg-lt-green text-lt-black font-condensed font-700 text-base py-3.5 rounded-btn disabled:opacity-40 mt-auto"
              >
                {loading ? 'Creando tu cuenta...' : '¡Entrar a la tribuna!'}
              </button>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
