'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

export type QuestionType = 'WINNER' | 'SCORE' | 'YES_NO' | 'SCORER' | 'RANGE' | 'CUSTOM'
export type QuestionTiming = 'PRE_MATCH' | 'LIVE'

interface Props {
  leagueId: string
  matchId: string
  homeTeam: string
  awayTeam: string
  open: boolean
  onClose: () => void
  onCreated: (q: QuestionRow) => void
  editQuestion?: QuestionRow | null
}

export interface QuestionRow {
  id: string
  text: string
  type: QuestionType
  options: string[]
  pointsValue: number
  timing: QuestionTiming
  status: string
  orderIndex: number
  openAt: string | null
  closedAt: string | null
  resolvedAt: string | null
  correctAnswer: string | null
  winnersCount: number | null
  totalPot: number | null
  _count: { answers: number; predictions: number }
}

const TYPE_LABELS: Record<QuestionType, string> = {
  WINNER: '🏆 Ganador',
  SCORE: '⚽ Marcador',
  YES_NO: '✅ Sí / No',
  SCORER: '👟 Goleador',
  RANGE: '📊 Rango',
  CUSTOM: '✏️ Personalizada',
}

const POINTS_OPTIONS = [10, 15, 20, 25, 30, 40, 50]

function defaultOptions(type: QuestionType, home: string, away: string): string[] {
  switch (type) {
    case 'WINNER':  return [home, away, 'Empate']
    case 'YES_NO':  return ['Sí', 'No']
    default:        return ['', '']
  }
}

