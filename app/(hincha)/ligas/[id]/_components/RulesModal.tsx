'use client'
import { useState } from 'react'

interface Props {
  scoringMode: 'FIXED' | 'POOL'
  pointsExample?: number
}

export function RulesButton({ scoringMode, pointsExample = 10 }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-btn bg-lt-card2 border border-lt-muted/30 text-lt-muted2 font-condensed text-sm font-700 hover:bg-lt-card2/80 hover:text-lt-white active:scale-[0.98] transition-all"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4M12 8h.01" />
        </svg>
        Reglas de la liga
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 animate-fade-in"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-lt-dark border border-[rgba(255,255,255,0.1)] rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[85vh] overflow-y-auto animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-lt-dark border-b border-[rgba(255,255,255,0.07)] px-5 py-4 flex items-center justify-between">
              <h2 className="font-bebas text-2xl text-lt-white tracking-wide">Reglas de la Liga</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-lt-muted2 hover:text-lt-white transition-colors p-1"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-5 py-5 space-y-6">
              {/* Cómo jugar */}
              <section>
                <h3 className="font-condensed text-sm font-700 uppercase tracking-wider text-lt-green mb-3">
                  ¿Cómo jugar?
                </h3>
                <div className="space-y-2 text-lt-muted2 font-barlow text-sm leading-relaxed">
                  <p>1. Entra a un partido desde la pestaña <span className="text-lt-white font-600">Partidos</span></p>
                  <p>2. Responde las preguntas de predicción <span className="text-lt-white font-600">antes</span> de que se cierren</p>
                  <p>3. Puedes cambiar tu respuesta mientras la pregunta esté abierta</p>
                  <p>4. Una vez resuelta la pregunta, se asignan los puntos automáticamente</p>
                </div>
              </section>

              {/* Modo de puntaje */}
              <section>
                <h3 className="font-condensed text-sm font-700 uppercase tracking-wider text-lt-green mb-3">
                  Sistema de puntos: {scoringMode === 'POOL' ? 'Pozo' : 'Puntaje fijo'}
                </h3>

                {scoringMode === 'FIXED' ? (
                  <div className="space-y-3">
                    <div className="bg-lt-card2 rounded-card p-4 border border-[rgba(255,255,255,0.05)]">
                      <p className="text-lt-white font-barlow text-sm leading-relaxed">
                        Cada pregunta tiene un valor fijo de puntos. Si respondes correctamente,
                        ganas <span className="text-lt-green font-700">todos los puntos</span> de esa pregunta,
                        sin importar cuántos otros jugadores también acierten.
                      </p>
                    </div>

                    <div className="bg-lt-card2 rounded-card p-4 border border-[rgba(255,255,255,0.05)]">
                      <p className="text-lt-muted2 font-condensed text-xs uppercase tracking-wider mb-2">Ejemplo</p>
                      <div className="space-y-1 text-sm font-barlow">
                        <p className="text-lt-muted2">Pregunta vale: <span className="text-lt-white font-600">{pointsExample} pts</span></p>
                        <p className="text-lt-muted2">10 jugadores participan, 6 aciertan</p>
                        <p className="text-lt-green font-600 mt-2">→ Cada ganador recibe {pointsExample} pts</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-lt-card2 rounded-card p-4 border border-[rgba(255,255,255,0.05)]">
                      <p className="text-lt-white font-barlow text-sm leading-relaxed">
                        Los puntos de <span className="text-lt-green font-700">todos los participantes</span> se
                        acumulan en un pozo. Los que aciertan se reparten el pozo en partes iguales.
                        Mientras <span className="text-lt-amber font-600">menos personas acierten</span>, más puntos
                        gana cada ganador.
                      </p>
                    </div>

                    <div className="bg-lt-card2 rounded-card p-4 border border-[rgba(255,255,255,0.05)]">
                      <p className="text-lt-muted2 font-condensed text-xs uppercase tracking-wider mb-2">Ejemplo</p>
                      <div className="space-y-1 text-sm font-barlow">
                        <p className="text-lt-muted2">Pregunta vale: <span className="text-lt-white font-600">{pointsExample} pts</span></p>
                        <p className="text-lt-muted2">10 jugadores participan</p>
                        <p className="text-lt-muted2">Pozo total: <span className="text-lt-white font-600">{pointsExample * 10} pts</span> (10 × {pointsExample})</p>
                        <div className="border-t border-[rgba(255,255,255,0.05)] my-2" />
                        <p className="text-lt-muted2">Si aciertan 2 jugadores:</p>
                        <p className="text-lt-green font-600">→ Cada ganador recibe {(pointsExample * 10) / 2} pts</p>
                        <p className="text-lt-muted2 mt-1">Si aciertan 5 jugadores:</p>
                        <p className="text-lt-green font-600">→ Cada ganador recibe {(pointsExample * 10) / 5} pts</p>
                      </div>
                    </div>

                    <div className="bg-lt-amber/5 border border-lt-amber/20 rounded-card p-3">
                      <p className="text-lt-amber text-xs font-barlow leading-relaxed">
                        💡 <span className="font-600">Tip:</span> En modo pozo, arriesgar con una respuesta menos popular puede darte más puntos si aciertas.
                      </p>
                    </div>
                  </div>
                )}
              </section>

              {/* Clasificación */}
              <section>
                <h3 className="font-condensed text-sm font-700 uppercase tracking-wider text-lt-green mb-3">
                  Clasificación
                </h3>
                <div className="space-y-2 text-lt-muted2 font-barlow text-sm leading-relaxed">
                  <p>• Tu posición se determina por la <span className="text-lt-white font-600">suma total de puntos</span> obtenidos en todas las preguntas</p>
                  <p>• Puedes ver tu rendimiento <span className="text-lt-white font-600">por partido</span> o el acumulado general</p>
                  <p>• Las flechas <span className="text-lt-green">↑</span> <span className="text-lt-red">↓</span> indican si subiste o bajaste respecto al partido anterior</p>
                </div>
              </section>

              {/* XP */}
              <section>
                <h3 className="font-condensed text-sm font-700 uppercase tracking-wider text-lt-green mb-3">
                  Experiencia (XP)
                </h3>
                <div className="space-y-2 text-lt-muted2 font-barlow text-sm leading-relaxed">
                  <p>• Cada predicción correcta te da <span className="text-lt-white font-600">+10 XP</span></p>
                  <p>• Las respuestas en vivo dan <span className="text-lt-white font-600">+5 XP</span></p>
                  <p>• Juega varios días seguidos para mantener tu <span className="text-lt-amber font-600">racha</span> y ganar XP bonus</p>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
