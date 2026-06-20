'use client'

import { useEffect, useState } from 'react'
import type { PoolQuestion, WorldCupPool } from '@/types'
import type { PendingReport } from '@/lib/mundial-pending-pure'

type AdminMatch = {
  id: string
  homeTeam: string
  awayTeam: string
  homeFlag: string | null
  awayFlag: string | null
  phase: string
  kickoffAt: string | null
  status: 'SCHEDULED' | 'OPEN' | 'CLOSED' | 'FINISHED'
  homeScore: number | null
  awayScore: number | null
  order: number
  _count: { predictions: number }
}

type AdminData = {
  pool: WorldCupPool
  questions: PoolQuestion[]
  entryCounts: { PENDING: number; CONFIRMED: number; REJECTED: number }
  matches: AdminMatch[]
} | null

type EntryRow = {
  id: string
  status: string
  paymentNote: string | null
  createdAt: string
  user: { id: string; name: string; email: string; phone: string | null }
  _count: { answers: number }
}

function toLocalInput(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const off = d.getTimezoneOffset()
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16)
}

export default function AdminClient() {
  const [data, setData] = useState<AdminData>(null)
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState<string | null>(null)

  async function load() {
    const res = await fetch('/api/admin/mundial')
    const j = await res.json()
    setData(j.data)
    setLoading(false)
  }
  useEffect(() => {
    load()
  }, [])

  function flash(m: string) {
    setMsg(m)
    setTimeout(() => setMsg(null), 3000)
  }

  if (loading) return <div className="p-8 text-lt-muted">Cargando…</div>

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <h1 className="font-bebas text-4xl text-lt-white">Admin · Polla Mundialista</h1>
      {msg && (
        <div className="rounded-card bg-lt-green/10 border border-lt-green/40 px-4 py-2 text-sm text-lt-green">
          {msg}
        </div>
      )}

      {!data ? (
        <CreatePool onCreated={load} />
      ) : (
        <>
          <PoolConfig pool={data.pool} onSaved={(m) => { flash(m); load() }} />
          <QuestionsManager
            pool={data.pool}
            questions={data.questions}
            onChange={(m) => { flash(m); load() }}
          />
          <GroupsEditor questions={data.questions} onChange={(m) => { flash(m); load() }} />
          <MatchesManager matches={data.matches} onChange={(m) => { flash(m); load() }} />
          <EntriesManager onChange={(m) => { flash(m); load() }} counts={data.entryCounts} />
          <PendingPredictions onFlash={flash} />
          <ResolvePanel pool={data.pool} questions={data.questions} onResolved={(m) => { flash(m); load() }} />
        </>
      )}
    </div>
  )
}

// ── Crear polla ──
function CreatePool({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState('Polla Mundialista 2026')
  const [entryFee, setEntryFee] = useState(7000)
  const [saving, setSaving] = useState(false)

  async function create() {
    setSaving(true)
    await fetch('/api/admin/mundial', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        season: '2026',
        entryFee,
        prizeSplit: [60, 30, 10],
        status: 'DRAFT',
        nequiNumber: '300 505 0014',
        whatsappUrl:
          'https://wa.me/573005050014?text=Hola%2C%20ya%20pagu%C3%A9%20la%20polla%20mundialista',
      }),
    })
    setSaving(false)
    onCreated()
  }

  return (
    <div className="rounded-card bg-lt-card border border-lt-card2 p-5 space-y-3">
      <h2 className="font-bebas text-2xl text-lt-white">Crear polla</h2>
      <Field label="Nombre">
        <input className="inp" value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="Cuota (COP)">
        <input
          type="number"
          className="inp"
          value={entryFee}
          onChange={(e) => setEntryFee(Number(e.target.value))}
        />
      </Field>
      <button onClick={create} disabled={saving} className="btn-primary">
        {saving ? 'Creando…' : 'Crear polla'}
      </button>
      <style jsx global>{styles}</style>
    </div>
  )
}

