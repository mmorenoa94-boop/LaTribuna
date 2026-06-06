'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import type { PoolStateResponse, PoolQuestionPublic } from '@/types'
import MatchesSection from './MatchesSection'

type GroupRankOptions = { groups: { name: string; teams: string[] }[] }

function formatCOP(n: number): string {
  return '$' + n.toLocaleString('es-CO')
}

async function fetchState(): Promise<PoolStateResponse> {
  const res = await fetch('/api/mundial')
  if (!res.ok) throw new Error('Error cargando la polla')
  return res.json()
}

export default function MundialClient() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['mundial-state'],
    queryFn: fetchState,
  })

  if (isLoading) {
    return <CenteredMessage title="Cargando…" />
  }
  if (!data?.pool) {
    return (
      <CenteredMessage
        title="Polla Mundialista"
        subtitle="Aún no hay una polla activa. Vuelve pronto."
      />
    )
  }

  const { entry } = data

  // Sin inscripción o rechazada → gate de pago
  if (!entry || entry.status === 'REJECTED') {
    return <PaymentGate data={data} onRequested={refetch} rejected={entry?.status === 'REJECTED'} />
  }

  // Pago en revisión
  if (entry.status === 'PENDING') {
    return (
      <CenteredMessage
        title="Pago en revisión"
        subtitle="Recibimos tu solicitud. En cuanto confirmemos tu pago por Nequi te habilitamos la polla. Te avisaremos por WhatsApp."
      />
    )
  }

  // CONFIRMED → formulario de preguntas + marcadores (rolling)
  return (
    <>
      <PoolForm data={data} onChange={refetch} />
      <MatchesSection />
    </>
  )
}

// ── Mensaje centrado ──
function CenteredMessage({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="max-w-lg mx-auto px-5 py-16 text-center animate-fade-in">
      <h1 className="font-bebas text-5xl text-lt-white mb-3">{title}</h1>
      {subtitle && <p className="text-lt-muted">{subtitle}</p>}
    </div>
  )
}

