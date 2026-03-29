'use client'
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { ImportMatchesModal } from '@/app/(hincha)/ligas/[id]/admin/_components/ImportMatchesModal'
import { GenerateQuestionsModal } from '@/app/(hincha)/ligas/[id]/admin/_components/GenerateQuestionsModal'
import type { QuestionRow } from '@/app/(hincha)/ligas/[id]/admin/_components/AddQuestionModal'

interface MatchData {
  id: string
  homeTeam: string
  awayTeam: string
  competition: string
  venue: string | null
  kickoffAt: string
  status: string
  homeScore: number | null
  awayScore: number | null
  questionCount: number
}

interface QuestionData {
  id: string
  text: string
  type: string
  options: string[]
  pointsValue: number
  timing: string
  status: string
  correctAnswer: string | null
  closedAt: string | null
  _count: { answers: number }
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  SCHEDULED: { label: 'Programado', color: 'text-lt-muted2' },
  LIVE:      { label: 'En vivo',    color: 'text-lt-red' },
  HALFTIME:  { label: 'Descanso',   color: 'text-lt-amber' },
  FINISHED:  { label: 'Finalizado', color: 'text-lt-muted2' },
  CANCELLED: { label: 'Cancelado',  color: 'text-lt-red' },
}

const Q_STATUS: Record<string, { label: string; color: string; bg: string; border: string }> = {
  PENDING:  { label: 'Pendiente', color: 'text-lt-muted2', bg: 'bg-lt-card2',                     border: 'border-[rgba(255,255,255,0.07)]' },
  OPEN:     { label: 'Abierta',   color: 'text-lt-green',  bg: 'bg-lt-green/10',                  border: 'border-lt-green/30' },
  CLOSED:   { label: 'Cerrada',   color: 'text-lt-amber',  bg: 'bg-lt-amber/10',                  border: 'border-lt-amber/30' },
  RESOLVED: { label: 'Resuelta',  color: 'text-lt-muted2', bg: 'bg-[rgba(255,255,255,0.03)]',     border: 'border-[rgba(255,255,255,0.05)]' },
}

const QUESTION_TYPES = [
  { value: 'WINNER',  label: '🏆 Ganador' },
  { value: 'SCORE',   label: '⚽ Marcador' },
  { value: 'SCORER',  label: '👟 Goleador' },
  { value: 'YES_NO',  label: '✅ Sí / No' },
  { value: 'RANGE',   label: '📊 Rango' },
  { value: 'CUSTOM',  label: '✏️ Personalizada' },
]

const Q_TYPE_LABEL: Record<string, string> = {
  WINNER: '🏆 Ganador', SCORE: '⚽ Marcador', SCORER: '👟 Goleador',
  YES_NO: '✅ Sí/No', RANGE: '📊 Rango', CUSTOM: '✏️ Personalizada',
}

const PLACEHOLDER: Record<string, string> = {
  WINNER: '¿Quién ganará el partido?',
  SCORE:  '¿Cómo terminará el marcador?',
  YES_NO: '¿Habrá gol en los primeros 10 minutos?',
  SCORER: '¿Quién marcará el primer gol?',
}

const TIMING_OPTIONS = [
  { value: 'PRE_MATCH', label: '⏱️ Pre-partido' },
  { value: 'LIVE', label: '🔴 En vivo' },
]

const WINDOW_OPTIONS = [
  { label: '15s', secs: 15 },
  { label: '20s', secs: 20 },
  { label: '30s', secs: 30 },
  { label: '45s', secs: 45 },
  { label: '60s', secs: 60 },
]

function defaultOptions(type: string, home: string, away: string): string[] {
  switch (type) {
    case 'WINNER':  return [home, away, 'Empate']
    case 'YES_NO':  return ['Sí', 'No']
    default:        return ['', '']
  }
}

