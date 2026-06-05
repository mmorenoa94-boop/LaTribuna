'use client'

import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'

type MatchRow = {
  id: string
  homeTeam: string
  awayTeam: string
  homeFlag: string | null
  awayFlag: string | null
  phase: string
  kickoffAt: string | null
  status: 'OPEN' | 'CLOSED' | 'FINISHED'
  homeScore: number | null
  awayScore: number | null
  myPrediction: { homePredict: number; awayPredict: number; pointsEarned: number } | null
}

type MatchesResponse = {
  data: MatchRow[]
  entryStatus: string | null
  pointsConfig: { outcome: number; exactBonus: number }
}

async function fetchMatches(): Promise<MatchesResponse> {
  const res = await fetch('/api/mundial/matches')
  if (!res.ok) throw new Error('Error cargando partidos')
  return res.json()
}

const STATUS_LABEL: Record<string, string> = {
  OPEN: 'Abierto',
  CLOSED: 'Cerrado',
  FINISHED: 'Finalizado',
}

export default function MatchesSection() {
  const { data, refetch } = useQuery({
    queryKey: ['mundial-matches'],
    queryFn: fetchMatches,
    refetchInterval: 60_000,
  })

  const [draft, setDraft] = useState<Record<string, { h: string; a: string }>>({})
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Inicializa el borrador con las predicciones existentes
  useEffect(() => {
    if (!data) return
    const init: Record<string, { h: string; a: string }> = {}
    for (const m of data.data) {
      init[m.id] = {
        h: m.myPrediction ? String(m.myPrediction.homePredict) : '',
        a: m.myPrediction ? String(m.myPrediction.awayPredict) : '',
      }
    }
    setDraft(init)
  }, [data])

  const grouped = useMemo(() => {
    const g: Record<string, MatchRow[]> = {}
    for (const m of data?.data ?? []) {
      ;(g[m.phase] ??= []).push(m)
    }
    return g
  }, [data])

  if (!data || data.data.length === 0) return null

  const canEdit = data.entryStatus === 'CONFIRMED'

  function set(id: string, side: 'h' | 'a', value: string) {
    setDraft((prev) => ({ ...prev, [id]: { ...prev[id], [side]: value } }))
  }

  async function save() {
    setSaving(true)
    setError(null)
    const predictions = (data?.data ?? [])
      .filter((m) => m.status === 'OPEN')
      .map((m) => ({ m, d: draft[m.id] }))
      .filter(({ d }) => d && d.h !== '' && d.a !== '')
      .map(({ m, d }) => ({
        matchId: m.id,
        homePredict: Number(d.h),
        awayPredict: Number(d.a),
      }))

    if (predictions.length === 0) {
      setSaving(false)
      setError('Completa al menos un marcador de un partido abierto')
      return
    }

    const res = await fetch('/api/mundial/matches', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ predictions }),
    })
    setSaving(false)
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      setError(j.error || 'No se pudo guardar')
      return
    }
    setSavedAt(new Date().toLocaleTimeString('es-CO'))
    refetch()
  }

  const hasOpen = data.data.some((m) => m.status === 'OPEN')

  return (
    <div className="max-w-2xl mx-auto px-4 pb-8">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-bebas text-3xl text-lt-white leading-none">Marcadores</h2>
        <span className="text-xs text-lt-muted">
          {data.pointsConfig.outcome} pts resultado · +{data.pointsConfig.exactBonus} exacto
        </span>
      </div>
      <p className="text-sm text-lt-muted mb-4">
        Pronostica el marcador de cada partido habilitado. Se cierran cuando el admin lo indique.
      </p>

      {Object.entries(grouped).map(([phase, matches]) => (
        <div key={phase} className="mb-5">
          <div className="text-[11px] font-condensed uppercase tracking-widest text-lt-green mb-2">
            {phase}
          </div>
          <div className="space-y-2">
            {matches.map((m) => {
              const editable = canEdit && m.status === 'OPEN'
              const d = draft[m.id] ?? { h: '', a: '' }
              return (
                <div
                  key={m.id}
                  className="rounded-card bg-lt-card border border-lt-card2 p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase tracking-wider text-lt-muted">
                      {STATUS_LABEL[m.status]}
                    </span>
                    {m.status === 'FINISHED' && (
                      <span className="text-[10px] text-lt-green">
                        Real: {m.homeScore}-{m.awayScore}
                        {m.myPrediction ? ` · +${m.myPrediction.pointsEarned} pts` : ''}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex-1 text-right text-lt-white text-sm truncate">
                      {m.homeFlag ? `${m.homeFlag} ` : ''}
                      {m.homeTeam}
                    </span>
                    <input
                      type="number"
                      min={0}
                      max={99}
                      disabled={!editable}
                      value={d.h}
                      onChange={(e) => set(m.id, 'h', e.target.value)}
                      className="w-12 text-center bg-lt-card2 border border-lt-card2 rounded px-1 py-1.5 text-lt-white disabled:opacity-60"
                    />
                    <span className="text-lt-muted">-</span>
                    <input
                      type="number"
                      min={0}
                      max={99}
                      disabled={!editable}
                      value={d.a}
                      onChange={(e) => set(m.id, 'a', e.target.value)}
                      className="w-12 text-center bg-lt-card2 border border-lt-card2 rounded px-1 py-1.5 text-lt-white disabled:opacity-60"
                    />
                    <span className="flex-1 text-left text-lt-white text-sm truncate">
                      {m.awayTeam}
                      {m.awayFlag ? ` ${m.awayFlag}` : ''}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {error && <p className="text-sm text-lt-red mb-3">{error}</p>}

      {canEdit && hasOpen && (
        <button
          onClick={save}
          disabled={saving}
          className="w-full font-condensed uppercase tracking-wider font-bold py-3 rounded-btn bg-lt-green text-black disabled:opacity-50"
        >
          {saving ? 'Guardando…' : savedAt ? `Marcadores guardados ${savedAt}` : 'Guardar marcadores'}
        </button>
      )}
    </div>
  )
}
