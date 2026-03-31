'use client'
import { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import Image from 'next/image'

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-lt-black" />}>
      <LoginContent />
    </Suspense>
  )
}

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/home'
  const [tab, setTab] = useState<'email' | 'social'>('email')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await signIn('credentials', { email, password, redirect: false })
    setLoading(false)
    if (res?.error) {
      setError('Email o contraseña incorrectos')
    } else {
      router.push(callbackUrl)
    }
  }

  return (
    <div className="flex flex-col min-h-screen items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <button onClick={() => router.push('/onboarding')} className="text-lt-muted2 text-sm font-condensed mb-6 flex items-center gap-1 hover:text-lt-white transition-colors">
          ← Volver
        </button>

        <div className="flex flex-col items-center mb-6">
          <Image
            src="/logo.png"
            alt="La Tribuna"
            width={160}
            height={160}
            className="drop-shadow-[0_0_30px_rgba(255,193,7,0.25)]"
            priority
          />
          <h1 className="font-bebas text-4xl text-lt-white mt-2">Iniciar sesión</h1>
          <p className="text-lt-muted2 font-condensed text-sm mt-0.5">Bienvenido de vuelta, hincha</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-lt-card rounded-btn p-1 mb-6 border border-lt-muted">
          {(['email', 'social'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-[8px] font-condensed text-sm font-600 transition-all ${
                tab === t ? 'bg-lt-green text-lt-black' : 'text-lt-muted2'
              }`}
            >
              {t === 'email' ? 'Email' : 'Google / Apple'}
            </button>
          ))}
        </div>

        {tab === 'email' ? (
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-lt-white font-condensed text-sm mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-lt-card border border-lt-muted rounded-btn px-4 py-3 text-lt-white font-barlow text-sm focus:outline-none focus:border-lt-green transition-colors placeholder:text-lt-muted2"
                placeholder="tu@email.com"
              />
            </div>
            <div>
              <label className="block text-lt-white font-condensed text-sm mb-1.5">Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-lt-card border border-lt-muted rounded-btn px-4 py-3 pr-12 text-lt-white font-barlow text-sm focus:outline-none focus:border-lt-green transition-colors placeholder:text-lt-muted2"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-lt-muted2 hover:text-lt-white transition-colors p-1"
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>
            {error && (
              <div className="bg-lt-red/10 border border-lt-red/30 rounded-btn px-4 py-3 flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-lt-red flex-shrink-0">
                  <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                <p className="text-lt-red text-sm font-condensed font-600">{error}</p>
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-lt-green text-lt-black font-condensed font-700 text-base py-3.5 rounded-btn hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Cargando...' : 'Entrar'}
            </button>
            <div className="text-center">
              <a
                href="https://wa.me/573168762797?text=Hola%2C%20olvid%C3%A9%20mi%20contrase%C3%B1a%20de%20La%20Tribuna.%20Mi%20correo%20es%3A%20"
                target="_blank"
                rel="noopener noreferrer"
                className="text-lt-muted2 text-sm font-condensed hover:text-lt-white transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </a>
            </div>
          </form>
        ) : (
          <div className="space-y-3">
            <button
              onClick={() => signIn('google', { callbackUrl })}
              className="w-full flex items-center justify-center gap-3 bg-lt-card border border-lt-muted rounded-btn px-4 py-3.5 text-lt-white font-condensed text-sm hover:border-lt-white/20 transition-colors"
            >
              <GoogleIcon />
              Continuar con Google
            </button>
            <button
              onClick={() => signIn('apple', { callbackUrl })}
              className="w-full flex items-center justify-center gap-3 bg-lt-card border border-lt-muted rounded-btn px-4 py-3.5 text-lt-white font-condensed text-sm hover:border-lt-white/20 transition-colors"
            >
              <AppleIcon />
              Continuar con Apple
            </button>
          </div>
        )}

        <p className="text-center text-lt-muted2 text-sm font-condensed mt-6">
          ¿No tienes cuenta?{' '}
          <button onClick={() => router.push(callbackUrl !== '/home' ? `/onboarding?callbackUrl=${encodeURIComponent(callbackUrl)}` : '/onboarding')} className="text-lt-green hover:underline">
            Regístrate
          </button>
        </p>
      </motion.div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}
function EyeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}
function EyeOffIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}
function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
    </svg>
  )
}