export function MatchesTab({ leagueId }: { leagueId: string }) {
  const [matches, setMatches] = useState<MatchData[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showImportCSV, setShowImportCSV] = useState(false)
  const [selectedMatch, setSelectedMatch] = useState<MatchData | null>(null)

  const fetchMatches = useCallback(async () => {
    const res = await fetch(`/api/leagues/${leagueId}/admin/matches`)
    if (res.ok) setMatches(await res.json())
    setLoading(false)
  }, [leagueId])

  useEffect(() => { fetchMatches() }, [fetchMatches])

  if (selectedMatch) {
    return (
      <MatchDetail
        leagueId={leagueId}
        match={selectedMatch}
        onBack={() => { setSelectedMatch(null); fetchMatches() }}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={() => setShowImportCSV(true)}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-btn bg-lt-card2 border border-[rgba(255,255,255,0.07)] text-lt-muted2 hover:text-lt-white font-condensed text-sm font-700 active:scale-95 transition-all"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          CSV
        </button>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-btn bg-lt-amber text-lt-black font-condensed text-sm font-700 active:scale-[0.97] transition-all"
        >
          <span className="text-lg leading-none">+</span>
          Agregar partido
        </button>
      </div>

      {showForm && (
        <AddMatchForm
          leagueId={leagueId}
          onCreated={(m) => { setMatches((prev) => [...prev, m]); setShowForm(false) }}
          onCancel={() => setShowForm(false)}
        />
      )}

      <ImportMatchesModal
        leagueId={leagueId}
        open={showImportCSV}
        onClose={() => setShowImportCSV(false)}
        onImported={(imported) => { setMatches((prev) => [...prev, ...imported.map((m) => ({ ...m, questionCount: 0 }))]); setShowImportCSV(false) }}
      />

      {loading ? (
        <div className="text-center py-8">
          <span className="w-6 h-6 border-2 border-lt-amber/30 border-t-lt-amber rounded-full animate-spin inline-block" />
        </div>
      ) : matches.length === 0 ? (
        <div className="bg-lt-card rounded-card border border-[rgba(255,255,255,0.07)] p-8 text-center">
          <span className="text-3xl block mb-2">⚽</span>
          <p className="font-condensed text-sm text-lt-muted2">Sin partidos. Agrega el primer partido para crear preguntas.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {matches.map((match) => {
            const st = STATUS_LABEL[match.status] ?? { label: match.status, color: 'text-lt-muted2' }
            return (
              <button
                key={match.id}
                onClick={() => setSelectedMatch(match)}
                className="w-full bg-lt-card rounded-card border border-[rgba(255,255,255,0.07)] p-4 text-left hover:border-lt-amber/30 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-condensed text-xs text-lt-muted2">{match.competition}</span>
                  <span className={cn('font-condensed text-xs font-700', st.color)}>
                    {match.status === 'LIVE' && <span className="inline-block w-1.5 h-1.5 rounded-full bg-lt-red animate-pulse-dot mr-1" />}
                    {st.label}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-condensed text-sm text-lt-white font-600">{match.homeTeam}</p>
                    <p className="font-condensed text-sm text-lt-white font-600">{match.awayTeam}</p>
                  </div>
                  {match.homeScore !== null && (
                    <div className="text-right mr-4">
                      <p className="font-bebas text-lg text-lt-white">{match.homeScore}</p>
                      <p className="font-bebas text-lg text-lt-white">{match.awayScore}</p>
                    </div>
                  )}
                  <div className="text-right flex-shrink-0">
                    <p className="font-condensed text-xs text-lt-muted2">
                      {new Date(match.kickoffAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                    </p>
                    <p className="font-condensed text-xs text-lt-muted2">
                      {new Date(match.kickoffAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Bogota' })}
                    </p>
                    <p className="font-condensed text-xs text-lt-amber mt-1">{match.questionCount} preg.</p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Add Match Form ─────────────────────────────────────────────
function AddMatchForm({
  leagueId, onCreated, onCancel,
}: {
  leagueId: string
  onCreated: (m: MatchData) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState({ homeTeam: '', awayTeam: '', competition: '', venue: '', kickoffAt: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const inputCls = 'w-full bg-lt-card2 border border-lt-muted rounded-btn px-4 py-3 text-lt-white font-barlow text-sm focus:outline-none focus:border-lt-amber transition-colors placeholder:text-lt-muted2'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.homeTeam.trim() || !form.awayTeam.trim() || !form.competition.trim() || !form.kickoffAt) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/leagues/${leagueId}/admin/matches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error')
      onCreated(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-lt-card rounded-card border border-lt-amber/20 p-4 space-y-3">
      <p className="font-condensed text-sm text-lt-amber font-700">Nuevo partido</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-lt-white font-condensed text-xs mb-1">Local <span className="text-lt-red">*</span></label>
          <input type="text" value={form.homeTeam} onChange={(e) => setForm((f) => ({ ...f, homeTeam: e.target.value }))} placeholder="Ej: Millonarios" className={inputCls} />
        </div>
        <div>
          <label className="block text-lt-white font-condensed text-xs mb-1">Visitante <span className="text-lt-red">*</span></label>
          <input type="text" value={form.awayTeam} onChange={(e) => setForm((f) => ({ ...f, awayTeam: e.target.value }))} placeholder="Ej: Nacional" className={inputCls} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-lt-white font-condensed text-xs mb-1">Competencia <span className="text-lt-red">*</span></label>
          <input type="text" value={form.competition} onChange={(e) => setForm((f) => ({ ...f, competition: e.target.value }))} placeholder="Liga BetPlay" className={inputCls} />
        </div>
        <div>
          <label className="block text-lt-white font-condensed text-xs mb-1">Venue <span className="text-lt-muted2">(opc.)</span></label>
          <input type="text" value={form.venue} onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value }))} placeholder="El Campín" className={inputCls} />
        </div>
      </div>
      <div>
        <label className="block text-lt-white font-condensed text-xs mb-1">Fecha y hora <span className="text-lt-red">*</span></label>
        <input type="datetime-local" value={form.kickoffAt} onChange={(e) => setForm((f) => ({ ...f, kickoffAt: e.target.value }))} className={inputCls} />
      </div>
      {error && <p className="text-lt-red text-xs font-condensed">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-btn bg-lt-amber text-lt-black font-condensed text-sm font-700 disabled:opacity-40">
          {saving ? 'Creando...' : 'Crear partido'}
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2.5 rounded-btn border border-lt-muted text-lt-muted2 font-condensed text-sm">
          Cancelar
        </button>
      </div>
    </form>
  )
}

// ── Match Detail (Questions) ──────────────────────────────────
function MatchDetail({ leagueId, match, onBack }: { leagueId: string; match: MatchData; onBack: () => void }) {
  const [questions, setQuestions] = useState<QuestionData[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showGenerate, setShowGenerate] = useState(false)

  const fetchQuestions = useCallback(async () => {
    const res = await fetch(`/api/leagues/${leagueId}/admin/questions?matchId=${match.id}`)
    if (res.ok) setQuestions(await res.json())
    setLoading(false)
  }, [leagueId, match.id])

  useEffect(() => {
    fetchQuestions()
    const interval = setInterval(fetchQuestions, 10_000)
    return () => clearInterval(interval)
  }, [fetchQuestions])

  function handleQuestionUpdated(updated: QuestionData) {
    setQuestions((prev) => prev.map((q) => (q.id === updated.id ? updated : q)))
  }

  function handleQuestionDeleted(id: string) {
    setQuestions((prev) => prev.filter((q) => q.id !== id))
  }

  const pendingCount = questions.filter((q) => q.status === 'PENDING').length
  const openCount = questions.filter((q) => q.status === 'OPEN').length

  async function bulkAction(action: 'open' | 'close') {
    const targets = questions.filter((q) =>
      action === 'open' ? q.status === 'PENDING' : q.status === 'OPEN'
    )
    for (const q of targets) {
      try {
        const res = await fetch(`/api/leagues/${leagueId}/admin/questions/${q.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action }),
        })
        if (res.ok) {
          const updated = await res.json()
          handleQuestionUpdated(updated)
        }
      } catch { /* ignore */ }
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-lt-muted2 hover:text-lt-white transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-lt-muted2 text-xs font-condensed">{match.competition}</p>
          <p className="text-lt-white font-condensed text-base font-700 truncate">
            {match.homeTeam} vs {match.awayTeam}
          </p>
          <p className="text-lt-muted2 text-xs font-condensed">
            {new Date(match.kickoffAt).toLocaleString('es-CO', {
              weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'America/Bogota',
            })}
          </p>
        </div>
      </div>

      {/* Bulk actions + stats */}
      {questions.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-condensed text-xs text-lt-muted2">
            {questions.length} preguntas
          </span>
          {pendingCount > 0 && (
            <>
              <span className="text-lt-muted2">·</span>
              <span className="font-condensed text-xs text-lt-muted2">{pendingCount} pendientes</span>
              <button
                onClick={() => bulkAction('open')}
                className="px-2.5 py-1 rounded-btn bg-lt-green/15 border border-lt-green/30 text-lt-green font-condensed text-xs hover:bg-lt-green/25 transition-colors"
              >
                ▶ Abrir todas
              </button>
            </>
          )}
          {openCount > 0 && (
            <>
              <span className="text-lt-muted2">·</span>
              <span className="font-condensed text-xs text-lt-green">{openCount} abiertas</span>
              <button
                onClick={() => bulkAction('close')}
                className="px-2.5 py-1 rounded-btn bg-lt-amber/15 border border-lt-amber/30 text-lt-amber font-condensed text-xs hover:bg-lt-amber/25 transition-colors"
              >
                ⏹ Cerrar todas
              </button>
            </>
          )}
        </div>
      )}

      {/* Add question */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowGenerate(true)}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-btn bg-lt-amber/15 border border-lt-amber/40 text-lt-amber font-condensed text-sm font-700 active:scale-95 transition-all"
          title="Generar preguntas desde plantilla"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          Generar
        </button>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-btn bg-lt-amber text-lt-black font-condensed text-sm font-700 active:scale-[0.97] transition-all"
        >
          <span className="text-lg leading-none">+</span>
          Nueva pregunta
        </button>
      </div>

      {showForm && (
        <AddQuestionForm
          leagueId={leagueId}
          matchId={match.id}
          homeTeam={match.homeTeam}
          awayTeam={match.awayTeam}
          onCreated={(q) => { setQuestions((prev) => [...prev, q]); setShowForm(false) }}
          onCancel={() => setShowForm(false)}
        />
      )}

      <GenerateQuestionsModal
        leagueId={leagueId}
        matchId={match.id}
        homeTeam={match.homeTeam}
        awayTeam={match.awayTeam}
        open={showGenerate}
        onClose={() => setShowGenerate(false)}
        onGenerated={(qs: QuestionRow[]) => {
          setQuestions(qs.map((q) => ({
            id: q.id,
            text: q.text,
            type: q.type,
            options: q.options as string[],
            pointsValue: q.pointsValue,
            timing: q.timing,
            status: q.status,
            correctAnswer: q.correctAnswer,
            closedAt: q.closedAt,
            _count: q._count,
          })))
          setShowGenerate(false)
        }}
      />

      {/* Questions list */}
      {loading ? (
        <div className="text-center py-8">
          <span className="w-6 h-6 border-2 border-lt-amber/30 border-t-lt-amber rounded-full animate-spin inline-block" />
        </div>
      ) : questions.length === 0 ? (
        <div className="bg-lt-card rounded-card border border-[rgba(255,255,255,0.07)] p-8 text-center">
          <span className="text-3xl block mb-2">❓</span>
          <p className="font-condensed text-sm text-lt-muted2">Sin preguntas. Crea la primera para este partido.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {questions.map((q, i) => (
            <QuestionCard
              key={q.id}
              question={q}
              index={i}
              leagueId={leagueId}
              onUpdated={handleQuestionUpdated}
              onDeleted={handleQuestionDeleted}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Question Card with lifecycle actions ──────────────────────
function QuestionCard({
  question: q, index, leagueId, onUpdated, onDeleted,
}: {
  question: QuestionData
  index: number
  leagueId: string
  onUpdated: (q: QuestionData) => void
  onDeleted: (id: string) => void
}) {
  const [loading, setLoading] = useState(false)
  const [showOpenPicker, setShowOpenPicker] = useState(false)
  const [showResolvePicker, setShowResolvePicker] = useState(false)
  const [windowSecs, setWindowSecs] = useState(30)

  const cfg = Q_STATUS[q.status] ?? Q_STATUS.PENDING

  async function patchQuestion(body: object) {
    setLoading(true)
    try {
      const res = await fetch(`/api/leagues/${leagueId}/admin/questions/${q.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) onUpdated(await res.json())
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
    <div className={cn('rounded-card border p-4 transition-colors', cfg.bg, cfg.border)}>
      {/* Top row: metadata */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="font-condensed text-xs text-lt-muted2 flex-shrink-0">#{index + 1}</span>
          <span className={cn('font-condensed text-xs font-700 uppercase tracking-wide', cfg.color)}>
            {cfg.label}
          </span>
          <span className="text-lt-muted2 font-condensed text-xs">
            {q.timing === 'LIVE' ? '🔴 Vivo' : '⏱️ Pre'}
          </span>
          <span className="text-lt-amber font-condensed text-xs font-700">+{q.pointsValue} pts</span>
          {q._count.answers > 0 && (
            <span className="text-lt-muted2 font-condensed text-xs">{q._count.answers} resp.</span>
          )}
          {q.status === 'OPEN' && timeLeftLabel() && (
            <span className="text-lt-green font-condensed text-xs animate-pulse">⏱ {timeLeftLabel()}</span>
          )}
        </div>
        <span className="text-lt-muted2 font-condensed text-xs flex-shrink-0">
          {Q_TYPE_LABEL[q.type] ?? q.type}
        </span>
      </div>

      {/* Question text */}
      <p className="font-condensed text-sm text-lt-white leading-snug mb-2">{q.text}</p>

      {/* Options */}
      <div className="flex flex-wrap gap-1.5 mb-3">
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

      {/* Actions by status */}
      {q.status === 'PENDING' && (
        <div className="flex gap-2 flex-wrap">
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
            onClick={deleteQuestion}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-btn bg-lt-red/10 border border-lt-red/30 text-lt-red font-condensed text-sm hover:bg-lt-red/20 transition-colors disabled:opacity-50"
          >
            🗑 Borrar
          </button>
        </div>
      )}

      {q.status === 'OPEN' && (
        <button
          onClick={() => patchQuestion({ action: 'close' })}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-btn bg-lt-amber/15 border border-lt-amber/40 text-lt-amber font-condensed text-sm hover:bg-lt-amber/25 transition-colors disabled:opacity-50"
        >
          ⏹ Cerrar ahora
        </button>
      )}

      {q.status === 'CLOSED' && (
        <div className="w-full">
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

      {q.status === 'RESOLVED' && q.correctAnswer && (
        <p className="font-condensed text-xs text-lt-green">
          ✅ Respuesta: <strong>{q.correctAnswer}</strong> · {q._count.answers} respuestas
        </p>
      )}
    </div>
  )
}

// ── Add Question Form ─────────────────────────────────────────
function AddQuestionForm({
  leagueId, matchId, homeTeam, awayTeam, onCreated, onCancel,
}: {
  leagueId: string
  matchId: string
  homeTeam: string
  awayTeam: string
  onCreated: (q: QuestionData) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState({
    text: '',
    type: 'WINNER',
    timing: 'PRE_MATCH',
    pointsValue: 20,
    options: defaultOptions('WINNER', homeTeam, awayTeam),
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const inputCls = 'w-full bg-lt-card2 border border-lt-muted rounded-btn px-4 py-3 text-lt-white font-barlow text-sm focus:outline-none focus:border-lt-amber transition-colors placeholder:text-lt-muted2'

  function changeType(type: string) {
    setForm((f) => ({
      ...f,
      type,
      options: defaultOptions(type, homeTeam, awayTeam),
    }))
  }

  function addOption() {
    setForm((f) => ({ ...f, options: [...f.options, ''] }))
  }

  function removeOption(index: number) {
    if (form.options.length <= 2) return
    setForm((f) => ({ ...f, options: f.options.filter((_, i) => i !== index) }))
  }

  function updateOption(index: number, value: string) {
    setForm((f) => ({ ...f, options: f.options.map((o, i) => (i === index ? value : o)) }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validOptions = form.options.filter((o) => o.trim())
    if (!form.text.trim() || validOptions.length < 2) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/leagues/${leagueId}/admin/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId,
          text: form.text,
          type: form.type,
          timing: form.timing,
          pointsValue: form.pointsValue,
          options: validOptions,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error')
      onCreated(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error')
      setSaving(false)
    }
  }

  const placeholder = PLACEHOLDER[form.type] ?? 'Escribe la pregunta…'

  return (
    <form onSubmit={handleSubmit} className="bg-lt-card rounded-card border border-lt-amber/20 p-4 space-y-4">
      <p className="font-condensed text-sm text-lt-amber font-700">Nueva pregunta</p>

      {/* Type */}
      <div>
        <label className="block text-lt-white font-condensed text-xs mb-1.5">Tipo de pregunta</label>
        <div className="grid grid-cols-3 gap-1.5">
          {QUESTION_TYPES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => changeType(value)}
              className={cn(
                'py-2 px-2 rounded-btn border font-condensed text-xs font-600 transition-all',
                form.type === value
                  ? 'bg-lt-amber/20 border-lt-amber text-lt-amber'
                  : 'bg-lt-card2 border-lt-muted text-lt-white hover:border-lt-amber/30'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Text */}
      <div>
        <label className="block text-lt-white font-condensed text-xs mb-1">Pregunta <span className="text-lt-red">*</span></label>
        <input
          type="text"
          value={form.text}
          onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
          placeholder={placeholder}
          maxLength={200}
          className={inputCls}
        />
      </div>

      {/* Options */}
      <div>
        <label className="block text-lt-white font-condensed text-xs mb-1.5">
          Opciones de respuesta <span className="text-lt-muted2">(mín. 2)</span>
        </label>
        <div className="space-y-2">
          {form.options.map((opt, i) => (
            <div key={i} className="flex gap-2">
              <span className="w-7 h-10 flex items-center justify-center font-bebas text-sm text-lt-muted2 flex-shrink-0">
                {String.fromCharCode(65 + i)}
              </span>
              <input
                type="text"
                value={opt}
                onChange={(e) => updateOption(i, e.target.value)}
                placeholder={`Opción ${i + 1}`}
                className={cn(inputCls, 'flex-1')}
              />
              {form.options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(i)}
                  className="px-2 text-lt-red hover:text-lt-red/80 font-condensed text-sm"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addOption}
            className="text-lt-amber font-condensed text-xs font-600 hover:underline"
          >
            + Agregar opción
          </button>
        </div>
      </div>

      {/* Timing + Points */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-lt-white font-condensed text-xs mb-1.5">Timing</label>
          <div className="flex gap-1.5">
            {TIMING_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setForm((f) => ({ ...f, timing: value }))}
                className={cn(
                  'flex-1 py-2 rounded-btn border font-condensed text-xs font-600 transition-all',
                  form.timing === value
                    ? 'bg-lt-amber/20 border-lt-amber text-lt-amber'
                    : 'bg-lt-card2 border-lt-muted text-lt-white hover:border-lt-amber/30'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-lt-white font-condensed text-xs mb-1.5">Puntos</label>
          <input
            type="number"
            value={form.pointsValue}
            onChange={(e) => setForm((f) => ({ ...f, pointsValue: Number(e.target.value) || 10 }))}
            min={5}
            max={100}
            step={5}
            className={inputCls}
          />
        </div>
      </div>

      {error && <p className="text-lt-red text-xs font-condensed">{error}</p>}

      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-btn bg-lt-amber text-lt-black font-condensed text-sm font-700 disabled:opacity-40">
          {saving ? 'Creando...' : 'Crear pregunta'}
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2.5 rounded-btn border border-lt-muted text-lt-muted2 font-condensed text-sm">
          Cancelar
        </button>
      </div>
    </form>
  )
}
