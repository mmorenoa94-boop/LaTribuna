'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { QuestionRow } from './AddQuestionModal'

interface Props {
  question: QuestionRow
  leagueId: string
  onUpdated: (q: QuestionRow) => void
  onDeleted: (id: string) => void
  onEdit: (q: QuestionRow) => void
}

const STATUS_CONFIG = {
  PENDING:  { label: 'Pendiente', color: 'text-lt-muted2', bg: 'bg-lt-card2',          border: 'border-[rgba(255,255,255,0.07)]' },
  OPEN:     { label: 'Abierta',   color: 'text-lt-green',  bg: 'bg-lt-green/10',       border: 'border-lt-green/30' },
  CLOSED:   { label: 'Cerrada',   color: 'text-lt-amber',  bg: 'bg-lt-amber/10',       border: 'border-lt-amber/30' },
  RESOLVED: { label: 'Resuelta',  color: 'text-lt-muted2', bg: 'bg-[rgba(255,255,255,0.03)]', border: 'border-[rgba(255,255,255,0.05)]' },
} as const

const WINDOW_OPTIONS = [
  { label: '15s', secs: 15 },
  { label: '20s', secs: 20 },
  { label: '30s', secs: 30 },
  { label: '45s', secs: 45 },
  { label: '60s', secs: 60 },
]