// ── Config de la polla ──
function PoolConfig({ pool, onSaved }: { pool: WorldCupPool; onSaved: (m: string) => void }) {
  const [name, setName] = useState(pool.name)
  const [entryFee, setEntryFee] = useState(pool.entryFee)
  const [status, setStatus] = useState(pool.status)
  const [lockAt, setLockAt] = useState(toLocalInput(pool.lockAt as unknown as string))
  const [nequi, setNequi] = useState(pool.nequiNumber ?? '')
  const [wa, setWa] = useState(pool.whatsappUrl ?? '')
  const [split, setSplit] = useState((pool.prizeSplit as number[]).join(','))
  const [ptsOutcome, setPtsOutcome] = useState(pool.matchPointsOutcome)
  const [ptsExact, setPtsExact] = useState(pool.matchPointsExactBonus)
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    const prizeSplit = split.split(',').map((s) => Number(s.trim()))
    const res = await fetch('/api/admin/mundial', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        entryFee,
        status,
        prizeSplit,
        lockAt: lockAt ? new Date(lockAt).toISOString() : null,
        nequiNumber: nequi || null,
        whatsappUrl: wa || null,
        matchPointsOutcome: ptsOutcome,
        matchPointsExactBonus: ptsExact,
      }),
    })
    setSaving(false)
    onSaved(res.ok ? 'Configuración guardada' : 'Error al guardar')
  }

  return (
    <div className="rounded-card bg-lt-card border border-lt-card2 p-5 space-y-3">
      <h2 className="font-bebas text-2xl text-lt-white">Configuración</h2>
      <Field label="Nombre">
        <input className="inp" value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Cuota (COP)">
          <input type="number" className="inp" value={entryFee} onChange={(e) => setEntryFee(Number(e.target.value))} />
        </Field>
        <Field label="Estado">
          <select className="inp" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
            <option value="DRAFT">DRAFT (oculto)</option>
            <option value="OPEN_REGISTRATION">OPEN_REGISTRATION (abierto)</option>
            <option value="LOCKED">LOCKED (cerrado)</option>
            <option value="RESOLVED">RESOLVED (resuelto)</option>
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Cierre (lockAt)">
          <input type="datetime-local" className="inp" value={lockAt} onChange={(e) => setLockAt(e.target.value)} />
        </Field>
        <Field label="Reparto premio (%)">
          <input className="inp" value={split} onChange={(e) => setSplit(e.target.value)} placeholder="60,30,10" />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Número Nequi">
          <input className="inp" value={nequi} onChange={(e) => setNequi(e.target.value)} />
        </Field>
        <Field label="WhatsApp URL">
          <input className="inp" value={wa} onChange={(e) => setWa(e.target.value)} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Puntos por resultado (1X2)">
          <input type="number" className="inp" value={ptsOutcome} onChange={(e) => setPtsOutcome(Number(e.target.value))} />
        </Field>
        <Field label="Bono por marcador exacto">
          <input type="number" className="inp" value={ptsExact} onChange={(e) => setPtsExact(Number(e.target.value))} />
        </Field>
      </div>
      <button onClick={save} disabled={saving} className="btn-primary">
        {saving ? 'Guardando…' : 'Guardar configuración'}
      </button>
      <style jsx global>{styles}</style>
    </div>
  )
}