// ── Gate de pago (QR Nequi) ──
function PaymentGate({
  data,
  onRequested,
  rejected,
}: {
  data: PoolStateResponse
  onRequested: () => void
  rejected: boolean
}) {
  const pool = data.pool!
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const open = pool.status === 'OPEN_REGISTRATION'

  async function requestCupo() {
    setLoading(true)
    setError(null)
    const res = await fetch('/api/mundial/entry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    setLoading(false)
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      setError(j.error || 'No se pudo registrar la solicitud')
      return
    }
    onRequested()
  }

  return (
    <div className="max-w-lg mx-auto px-5 py-10 animate-fade-in">
      <div className="text-center mb-6">
        <span className="inline-block px-3 py-1 rounded-full bg-lt-green/10 text-lt-green text-xs font-condensed tracking-widest uppercase border border-lt-green/30 mb-4">
          Mundial {pool.season}
        </span>
        <h1 className="font-bebas text-5xl text-lt-white leading-none">{pool.name}</h1>
        <p className="text-lt-muted mt-2">
          Predice los grandes resultados del Mundial y compite por el pozo. Cupos limitados.
        </p>
      </div>

      {rejected && (
        <div className="mb-4 rounded-card bg-lt-red/10 border border-lt-red/40 px-4 py-3 text-sm text-lt-red">
          Tu solicitud anterior fue rechazada. Si crees que es un error, contáctanos por WhatsApp.
        </div>
      )}

      <div className="rounded-card bg-lt-card border border-lt-card2 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bebas text-2xl text-lt-white">Inscripción por Nequi</h3>
          <span className="text-xs font-condensed uppercase tracking-wider bg-lt-green/15 text-lt-green px-2 py-1 rounded">
            Pago único
          </span>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1">
            <div className="text-xs text-lt-muted uppercase tracking-wider">Valor</div>
            <div className="font-bebas text-4xl text-lt-green">{formatCOP(pool.entryFee)}</div>
            {pool.nequiNumber && (
              <>
                <div className="text-xs text-lt-muted uppercase tracking-wider mt-3">
                  Número Nequi
                </div>
                <div className="font-bebas text-2xl text-lt-white">{pool.nequiNumber}</div>
              </>
            )}
          </div>
          <div className="text-center">
            <div className="bg-white rounded-card p-2 w-36 h-36 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/nequi_qr.jpeg" alt="QR Nequi" className="w-full h-full object-contain" />
            </div>
            <div className="text-xs text-lt-muted mt-1">Escanea para pagar</div>
          </div>
        </div>

        <p className="text-sm text-lt-muted mb-4">
          Paga con el QR o transfiere al número de Nequi. Luego pulsa “Ya pagué” para registrar tu
          cupo; confirmamos el pago y te habilitamos las preguntas.
        </p>

        {error && <p className="text-sm text-lt-red mb-3">{error}</p>}

        <div className="flex flex-col gap-2">
          <button
            onClick={requestCupo}
            disabled={loading || !open}
            className="w-full font-condensed uppercase tracking-wider font-bold py-3 rounded-btn bg-lt-green text-black disabled:opacity-50"
          >
            {open ? (loading ? 'Registrando…' : 'Ya pagué, registrar mi cupo') : 'Inscripciones cerradas'}
          </button>
          {pool.whatsappUrl && (
            <a
              href={pool.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full text-center font-condensed uppercase tracking-wider py-3 rounded-btn border border-lt-card2 text-lt-white"
            >
              Enviar comprobante por WhatsApp
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Formulario de la polla ──
function PoolForm({ data, onChange }: { data: PoolStateResponse; onChange: () => void }) {
  const pool = data.pool!
  const submitted = !!data.entry?.submittedAt
  const editable =
    !submitted &&
    pool.status === 'OPEN_REGISTRATION' &&
    (!pool.lockAt || new Date() < new Date(pool.lockAt))

  const [answers, setAnswers] = useState<Record<string, unknown>>(data.myAnswers || {})
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setAnswers(data.myAnswers || {})
  }, [data.myAnswers])

  const questions = useMemo(
    () => [...data.questions].sort((a, b) => a.order - b.order),
    [data.questions]
  )

  const answeredCount = questions.filter((q) => {
    const v = answers[q.id]
    if (q.type === 'GROUP_RANK') {
      const groups = (q.options as GroupRankOptions)?.groups ?? []
      const obj = (v as Record<string, string[]>) || {}
      // Completo cuando cada grupo tiene sus 4 posiciones elegidas
      return groups.every((g) => {
        const r = obj[g.name] || []
        return g.teams.every((_, i) => !!r[i])
      })
    }
    return v !== undefined && v !== null && v !== ''
  }).length

  function setAnswer(qid: string, value: unknown) {
    setAnswers((prev) => ({ ...prev, [qid]: value }))
  }

  function setGroupRank(qid: string, group: string, pos: number, team: string) {
    setAnswers((prev) => {
      const current = (prev[qid] as Record<string, string[]>) || {}
      const ranking = [...(current[group] || ['', '', '', ''])]
      // Si el equipo ya estaba en otra posición de este grupo, lo quitamos de allí
      const dup = ranking.indexOf(team)
      if (dup !== -1 && dup !== pos) ranking[dup] = ''
      ranking[pos] = team
      return { ...prev, [qid]: { ...current, [group]: ranking } }
    })
  }

  function buildPayload() {
    return questions
      .filter((q) => {
        const v = answers[q.id]
        return v !== undefined && v !== null && v !== ''
      })
      .map((q) => ({ questionId: q.id, answer: answers[q.id] }))
  }

  async function save() {
    setSaving(true)
    setError(null)
    const res = await fetch('/api/mundial/answers', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers: buildPayload() }),
    })
    setSaving(false)
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      setError(j.error || 'No se pudo guardar')
      return
    }
    setSavedAt(new Date().toLocaleTimeString('es-CO'))
  }

  async function submitFinal() {
    setSaving(true)
    setError(null)
    // Guardar primero, luego enviar definitivo
    const saveRes = await fetch('/api/mundial/answers', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers: buildPayload() }),
    })
    if (!saveRes.ok) {
      const j = await saveRes.json().catch(() => ({}))
      setSaving(false)
      setError(j.error || 'No se pudo guardar')
      return
    }
    const res = await fetch('/api/mundial/submit', { method: 'POST' })
    setSaving(false)
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      setError(j.error || 'No se pudo enviar')
      return
    }
    onChange()
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-1">
        <h1 className="font-bebas text-4xl text-lt-white leading-none">{pool.name}</h1>
        <Link
          href="/mundial/ranking"
          className="text-xs font-condensed uppercase tracking-wider text-lt-green border border-lt-green/40 rounded-btn px-3 py-2"
        >
          Ver ranking
        </Link>
      </div>
      <p className="text-lt-muted text-sm mb-5">
        {submitted
          ? 'Tus respuestas están enviadas. Esto es solo lectura.'
          : editable
            ? 'Responde todo antes del cierre. Puedes guardar y volver, pero el envío definitivo no se puede cambiar.'
            : 'La polla está cerrada para edición.'}
      </p>

      {/* Progreso */}
      <div className="mb-5 rounded-card bg-lt-card border border-lt-card2 px-4 py-3 flex items-center justify-between">
        <span className="text-sm text-lt-muted">Respondidas</span>
        <span className="font-bebas text-2xl text-lt-white">
          {answeredCount}/{questions.length}
        </span>
      </div>

      <div className="space-y-4">
        {questions.map((q, i) => (
          <QuestionCard
            key={q.id}
            index={i + 1}
            q={q}
            value={answers[q.id]}
            editable={editable}
            onChange={(v) => setAnswer(q.id, v)}
            onGroupChange={(group, pos, team) => setGroupRank(q.id, group, pos, team)}
          />
        ))}
      </div>

      {error && <p className="text-sm text-lt-red mt-4">{error}</p>}

      {editable && (
        <div className="sticky bottom-0 mt-6 -mx-4 px-4 py-3 bg-lt-black/90 backdrop-blur border-t border-lt-card2 flex gap-3">
          <button
            onClick={save}
            disabled={saving}
            className="flex-1 font-condensed uppercase tracking-wider py-3 rounded-btn border border-lt-card2 text-lt-white disabled:opacity-50"
          >
            {saving ? 'Guardando…' : savedAt ? `Guardado ${savedAt}` : 'Guardar'}
          </button>
          <button
            onClick={submitFinal}
            disabled={saving || answeredCount < questions.length}
            className="flex-1 font-condensed uppercase tracking-wider font-bold py-3 rounded-btn bg-lt-green text-black disabled:opacity-50"
          >
            Enviar definitivo
          </button>
        </div>
      )}
    </div>
  )
}