export function QuestionItem({ question: q, leagueId, onUpdated, onDeleted, onEdit }: Props) {
  const [loading, setLoading] = useState(false)
  const [showOpenPicker, setShowOpenPicker] = useState(false)
  const [showResolvePicker, setShowResolvePicker] = useState(false)
  const [windowSecs, setWindowSecs] = useState(30)

  const cfg = STATUS_CONFIG[q.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.PENDING

  async function patchQuestion(body: object) {
    setLoading(true)
    try {
      const res = await fetch(`/api/leagues/${leagueId}/admin/questions/${q.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        const updated = await res.json()
        onUpdated(updated)
      }
    } finally {
      setLoading(false)
    }
  }

  async function deleteQuestion() {
    if (!confirm('¿Eliminar esta pregunta?')) return
    setLoading(true)
    try {
      await fetch(`/api/leagues/${leagueId}/admin/questions/${q.id}`, { method: 'DELETE' })
      onDeleted(q.id)
    } finally {
      setLoading(false)
    }
  }

  function timeLeftLabel() {
    if (!q.closedAt) return null
    const left = Math.max(0, Math.floor((new Date(q.closedAt).getTime() - Date.now()) / 1000))
    if (left <= 0) return null
    const m = Math.floor(left / 60)
    const s = left % 60
    return m > 0 ? `${m}m ${s}s` : `${s}s`
  }

  return (
    <motion.div
      layout
      className={cn('rounded-card border p-4 transition-colors', cfg.bg, cfg.border)}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className={cn('font-condensed text-xs font-700 uppercase tracking-wide', cfg.color)}>
              {cfg.label}
            </span>
            <span className="text-lt-muted2 font-condensed text-xs">
              {q.timing === 'PRE_MATCH' ? '⏰ Pre' : '🔴 Vivo'}
            </span>
            <span className="text-lt-muted2 font-condensed text-xs">·</span>
            <span className="text-lt-green font-condensed text-xs font-700">+{q.pointsValue} pts</span>
            {q._count.answers > 0 && (
              <>
                <span className="text-lt-muted2 font-condensed text-xs">·</span>
                <span className="text-lt-muted2 font-condensed text-xs">
                  {q._count.answers} resp.
                </span>
              </>
            )}
            {q.status === 'OPEN' && timeLeftLabel() && (
              <>
                <span className="text-lt-muted2 font-condensed text-xs">·</span>
                <span className="text-lt-green font-condensed text-xs animate-pulse">
                  ⏱ {timeLeftLabel()}
                </span>
              </>
            )}
          </div>
          <p className="font-condensed text-sm text-lt-white leading-snug">{q.text}</p>
          <div className="flex gap-1.5 mt-1.5 flex-wrap">
            {(q.options as string[]).map((opt, i) => (
              <span
                key={i}
                className={cn(
                  'font-condensed text-xs px-2 py-0.5 rounded-full',
                  q.correctAnswer === opt
                    ? 'bg-lt-green/20 text-lt-green'
                    : 'bg-lt-card2 text-lt-muted2'
                )}
              >
                {String.fromCharCode(65 + i)}. {opt}
                {q.correctAnswer === opt && ' ✓'}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      {q.status !== 'RESOLVED' && (
        <div className="flex gap-2 mt-3 flex-wrap">

          {/* PENDING actions */}
          {q.status === 'PENDING' && (
            <>
              {/* Open button */}
              {q.timing === 'LIVE' ? (
                <div className="relative">
                  <button
                    onClick={() => setShowOpenPicker((v) => !v)}
                    disabled={loading}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-btn bg-lt-green/15 border border-lt-green/40 text-lt-green font-condensed text-sm hover:bg-lt-green/25 transition-colors disabled:opacity-50"
                  >
                    ▶ Abrir
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={cn('transition-transform', showOpenPicker && 'rotate-180')}>
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  <AnimatePresence>
                    {showOpenPicker && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                        className="absolute top-full left-0 mt-1 bg-lt-card border border-[rgba(255,255,255,0.1)] rounded-card p-3 z-10 min-w-[180px]"
                      >
                        <p className="font-condensed text-xs text-lt-muted2 mb-2">Tiempo para responder:</p>
                        <div className="flex gap-1.5 flex-wrap mb-3">
                          {WINDOW_OPTIONS.map((w) => (
                            <button
                              key={w.secs} type="button"
                              onClick={() => setWindowSecs(w.secs)}
                              className={cn(
                                'px-2.5 py-1 rounded-btn font-condensed text-xs border transition-all',
                                windowSecs === w.secs
                                  ? 'bg-lt-green/20 border-lt-green text-lt-green'
                                  : 'bg-lt-card2 border-[rgba(255,255,255,0.07)] text-lt-muted2'
                              )}
                            >
                              {w.label}
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={() => { patchQuestion({ action: 'open', windowSecs }); setShowOpenPicker(false) }}
                          className="w-full py-2 bg-lt-green text-lt-black rounded-btn font-condensed text-sm font-700"
                        >
                          ¡Abrir ya!
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <button
                  onClick={() => patchQuestion({ action: 'open' })}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-btn bg-lt-green/15 border border-lt-green/40 text-lt-green font-condensed text-sm hover:bg-lt-green/25 transition-colors disabled:opacity-50"
                >
                  ▶ Abrir
                </button>
              )}

              <button
                onClick={() => onEdit(q)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-btn bg-lt-card2 border border-[rgba(255,255,255,0.07)] text-lt-muted2 font-condensed text-sm hover:text-lt-white transition-colors"
              >
                ✏️ Editar
              </button>
              <button
                onClick={deleteQuestion}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-2 rounded-btn bg-lt-red/10 border border-lt-red/30 text-lt-red font-condensed text-sm hover:bg-lt-red/20 transition-colors disabled:opacity-50"
              >
                🗑 Borrar
              </button>
            </>
          )}

          {/* OPEN actions */}
          {q.status === 'OPEN' && (
            <>
              <button
                onClick={() => patchQuestion({ action: 'close' })}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-2 rounded-btn bg-lt-amber/15 border border-lt-amber/40 text-lt-amber font-condensed text-sm hover:bg-lt-amber/25 transition-colors disabled:opacity-50"
              >
                ⏹ Cerrar ahora
              </button>
              <button
                onClick={() => onEdit(q)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-btn bg-lt-card2 border border-[rgba(255,255,255,0.07)] text-lt-muted2 font-condensed text-sm hover:text-lt-white transition-colors"
              >
                ✏️ Editar
              </button>
              <button
                onClick={deleteQuestion}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-2 rounded-btn bg-lt-red/10 border border-lt-red/30 text-lt-red font-condensed text-sm hover:bg-lt-red/20 transition-colors disabled:opacity-50"
              >
                🗑 Borrar
              </button>
            </>
          )}

          {/* CLOSED actions */}
          {q.status === 'CLOSED' && (
            <div className="relative w-full">
              {!showResolvePicker ? (
                <button
                  onClick={() => setShowResolvePicker(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-btn bg-lt-green/15 border border-lt-green/40 text-lt-green font-condensed text-sm hover:bg-lt-green/25 transition-colors"
                >
                  ✅ Seleccionar respuesta correcta
                </button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  className="bg-lt-card2 rounded-card p-3 border border-[rgba(255,255,255,0.07)]"
                >
                  <p className="font-condensed text-xs text-lt-muted2 mb-2 uppercase tracking-wide">
                    ¿Cuál fue la respuesta correcta?
                  </p>
                  <div className="flex flex-col gap-2">
                    {(q.options as string[]).map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => { patchQuestion({ action: 'resolve', correctAnswer: opt }); setShowResolvePicker(false) }}
                        disabled={loading}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-btn bg-lt-card border border-[rgba(255,255,255,0.07)] text-lt-white font-condensed text-sm hover:border-lt-green/40 hover:bg-lt-green/10 transition-all text-left"
                      >
                        <span className="w-6 h-6 rounded-full bg-lt-card2 flex items-center justify-center font-bebas text-xs text-lt-muted2 flex-shrink-0">
                          {String.fromCharCode(65 + i)}
                        </span>
                        {opt}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowResolvePicker(false)}
                    className="mt-2 text-lt-muted2 font-condensed text-xs hover:text-lt-white"
                  >
                    Cancelar
                  </button>
                </motion.div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Resolved state */}
      {q.status === 'RESOLVED' && q.correctAnswer && (
        <p className="font-condensed text-xs text-lt-green mt-2">
          ✅ Respuesta: <strong>{q.correctAnswer}</strong> · {q._count.answers} respuestas
        </p>
      )}
    </motion.div>
  )
}