// ── Preguntas ──
function QuestionsManager({
  pool,
  questions,
  onChange,
}: {
  pool: WorldCupPool
  questions: PoolQuestion[]
  onChange: (m: string) => void
}) {
  const [busy, setBusy] = useState(false)

  async function seed(reset = false) {
    if (reset && !confirm('Esto BORRA las preguntas actuales (y sus respuestas) y las recrea. ¿Continuar?')) return
    setBusy(true)
    const url = reset
      ? '/api/admin/mundial/seed-questions?reset=1'
      : '/api/admin/mundial/seed-questions'
    const res = await fetch(url, { method: 'POST' })
    const j = await res.json().catch(() => ({}))
    setBusy(false)
    onChange(res.ok ? `Sembradas ${j.data?.created} preguntas` : j.error || 'Error al sembrar')
  }

  async function del(id: string) {
    if (!confirm('¿Eliminar esta pregunta?')) return
    await fetch(`/api/admin/mundial/questions/${id}`, { method: 'DELETE' })
    onChange('Pregunta eliminada')
  }

  return (
    <div className="rounded-card bg-lt-card border border-lt-card2 p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-bebas text-2xl text-lt-white">Preguntas ({questions.length})</h2>
        {questions.length === 0 ? (
          <button onClick={() => seed(false)} disabled={busy} className="btn-primary">
            {busy ? 'Sembrando…' : 'Sembrar preguntas'}
          </button>
        ) : (
          <button onClick={() => seed(true)} disabled={busy} className="btn-primary" style={{ background: '#FF6D00' }}>
            {busy ? 'Procesando…' : 'Re-sembrar (borra y recrea)'}
          </button>
        )}
      </div>
      {pool.colombiaGoalsReal != null && (
        <p className="text-xs text-lt-muted">Goles reales Colombia: {pool.colombiaGoalsReal}</p>
      )}
      <div className="space-y-2">
        {questions.map((q) => (
          <div key={q.id} className="flex items-start gap-2 text-sm border-b border-lt-card2 pb-2">
            <span className="text-lt-muted font-bebas w-6">{q.order + 1}</span>
            <div className="flex-1">
              <div className="text-lt-white">{q.text}</div>
              <div className="text-[11px] text-lt-muted">
                {q.type} · {q.category} · {q.isTiebreaker ? 'desempate' : `${q.pointsValue} pts`}
                {q.correctAnswer != null && (
                  <span className="text-lt-green"> · ✓ {JSON.stringify(q.correctAnswer).slice(0, 40)}</span>
                )}
              </div>
            </div>
            <button onClick={() => del(q.id)} className="text-lt-red text-xs">
              Eliminar
            </button>
          </div>
        ))}
      </div>
      <style jsx global>{styles}</style>
    </div>
  )
}

