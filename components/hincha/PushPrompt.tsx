'use client'
import { useState } from 'react'
import { usePushSubscription } from '@/hooks/usePushSubscription'

export function PushPrompt() {
  const { state, subscribe, subscribing, lastError } = usePushSubscription()
  const [dismissed, setDismissed] = useState(false)

  // Only show for users who haven't decided yet
  if (state !== 'prompt' && state !== 'unsubscribed' && state !== 'ios-needs-install') return null
  if (dismissed) return null

  // iOS users need to install the PWA first
  if (state === 'ios-needs-install') {
    return (
      <div className="bg-lt-card rounded-card border border-lt-amber/20 p-4 animate-fade-in">
        <div className="flex items-start gap-3">
          <span className="text-2xl flex-shrink-0">📲</span>
          <div className="flex-1 min-w-0">
            <p className="font-condensed text-sm font-700 text-lt-white">
              Instala La Tribuna
            </p>
            <p className="text-lt-muted2 font-barlow text-xs mt-0.5 leading-snug">
              Para recibir notificaciones en iPhone, agrega la app a tu pantalla de inicio:
              pulsa <span className="text-lt-white">Compartir</span> → <span className="text-lt-white">Agregar a pantalla de inicio</span>
            </p>
            <button
              onClick={() => setDismissed(true)}
              className="mt-2 px-3 py-1.5 rounded-btn text-lt-muted2 font-condensed text-xs hover:text-lt-white transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-lt-card rounded-card border border-lt-green/20 p-4 animate-fade-in">
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">🔔</span>
        <div className="flex-1 min-w-0">
          <p className="font-condensed text-sm font-700 text-lt-white">
            Activa las notificaciones
          </p>
          <p className="text-lt-muted2 font-barlow text-xs mt-0.5 leading-snug">
            Recibe alertas cuando abran preguntas, promociones y resultados de tus ligas.
          </p>
          {lastError && (
            <p className="text-red-400 font-barlow text-xs mt-1 break-words">
              Error: {lastError}
            </p>
          )}
          <div className="flex gap-2 mt-3">
            <button
              onClick={async () => {
                await subscribe()
              }}
              disabled={subscribing}
              className="px-4 py-2 rounded-btn bg-lt-green text-lt-black font-condensed text-sm font-700 active:scale-95 transition-all disabled:opacity-50"
            >
              {subscribing ? 'Activando...' : lastError ? 'Reintentar' : 'Activar'}
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="px-4 py-2 rounded-btn text-lt-muted2 font-condensed text-sm hover:text-lt-white transition-colors"
            >
              Ahora no
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
