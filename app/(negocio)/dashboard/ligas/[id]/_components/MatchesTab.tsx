'use client'
import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'

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
  _count: { answers: number }
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  SCHEDULED: { label: 'Programado', color: 'text-lt-muted2' },
  LIVE:      { label: 'En vivo',    color: 'text-lt-red' },
  HALFTIME:  { label: 'Descanso',   color: 'text-lt-amber' },
  FINISHED:  { label: 'Finalizado', color: 'text-lt-muted2' },
  CANCELLED: { label: 'Cancelado',  color: 'text-lt-red' },
}

const Q_TYPE_LABEL: Record<string, string> = {
  WINNER: 'Ganador', SCORE: 'Marcador', SCORER: 'Goleador',
  YES_NO: 'Sí/No', RANGE: 'Rango', CUSTOM: 'Personalizada',
}

const Q_STATUS: Record<string, { label: string; color: string }> = {
  PENDING:  { label: 'Pendiente', color: 'text-lt-muted2 border-lt-muted' },
  OPEN:     { label: 'Abierta',   color: 'text-lt-green border-lt-green/40' },
  CLOSED:   { label: 'Cerrada',   color: 'text-lt-amber border-lt-amber/40' },
  RESOLVED: { label: 'Resuelta',  color: 'text-lt-muted2 border-lt-muted' },
}

export function MatchesTab({ leagueId }: { leagueId: string }) {
  const [matches, setMatches] = useState<MatchData[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
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
      {/* Add match button */}
      <button
        onClick={() => setShowForm(!showForm)}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-btn bg-lt-amber text-lt-black font-condensed text-sm font-700 active:scale-[0.97] transition-all"
      >
        <span className="text-lg leading-none">+</span>
        Agregar partido
      </button>

      {showForm && (
        <AddMatchForm
          leagueId={leagueId}
          onCreated={(m) => { setMatches((prev) => [...prev, m]); setShowForm(false) }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Match list */}
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
  leagueId,
  onCreated,
  onCancel,
}: {
  leagueId: string
  onCreated: (m: MatchData) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState({
    homeTeam: '', awayTeam: '', competition: '', venue: '', kickoffAt: '',
  })
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

  useEffect(() => {
    fetch(`/api/leagues/${leagueId}/admin/questions?matchId=${match.id}`)
      .then((r) => r.json())
      .then(setQuestions)
      .finally(() => setLoading(false))
  }, [leagueId, match.id])

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

      {/* Add question */}
      <button
        onClick={() => setShowForm(!showForm)}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-btn bg-lt-amber text-lt-black font-condensed text-sm font-700 active:scale-[0.97] transition-all"
      >
        <span className="text-lg leading-none">+</span>
        Nueva pregunta
      </button>

      {showForm && (
        <AddQuestionForm
          leagueId={leagueId}
          matchId={match.id}
          onCreated={(q) => { setQuestions((prev) => [...prev, q]); setShowForm(false) }}
          onCancel={() => setShowForm(false)}
        />
      )}

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
          {questions.map((q, i) => {
            const qs = Q_STATUS[q.status] ?? { label: q.status, color: 'text-lt-muted2 border-lt-muted' }
            return (
              <div key={q.id} className="bg-lt-card rounded-card border border-[rgba(255,255,255,0.07)] p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-condensed text-xs text-lt-muted2 flex-shrink-0">#{i + 1}</span>
                    <p className="font-condensed text-sm text-lt-white font-600 truncate">{q.text}</p>
                  </div>
                  <span className={cn('font-condensed text-[10px] font-700 border px-1.5 py-0.5 rounded-full flex-shrink-0', qs.color)}>
                    {qs.label}
                  </span>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-condensed text-xs text-lt-muted2">
                    {Q_TYPE_LABEL[q.type] ?? q.type}
                  </span>
                  <span className="font-condensed text-xs text-lt-amber">{q.pointsValue} pts</span>
                  <span className="font-condensed text-xs text-lt-muted2">
                    {q.timing === 'LIVE' ? '🔴 En vivo' : '⏱️ Pre-partido'}
                  </span>
                  <span className="font-condensed text-xs text-lt-muted2">
                    {q._count.answers} resp.
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {(q.options as string[]).map((opt, j) => (
                    <span key={j} className="text-[11px] font-barlow bg-lt-card2 text-lt-muted2 px-2 py-0.5 rounded-full border border-[rgba(255,255,255,0.05)]">
                      {opt}
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Add Question Form ─────────────────────────────────────────
const QUESTION_TYPES = [
  { value: 'WINNER', label: 'Ganador' },
  { value: 'SCORE', label: 'Marcador' },
  { value: 'SCORER', label: 'Goleador' },
  { value: 'YES_NO', label: 'Sí/No' },
  { value: 'RANGE', label: 'Rango' },
  { value: 'CUSTOM', label: 'Personalizada' },
]

const TIMING_OPTIONS = [
  { value: 'PRE_MATCH', label: '⏱️ Pre-partido' },
  { value: 'LIVE', label: '🔴 En vivo' },
]

function AddQuestionForm({
  leagueId,
  matchId,
  onCreated,
  onCancel,
}: {
  leagueId: string
  matchId: string
  onCreated: (q: QuestionData) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState({
    text: '',
    type: 'WINNER',
    timing: 'PRE_MATCH',
    pointsValue: 20,
    options: ['', ''],
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const inputCls = 'w-full bg-lt-card2 border border-lt-muted rounded-btn px-4 py-3 text-lt-white font-barlow text-sm focus:outline-none focus:border-lt-amber transition-colors placeholder:text-lt-muted2'

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

  return (
    <form onSubmit={handleSubmit} className="bg-lt-card rounded-card border border-lt-amber/20 p-4 space-y-4">
      <p className="font-condensed text-sm text-lt-amber font-700">Nueva pregunta</p>

      {/* Text */}
      <div>
        <label className="block text-lt-white font-condensed text-xs mb-1">Pregunta <span className="text-lt-red">*</span></label>
        <input
          type="text"
          value={form.text}
          onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
          placeholder="¿Quién ganará el partido?"
          maxLength={200}
          className={inputCls}
        />
      </div>

      {/* Type */}
      <div>
        <label className="block text-lt-white font-condensed text-xs mb-1.5">Tipo de pregunta</label>
        <div className="grid grid-cols-3 gap-1.5">
          {QUESTION_TYPES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setForm((f) => ({ ...f, type: value }))}
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

      {/* Options */}
      <div>
        <label className="block text-lt-white font-condensed text-xs mb-1.5">
          Opciones de respuesta <span className="text-lt-muted2">(mín. 2)</span>
        </label>
        <div className="space-y-2">
          {form.options.map((opt, i) => (
            <div key={i} className="flex gap-2">
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