// ── Inscripciones ──
function EntriesManager({
  counts,
  onChange,
}: {
  counts: { PENDING: number; CONFIRMED: number; REJECTED: number }
  onChange: (m: string) => void
}) {
  const [entries, setEntries] = useState<EntryRow[]>([])
  const [filter, setFilter] = useState<'PENDING' | 'CONFIRMED' | 'REJECTED' | ''>('PENDING')

  async function load() {
    const url = filter ? `/api/admin/mundial/entries?status=${filter}` : '/api/admin/mundial/entries'
    const res = await fetch(url)
    const j = await res.json()
    setEntries(j.data ?? [])
  }
  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  async function act(id: string, action: 'confirm' | 'reject' | 'reset') {
    await fetch(`/api/admin/mundial/entries/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    await load()
    onChange('Inscripción actualizada')
  }

  return (
    <div className="rounded-card bg-lt-card border border-lt-card2 p-5 space-y-3">
      <h2 className="font-bebas text-2xl text-lt-white">
        Inscripciones · {counts.CONFIRMED} confirmadas, {counts.PENDING} pendientes
      </h2>
      <div className="flex gap-2 text-xs">
        {(['PENDING', 'CONFIRMED', 'REJECTED', ''] as const).map((f) => (
          <button
            key={f || 'all'}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-btn border ${
              filter === f ? 'bg-lt-green text-black border-lt-green' : 'border-lt-card2 text-lt-muted'
            }`}
          >
            {f || 'TODAS'}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {entries.length === 0 && <p className="text-lt-muted text-sm">Sin inscripciones.</p>}
        {entries.map((e) => (
          <div key={e.id} className="flex items-center gap-2 text-sm border-b border-lt-card2 pb-2">
            <div className="flex-1">
              <div className="text-lt-white">{e.user.name}</div>
              <div className="text-[11px] text-lt-muted">
                {e.user.email} {e.user.phone ? `· ${e.user.phone}` : ''} · {e.status} ·{' '}
                {e._count.answers} resp.
              </div>
              {e.paymentNote && <div className="text-[11px] text-lt-amber">Nota: {e.paymentNote}</div>}
            </div>
            {e.status !== 'CONFIRMED' && (
              <button onClick={() => act(e.id, 'confirm')} className="text-lt-green text-xs">
                Confirmar
              </button>
            )}
            {e.status !== 'REJECTED' && (
              <button onClick={() => act(e.id, 'reject')} className="text-lt-red text-xs">
                Rechazar
              </button>
            )}
            {e.status !== 'PENDING' && (
              <button onClick={() => act(e.id, 'reset')} className="text-lt-muted text-xs">
                Reabrir
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Pronósticos pendientes ──
function fmtKickoff(iso: string | null): string {
  if (!iso) return 's/fecha'
  // La hora-pared de Colombia va embebida en UTC: mostramos en UTC para no correr el día.
  return new Date(iso)
    .toLocaleString('es-CO', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'UTC',
    })
    .replace(',', '')
}

function PendingPredictions({ onFlash }: { onFlash: (m: string) => void }) {
  const [report, setReport] = useState<PendingReport | null>(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const res = await fetch('/api/admin/mundial/pending')
    const j = await res.json().catch(() => ({}))
    setReport(j.data ?? null)
    setLoading(false)
  }
  useEffect(() => {
    load()
  }, [])

  async function copyEmails() {
    if (!report) return
    const emails = report.users.map((u) => u.email).filter(Boolean).join(', ')
    try {
      await navigator.clipboard.writeText(emails)
      onFlash(`Copiados ${report.users.length} emails al portapapeles`)
    } catch {
      onFlash('No se pudo copiar (revisa permisos del navegador)')
    }
  }

  return (
    <div className="rounded-card bg-lt-card border border-lt-card2 p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-bebas text-2xl text-lt-white">Pronósticos pendientes</h2>
        <button onClick={load} disabled={loading} className="text-lt-green text-xs">
          {loading ? 'Cargando…' : 'Actualizar'}
        </button>
      </div>
      <p className="text-xs text-lt-muted">
        Inscritos confirmados que no han llenado los marcadores de los partidos aún abiertos (OPEN).
        Útil para recordarles antes de que se cierren.
      </p>

      {!report || loading ? (
        <p className="text-sm text-lt-muted">Cargando…</p>
      ) : report.totalOpenMatches === 0 ? (
        <p className="text-sm text-lt-muted">No hay partidos abiertos (OPEN) por ahora.</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-3 text-sm">
            <span className="text-lt-muted">
              <span className="text-lt-white font-bebas text-xl">{report.totalConfirmed}</span> inscritos
            </span>
            <span className="text-lt-muted">
              <span className="text-lt-amber font-bebas text-xl">{report.withPending}</span> con pendientes
            </span>
            <span className="text-lt-muted">
              <span className="text-lt-green font-bebas text-xl">{report.complete}</span> al día
            </span>
            <span className="text-lt-muted">
              <span className="text-lt-white font-bebas text-xl">{report.totalOpenMatches}</span> partidos abiertos
            </span>
          </div>

          {report.users.length === 0 ? (
            <p className="text-sm text-lt-green">¡Todos al día! Nadie tiene pendientes. 🎉</p>
          ) : (
            <>
              <button onClick={copyEmails} className="btn-primary" style={{ padding: '6px 14px' }}>
                Copiar emails ({report.users.length})
              </button>
              <div className="space-y-1.5 pt-1">
                {report.users.map((u) => (
                  <div
                    key={u.userId}
                    className="flex items-center gap-2 text-sm border-b border-lt-card2 pb-1.5"
                  >
                    <span
                      className="shrink-0 w-12 text-center font-bebas text-lg text-lt-amber"
                      title="Partidos sin pronosticar"
                    >
                      {u.missing}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-lt-white truncate">{u.name}</div>
                      <div className="text-[11px] text-lt-muted truncate">
                        {u.email}
                        {u.phone ? ` · ${u.phone}` : ''}
                      </div>
                    </div>
                    <span className="shrink-0 text-[11px] text-lt-muted">{u.done} hechos</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Faltantes por partido */}
          <details className="pt-1">
            <summary className="text-xs text-lt-muted cursor-pointer">Ver faltantes por partido</summary>
            <div className="space-y-1 pt-2">
              {report.byMatch.map((m) => (
                <div key={m.id} className="flex items-center justify-between gap-2 text-[12px]">
                  <span className="text-lt-white truncate">
                    <span className="text-lt-muted">{fmtKickoff(m.kickoffAt)}</span> · {m.label}
                  </span>
                  <span className="shrink-0 text-lt-amber">
                    faltan {m.missing}/{report.totalConfirmed}
                  </span>
                </div>
              ))}
            </div>
          </details>
        </>
      )}
      <style jsx global>{styles}</style>
    </div>
  )
}

// ── Resolución ──
function ResolvePanel({
  pool,
  questions,
  onResolved,
}: {
  pool: WorldCupPool
  questions: PoolQuestion[]
  onResolved: (m: string) => void
}) {
  const [corrections, setCorrections] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    for (const q of questions) {
      if (q.correctAnswer != null) {
        init[q.id] =
          typeof q.correctAnswer === 'string'
            ? q.correctAnswer
            : JSON.stringify(q.correctAnswer)
      }
    }
    return init
  })
  const [colombiaGoals, setColombiaGoals] = useState(
    pool.colombiaGoalsReal != null ? String(pool.colombiaGoalsReal) : ''
  )
  const [totalGoals, setTotalGoals] = useState(
    pool.totalGoalsReal != null ? String(pool.totalGoalsReal) : ''
  )
  const [busy, setBusy] = useState(false)

  function setCorr(id: string, v: string) {
    setCorrections((prev) => ({ ...prev, [id]: v }))
  }

  async function resolve() {
    if (!confirm('Esto calculará puntos y marcará la polla como RESUELTA. ¿Continuar?')) return
    setBusy(true)

    const payload = questions
      .filter((q) => corrections[q.id] !== undefined && corrections[q.id] !== '')
      .map((q) => {
        let answer: unknown = corrections[q.id]
        // GROUP_RANK y similares pueden venir como JSON
        if (q.type === 'GROUP_RANK' || q.type === 'NUMERIC') {
          try {
            answer = JSON.parse(corrections[q.id])
          } catch {
            if (q.type === 'NUMERIC') answer = Number(corrections[q.id])
          }
        }
        return { questionId: q.id, answer }
      })

    const res = await fetch('/api/admin/mundial/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        corrections: payload,
        colombiaGoalsReal: colombiaGoals === '' ? null : Number(colombiaGoals),
        totalGoalsReal: totalGoals === '' ? null : Number(totalGoals),
      }),
    })
    const j = await res.json().catch(() => ({}))
    setBusy(false)
    onResolved(res.ok ? `Resuelto: ${j.data?.entriesScored} participantes calculados` : j.error || 'Error')
  }

  return (
    <div className="rounded-card bg-lt-card border border-lt-card2 p-5 space-y-3">
      <h2 className="font-bebas text-2xl text-lt-white">Resolver</h2>
      <p className="text-xs text-lt-muted">
        Ingresa la respuesta correcta de cada pregunta. Para el bracket de grupos usa JSON, ej:{' '}
        <code>{'{"A":["Equipo A1","Equipo A2"]}'}</code>. Las preguntas de desempate no dan puntos.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Goles totales del mundial (desempate)">
          <input
            type="number"
            className="inp"
            value={totalGoals}
            onChange={(e) => setTotalGoals(e.target.value)}
          />
        </Field>
        <Field label="Goles reales de Colombia (desempate)">
          <input
            type="number"
            className="inp"
            value={colombiaGoals}
            onChange={(e) => setColombiaGoals(e.target.value)}
          />
        </Field>
      </div>
      <div className="space-y-2">
        {questions.map((q) => (
          <Field key={q.id} label={`${q.order + 1}. ${q.text}`}>
            <input
              className="inp"
              value={corrections[q.id] ?? ''}
              onChange={(e) => setCorr(q.id, e.target.value)}
              placeholder={q.type === 'GROUP_RANK' ? '{"A":["...","..."]}' : 'Respuesta correcta'}
            />
          </Field>
        ))}
      </div>
      <button onClick={resolve} disabled={busy} className="btn-primary">
        {busy ? 'Calculando…' : 'Resolver y calcular ranking'}
      </button>
      <style jsx global>{styles}</style>
    </div>
  )
}

// ── Editor de grupos y selecciones ──
type GroupDef = { name: string; teams: string[] }

function GroupsEditor({
  questions,
  onChange,
}: {
  questions: PoolQuestion[]
  onChange: (m: string) => void
}) {
  const groupQ = questions.find((q) => q.type === 'GROUP_RANK')
  const teamPickQs = questions.filter((q) => q.type === 'TEAM_PICK')

  const initial: GroupDef[] = (() => {
    const opt = groupQ?.options as { groups?: GroupDef[] } | undefined
    if (opt?.groups?.length) {
      return opt.groups.map((g) => ({
        name: g.name,
        teams: [0, 1, 2, 3].map((i) => g.teams?.[i] ?? ''),
      }))
    }
    return []
  })()

  const [groups, setGroups] = useState<GroupDef[]>(initial)
  const [busy, setBusy] = useState(false)

  if (!groupQ) {
    return (
      <div className="rounded-card bg-lt-card border border-lt-card2 p-5">
        <h2 className="font-bebas text-2xl text-lt-white">Grupos y selecciones</h2>
        <p className="text-sm text-lt-muted">Siembra las preguntas primero para configurar los grupos.</p>
      </div>
    )
  }

  function setTeam(gi: number, ti: number, val: string) {
    setGroups((prev) => {
      const next = prev.map((g) => ({ name: g.name, teams: [...g.teams] }))
      next[gi].teams[ti] = val
      return next
    })
  }

  async function save() {
    setBusy(true)
    // 1. Guardar los grupos en la pregunta GROUP_RANK
    const r1 = await fetch(`/api/admin/mundial/questions/${groupQ!.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ options: { groups } }),
    })
    // 2. Derivar las 48 selecciones y actualizarlas en campeón/subcampeón/3°
    const teams = Array.from(
      new Set(groups.flatMap((g) => g.teams.map((t) => t.trim()).filter(Boolean)))
    ).sort((a, b) => a.localeCompare(b, 'es'))

    let ok = r1.ok
    for (const q of teamPickQs) {
      const r = await fetch(`/api/admin/mundial/questions/${q.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ options: teams }),
      })
      ok = ok && r.ok
    }
    setBusy(false)
    onChange(
      ok
        ? `Grupos guardados · ${teams.length} selecciones aplicadas a campeón/subcampeón/3°`
        : 'Error al guardar grupos'
    )
  }

  return (
    <div className="rounded-card bg-lt-card border border-lt-card2 p-5 space-y-3">
      <h2 className="font-bebas text-2xl text-lt-white">Grupos y selecciones</h2>
      <p className="text-xs text-lt-muted">
        Escribe los 4 equipos de cada grupo (en cualquier orden; el usuario los ordenará). Al guardar,
        la lista completa de selecciones se aplica automáticamente a las preguntas de campeón,
        subcampeón y tercer puesto.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {groups.map((g, gi) => (
          <div key={g.name} className="rounded-btn bg-lt-card2/40 border border-lt-card2 p-3">
            <div className="font-bebas text-lg text-lt-white mb-2">Grupo {g.name}</div>
            {g.teams.map((t, ti) => (
              <input
                key={ti}
                className="inp"
                style={{ marginBottom: 6 }}
                value={t}
                onChange={(e) => setTeam(gi, ti, e.target.value)}
                placeholder={`Equipo ${ti + 1}`}
              />
            ))}
          </div>
        ))}
      </div>
      <button onClick={save} disabled={busy} className="btn-primary">
        {busy ? 'Guardando…' : 'Guardar grupos y selecciones'}
      </button>
      <style jsx global>{styles}</style>
    </div>
  )
}

// ── Partidos ──
function MatchesManager({
  matches,
  onChange,
}: {
  matches: AdminMatch[]
  onChange: (m: string) => void
}) {
  const [home, setHome] = useState('')
  const [away, setAway] = useState('')
  const [phase, setPhase] = useState('Fase de grupos')
  const [kickoff, setKickoff] = useState('')
  const [csv, setCsv] = useState('')
  const [busy, setBusy] = useState(false)

  async function createOne() {
    if (!home.trim() || !away.trim()) return
    setBusy(true)
    const res = await fetch('/api/admin/mundial/matches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        homeTeam: home,
        awayTeam: away,
        phase,
        kickoffAt: kickoff ? new Date(kickoff).toISOString() : null,
      }),
    })
    setBusy(false)
    if (res.ok) {
      setHome('')
      setAway('')
      setKickoff('')
      onChange('Partido creado')
    } else {
      onChange('Error al crear partido')
    }
  }

  async function uploadCsv() {
    // Formato por línea: local,visitante,fase,kickoffISO(opcional)
    const rows = csv
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !/^local\s*,/i.test(l))
      .map((l) => l.split(',').map((c) => c.trim()))
      .filter((cols) => cols.length >= 2 && cols[0] && cols[1])
      .map((cols) => ({
        homeTeam: cols[0],
        awayTeam: cols[1],
        phase: cols[2] || 'Fase de grupos',
        kickoffAt: cols[3] ? new Date(cols[3]).toISOString() : null,
      }))

    if (rows.length === 0) {
      onChange('CSV vacío o inválido')
      return
    }
    setBusy(true)
    const res = await fetch('/api/admin/mundial/matches?bulk=1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matches: rows }),
    })
    const j = await res.json().catch(() => ({}))
    setBusy(false)
    if (res.ok) {
      setCsv('')
      onChange(`Cargados ${j.data?.created} partidos`)
    } else {
      onChange(j.error || 'Error al cargar CSV')
    }
  }

  return (
    <div className="rounded-card bg-lt-card border border-lt-card2 p-5 space-y-4">
      <h2 className="font-bebas text-2xl text-lt-white">Partidos ({matches.length})</h2>

      {/* Crear uno */}
      <div className="grid grid-cols-2 gap-2">
        <Field label="Local">
          <input className="inp" value={home} onChange={(e) => setHome(e.target.value)} />
        </Field>
        <Field label="Visitante">
          <input className="inp" value={away} onChange={(e) => setAway(e.target.value)} />
        </Field>
        <Field label="Fase">
          <input className="inp" value={phase} onChange={(e) => setPhase(e.target.value)} />
        </Field>
        <Field label="Inicio (opcional)">
          <input type="datetime-local" className="inp" value={kickoff} onChange={(e) => setKickoff(e.target.value)} />
        </Field>
      </div>
      <button onClick={createOne} disabled={busy} className="btn-primary">
        Agregar partido
      </button>

      {/* CSV */}
      <Field label="Carga masiva CSV (local,visitante,fase,inicioISO)">
        <textarea
          className="inp"
          rows={4}
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          placeholder={'Colombia,Brasil,Fase de grupos,2026-06-12T19:00:00Z\nArgentina,México,Fase de grupos'}
        />
      </Field>
      <button onClick={uploadCsv} disabled={busy} className="btn-primary">
        Cargar CSV
      </button>

      {/* Lista */}
      <div className="space-y-2 pt-2">
        {matches.map((m) => (
          <MatchRow key={m.id} m={m} onChange={onChange} />
        ))}
      </div>
      <style jsx global>{styles}</style>
    </div>
  )
}

