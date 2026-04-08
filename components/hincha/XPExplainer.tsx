'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

const XP_ITEMS = [
  { action: 'Respuesta correcta (en vivo)', xp: 5, icon: '⚡' },
  { action: 'Predicción correcta (pre-partido)', xp: 10, icon: '🎯' },
  { action: 'Racha de 3+ días', xp: 10, icon: '🔥' },
  { action: 'Racha de 7+ días', xp: 20, icon: '🔥' },
  { action: 'Racha de 14+ días', xp: 30, icon: '🔥' },
  { action: 'Racha de 30+ días', xp: 50, icon: '🔥' },
]

const LEVELS_PREVIEW = [
  { level: 1, xp: 0 },
  { level: 2, xp: 100 },
  { level: 3, xp: 300 },
  { level: 5, xp: 1000 },
  { level: 10, xp: 5200 },
  { level: 15, xp: 14500 },
  { level: 20, xp: 36000 },
]

export function XPExplainer() {
  const [open, setOpen] = useState(false)

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-lt-muted2 font-condensed text-[11px] hover:text-lt-green transition-colors mt-1"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4M12 8h.01" />
        </svg>
        ¿Cómo gano XP y subo de nivel?
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          className={cn('transition-transform', open && 'rotate-180')}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-3 bg-lt-card rounded-card border border-[rgba(255,255,255,0.07)] p-4 space-y-4">
              {/* How to earn XP */}
              <div>
                <p className="text-lt-green font-condensed text-xs font-700 uppercase tracking-wider mb-2">
                  Cómo ganar XP
                </p>
                <div className="space-y-1.5">
                  {XP_ITEMS.map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-lt-white font-condensed text-xs">
                        {item.icon} {item.action}
                      </span>
                      <span className="text-lt-green font-condensed text-xs font-700">
                        +{item.xp} XP
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Levels */}
              <div>
                <p className="text-lt-green font-condensed text-xs font-700 uppercase tracking-wider mb-2">
                  Niveles
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {LEVELS_PREVIEW.map((l) => (
                    <span
                      key={l.level}
                      className="bg-lt-card2 rounded-btn px-2 py-1 font-condensed text-[10px] text-lt-muted2"
                    >
                      Nv.{l.level} = {l.xp.toLocaleString()} XP
                    </span>
                  ))}
                </div>
              </div>

              <p className="text-lt-muted2 font-condensed text-[10px] leading-relaxed">
                Juega todos los días para mantener tu racha y ganar XP bonus.
                A mayor nivel, más prestigio en las clasificaciones.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