export function AddQuestionModal({
  leagueId, matchId, homeTeam, awayTeam, open, onClose, onCreated, editQuestion
}: Props) {
  const isEdit = !!editQuestion

  const [type, setType] = useState<QuestionType>('WINNER')
  const [text, setText] = useState('')
  const [options, setOptions] = useState<string[]>([homeTeam, awayTeam, 'Empate'])
  const [points, setPoints] = useState(20)
  const [timing, setTiming] = useState<QuestionTiming>('PRE_MATCH')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Load editQuestion values
  useEffect(() => {
    if (editQuestion) {
      setType(editQuestion.type)
      setText(editQuestion.text)
      setOptions([...editQuestion.options])
      setPoints(editQuestion.pointsValue)
      setTiming(editQuestion.timing)
    }
  }, [editQuestion])

  // Reset on close
  useEffect(() => {
    if (!open && !editQuestion) {
      setType('WINNER')
      setText('')
      setOptions(defaultOptions('WINNER', homeTeam, awayTeam))
      setPoints(20)
      setTiming('PRE_MATCH')
      setError('')
    }
  }, [open, editQuestion, homeTeam, awayTeam])

  // Update options when type changes (only for new questions)
  function handleTypeChange(t: QuestionType) {
    setType(t)
    if (!isEdit) setOptions(defaultOptions(t, homeTeam, awayTeam))
  }

  const yesNo = type === 'YES_NO'
  const winner = type === 'WINNER'

  function setOption(i: number, val: string) {
    setOptions((prev) => { const n = [...prev]; n[i] = val; return n })
  }
  function addOption() { setOptions((prev) => [...prev, '']) }
  function removeOption(i: number) {
    if (options.length <= 2) return
    setOptions((prev) => prev.filter((_, idx) => idx !== i))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) { setError('La pregunta no puede estar vacía'); return }
    const validOptions = options.map((o) => o.trim()).filter(Boolean)
    if (validOptions.length < 2) { setError('Agrega al menos 2 opciones'); return }

    setLoading(true)
    setError('')
    try {
      let res: Response
      if (isEdit && editQuestion) {
        res = await fetch(`/api/leagues/${leagueId}/admin/questions/${editQuestion.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'edit', text, options: validOptions, pointsValue: points, timing }),
        })
      } else {
        res = await fetch(`/api/leagues/${leagueId}/admin/questions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ matchId, text, type, options: validOptions, pointsValue: points, timing }),
        })
      }
      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? 'Error al guardar')
        return
      }
      const q = await res.json()
      onCreated(q)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 z-[60]"
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 350 }}
            className="fixed bottom-0 left-0 right-0 bg-lt-card rounded-t-2xl z-[70] flex flex-col max-h-[94vh]"
          >
            {/* Handle */}
            <div className="flex-shrink-0 flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-lt-muted" />
            </div>

            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between px-5 pb-3">
              <h2 className="font-bebas text-2xl text-lt-white tracking-wide">
                {isEdit ? 'Editar pregunta' : 'Nueva pregunta'}
              </h2>
              <button onClick={onClose} className="text-lt-muted2 hover:text-lt-white p-1">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-5 pb-6 flex flex-col gap-4">

              {/* Type selector (hidden on edit) */}
              {!isEdit && (
                <div>
                  <label className="block font-condensed text-xs text-lt-muted2 uppercase tracking-wide mb-2">
                    Tipo de pregunta
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(TYPE_LABELS) as QuestionType[]).map((t) => (
                      <button
                        key={t} type="button"
                        onClick={() => handleTypeChange(t)}
                        className={cn(
                          'py-2 px-2 rounded-btn border font-condensed text-xs transition-all',
                          type === t
                            ? 'bg-lt-green/15 border-lt-green text-lt-green'
                            : 'bg-lt-card2 border-[rgba(255,255,255,0.07)] text-lt-muted2 hover:border-lt-green/30'
                        )}
                      >
                        {TYPE_LABELS[t]}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Question text */}
              <div>
                <label className="block font-condensed text-xs text-lt-muted2 uppercase tracking-wide mb-1.5">
                  Pregunta *
                </label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={2}
                  placeholder={
                    type === 'WINNER' ? '¿Quién ganará el partido?' :
                    type === 'SCORE' ? '¿Cómo terminará el marcador?' :
                    type === 'YES_NO' ? '¿Habrá gol en los primeros 10 minutos?' :
                    type === 'SCORER' ? '¿Quién marcará el primer gol?' :
                    'Escribe la pregunta…'
                  }
                  className="w-full bg-lt-card2 border border-[rgba(255,255,255,0.07)] rounded-btn px-3 py-2.5 text-lt-white font-condensed text-sm placeholder:text-lt-muted focus:outline-none focus:border-lt-green/50 resize-none"
                />
              </div>

              {/* Options */}
              <div>
                <label className="block font-condensed text-xs text-lt-muted2 uppercase tracking-wide mb-2">
                  Opciones de respuesta
                </label>
                <div className="flex flex-col gap-2">
                  {options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-full bg-lt-card2 flex items-center justify-center font-bebas text-sm text-lt-muted2 flex-shrink-0">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <input
                        value={opt}
                        onChange={(e) => setOption(i, e.target.value)}
                        disabled={yesNo}
                        placeholder={`Opción ${String.fromCharCode(65 + i)}`}
                        className="flex-1 bg-lt-card2 border border-[rgba(255,255,255,0.07)] rounded-btn px-3 py-2.5 text-lt-white font-condensed text-sm placeholder:text-lt-muted focus:outline-none focus:border-lt-green/50 disabled:opacity-40 disabled:cursor-default"
                      />
                      {!yesNo && !winner && options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeOption(i)}
                          className="text-lt-muted2 hover:text-lt-red transition-colors p-1"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {!yesNo && !winner && options.length < 6 && (
                  <button
                    type="button"
                    onClick={addOption}
                    className="mt-2 text-lt-green font-condensed text-sm flex items-center gap-1.5 hover:text-lt-white transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Agregar opción
                  </button>
                )}
              </div>

              {/* Points */}
              <div>
                <label className="block font-condensed text-xs text-lt-muted2 uppercase tracking-wide mb-2">
                  Puntos por acertar
                </label>
                <div className="flex gap-2 flex-wrap">
                  {POINTS_OPTIONS.map((p) => (
                    <button
                      key={p} type="button"
                      onClick={() => setPoints(p)}
                      className={cn(
                        'px-4 py-2 rounded-btn border font-condensed text-sm font-700 transition-all',
                        points === p
                          ? 'bg-lt-green/15 border-lt-green text-lt-green'
                          : 'bg-lt-card2 border-[rgba(255,255,255,0.07)] text-lt-muted2 hover:border-lt-green/30'
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Timing */}
              <div>
                <label className="block font-condensed text-xs text-lt-muted2 uppercase tracking-wide mb-2">
                  ¿Cuándo se responde?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(['PRE_MATCH', 'LIVE'] as QuestionTiming[]).map((t) => (
                    <button
                      key={t} type="button"
                      onClick={() => setTiming(t)}
                      className={cn(
                        'py-3 rounded-btn border font-condensed text-sm transition-all text-left px-4',
                        timing === t
                          ? 'bg-lt-green/15 border-lt-green'
                          : 'bg-lt-card2 border-[rgba(255,255,255,0.07)] hover:border-lt-green/30'
                      )}
                    >
                      <p className={cn('font-700', timing === t ? 'text-lt-green' : 'text-lt-white')}>
                        {t === 'PRE_MATCH' ? '⏰ Pre-partido' : '🔴 En vivo'}
                      </p>
                      <p className="text-lt-muted2 text-xs mt-0.5">
                        {t === 'PRE_MATCH' ? 'Antes del pitazo inicial' : 'Durante el partido'}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <p className="font-condensed text-sm text-lt-red bg-lt-red/10 border border-lt-red/30 rounded-btn px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-btn bg-lt-green text-lt-black font-condensed text-base font-700 disabled:opacity-50 active:scale-[0.98] transition-all"
                style={{ marginBottom: 'max(1.5rem, env(safe-area-inset-bottom, 0px))' }}
              >
                {loading ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear pregunta'}
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