function MatchRow({ m, onChange }: { m: AdminMatch; onChange: (msg: string) => void }) {
  const [status, setStatus] = useState(m.status)
  const [hs, setHs] = useState(m.homeScore != null ? String(m.homeScore) : '')
  const [as, setAs] = useState(m.awayScore != null ? String(m.awayScore) : '')
  const [busy, setBusy] = useState(false)

  async function patch(body: Record<string, unknown>, msg: string) {
    setBusy(true)
    const res = await fetch(`/api/admin/mundial/matches/${m.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setBusy(false)
    onChange(res.ok ? msg : 'Error')
  }

  async function del() {
    if (!confirm('¿Eliminar este partido?')) return
    await fetch(`/api/admin/mundial/matches/${m.id}`, { method: 'DELETE' })
    onChange('Partido eliminado')
  }

  return (
    <div className="border-b border-lt-card2 pb-2 text-sm">
      <div className="flex items-center gap-2">
        <span className="flex-1 text-lt-white">
          {m.homeTeam} vs {m.awayTeam}
          <span className="text-[11px] text-lt-muted"> · {m.phase} · {m._count.predictions} pred.</span>
        </span>
        <button onClick={del} className="text-lt-red text-xs">
          Eliminar
        </button>
      </div>
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        <select
          value={status}
          onChange={(e) => {
            const v = e.target.value as AdminMatch['status']
            setStatus(v)
            patch({ status: v }, `Estado: ${v}`)
          }}
          className="inp"
          style={{ width: 'auto' }}
        >
          <option value="SCHEDULED">SCHEDULED (oculto)</option>
          <option value="OPEN">OPEN (pronosticable)</option>
          <option value="CLOSED">CLOSED (cerrado)</option>
          <option value="FINISHED">FINISHED (con resultado)</option>
        </select>
        <input
          type="number"
          className="inp"
          style={{ width: 56 }}
          value={hs}
          onChange={(e) => setHs(e.target.value)}
          placeholder="L"
        />
        <span className="text-lt-muted">-</span>
        <input
          type="number"
          className="inp"
          style={{ width: 56 }}
          value={as}
          onChange={(e) => setAs(e.target.value)}
          placeholder="V"
        />
        <button
          disabled={busy || hs === '' || as === ''}
          onClick={() =>
            patch(
              { status: 'FINISHED', homeScore: Number(hs), awayScore: Number(as) },
              'Resultado guardado y puntos calculados'
            )
          }
          className="btn-primary"
          style={{ padding: '6px 12px' }}
        >
          Guardar resultado
        </button>
      </div>
      <style jsx global>{styles}</style>
    </div>
  )
}

// ── Helpers de UI ──
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] text-lt-muted uppercase tracking-wider mb-1">{label}</span>
      {children}
    </label>
  )
}

const styles = `
  .inp {
    width: 100%;
    background: #1C2130;
    border: 1px solid #1C2130;
    border-radius: 10px;
    padding: 8px 12px;
    color: #fff;
    font-size: 14px;
  }
  .btn-primary {
    font-family: 'Barlow Condensed', sans-serif;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 700;
    background: #00E676;
    color: #000;
    padding: 10px 18px;
    border-radius: 10px;
  }
  .btn-primary:disabled { opacity: 0.5; }
`