// ── Tarjeta de pregunta ──
function QuestionCard({
  index,
  q,
  value,
  editable,
  onChange,
  onGroupChange,
}: {
  index: number
  q: PoolQuestionPublic
  value: unknown
  editable: boolean
  onChange: (v: unknown) => void
  onGroupChange: (group: string, pos: number, team: string) => void
}) {
  const options = (Array.isArray(q.options) ? (q.options as string[]) : []) as string[]
  const catColor =
    q.category === 'COLOMBIA'
      ? 'text-lt-amber'
      : q.category === 'BRACKET'
        ? 'text-lt-blue'
        : 'text-lt-green'

  return (
    <div className="rounded-card bg-lt-card border border-lt-card2 p-4">
      <div className="flex items-start gap-3 mb-3">
        <span className="font-bebas text-xl text-lt-muted">{index}</span>
        <div className="flex-1">
          <div className={`text-[11px] font-condensed uppercase tracking-widest ${catColor}`}>
            {q.category}
            {q.isTiebreaker ? ' · Desempate' : ` · ${q.pointsValue} pts`}
          </div>
          <p className="text-lt-white font-medium leading-snug">{q.text}</p>
        </div>
      </div>

      {/* Tipos basados en select */}
      {(q.type === 'TEAM_PICK' || q.type === 'SINGLE_CHOICE' || q.type === 'YES_NO') && (
        <select
          disabled={!editable}
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-lt-card2 border border-lt-card2 rounded-btn px-3 py-2 text-lt-white disabled:opacity-60"
        >
          <option value="">Selecciona…</option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      )}

      {q.type === 'PLAYER_PICK' && (
        <input
          type="text"
          disabled={!editable}
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Escribe el nombre del jugador"
          className="w-full bg-lt-card2 border border-lt-card2 rounded-btn px-3 py-2 text-lt-white disabled:opacity-60"
        />
      )}

      {q.type === 'NUMERIC' && (
        <input
          type="number"
          min={0}
          disabled={!editable}
          value={value === undefined || value === null ? '' : (value as number)}
          onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
          placeholder="0"
          className="w-full bg-lt-card2 border border-lt-card2 rounded-btn px-3 py-2 text-lt-white disabled:opacity-60"
        />
      )}

      {q.type === 'GROUP_RANK' && (
        <GroupRankInput
          q={q}
          value={value as Record<string, string[]>}
          editable={editable}
          onGroupChange={onGroupChange}
        />
      )}
    </div>
  )
}

// ── Selectores de bracket por grupo (ranking completo 1° a 4°) ──
const POS_LABEL = ['1° lugar', '2° lugar', '3° lugar', '4° lugar']

function GroupRankInput({
  q,
  value,
  editable,
  onGroupChange,
}: {
  q: PoolQuestionPublic
  value: Record<string, string[]> | undefined
  editable: boolean
  onGroupChange: (group: string, pos: number, team: string) => void
}) {
  const groups = (q.options as GroupRankOptions)?.groups ?? []
  const v = value || {}

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {groups.map((g) => {
        const ranking = v[g.name] ?? []
        return (
          <div key={g.name} className="rounded-btn bg-lt-card2/50 border border-lt-card2 p-3">
            <div className="font-bebas text-lg text-lt-white mb-2">Grupo {g.name}</div>
            {g.teams.map((_, pos) => {
              const chosen = ranking[pos] ?? ''
              // Disponibles: los no usados en otras posiciones de este grupo (+ el actual)
              const used = new Set(ranking.filter((t, i) => t && i !== pos))
              return (
                <div key={pos} className="mb-2 last:mb-0">
                  <label className="block text-[10px] text-lt-muted uppercase tracking-wider mb-1">
                    {POS_LABEL[pos]}
                  </label>
                  <select
                    disabled={!editable}
                    value={chosen}
                    onChange={(e) => onGroupChange(g.name, pos, e.target.value)}
                    className="w-full bg-lt-card border border-lt-card2 rounded px-2 py-1.5 text-sm text-lt-white disabled:opacity-60"
                  >
                    <option value="">—</option>
                    {g.teams
                      .filter((t) => !used.has(t))
                      .map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                  </select>
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
