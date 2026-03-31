'use client'
import { useState } from 'react'
import { usePushSubscription } from '@/hooks/usePushSubscription'

export function PushPrompt() {
  const { state, subscribe, subscribing } = usePushSubscription()
  const [dismissed, setDismissed] = useState(false)

  // Only show for users who haven't decided yet
  if (state !== 'prompt' && state !== 'unsubscribed') return null
  if (dismissed) return null

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
          <div className="flex gap-2 mt-3">
            <button
              onClick={async () => {
                await subscribe()
              }}
              disabled={subscribing}
              className="px-4 py-2 rounded-btn bg-lt-green text-lt-black font-condensed text-sm font-700 active:scale-95 transition-all disabled:opacity-50"
            >
              {subscribing ? 'Activando...' : 'Activar'}
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
