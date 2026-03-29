'use client'
import { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-lt-black" />}>
      <OnboardingContent />
    </Suspense>
  )
}

function OnboardingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl')
  const cbParam = callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ''

  return (
    <div className="flex flex-col min-h-screen items-center justify-center px-6 gap-8">
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="font-bebas text-6xl text-lt-white tracking-wider leading-none">
          LA TRIBUNA
        </h1>
        <p className="text-lt-muted2 font-condensed text-base mt-1 tracking-widest uppercase">
          El juego de los que sí saben
        </p>
      </motion.div>

      {/* Cards selección */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="w-full max-w-sm space-y-4"
      >
        <p className="text-lt-white font-condensed text-xl text-center font-600">
          ¿Cómo quieres entrar?
        </p>

        {/* Hincha */}
        <button
          onClick={() => router.push(`/register/hincha${cbParam}`)}
          className="w-full bg-lt-card border border-lt-muted rounded-card p-5 text-left group hover:border-lt-green/50 hover:bg-lt-card2 transition-all active:scale-[0.98]"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">⚽</span>
                <span className="font-bebas text-2xl text-lt-green">SOY HINCHA</span>
              </div>
              <p className="text-lt-muted2 text-sm font-barlow leading-snug">
                Juega trivia, compite en ligas y acumula puntos canjeables
              </p>
            </div>
            <span className="text-lt-green text-xl group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </button>

        {/* Negocio */}
        <button
          onClick={() => router.push(`/register/negocio${cbParam}`)}
          className="w-full bg-lt-card border border-lt-muted rounded-card p-5 text-left group hover:border-lt-amber/50 hover:bg-lt-card2 transition-all active:scale-[0.98]"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">🏟️</span>
                <span className="font-bebas text-2xl text-lt-amber">SOY NEGOCIO</span>
              </div>
              <p className="text-lt-muted2 text-sm font-barlow leading-snug">
                Crea tu liga, fideliza clientes y llena tu local los días de partido
              </p>
            </div>
            <span className="text-lt-amber text-xl group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </button>

        <div className="text-center pt-2">
          <button
            onClick={() => router.push(`/login${cbParam}`)}
            className="text-lt-muted2 font-condensed text-sm hover:text-lt-white transition-colors"
          >
            Ya tengo cuenta → Iniciar sesión
          </button>
        </div>
      </motion.div>
    </div>
  )
}
