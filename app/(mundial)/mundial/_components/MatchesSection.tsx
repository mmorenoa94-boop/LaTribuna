'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  NO_DATE_KEY,
  dayKey,
  buildPredictionsPayload,
  countUnsaved,
  currentDayKey,
  needsAdvancePick,
  pickDefaultDay,
  relativeDayLabel,
} from '@/lib/mundial-matches-pure'

type MatchRow = {
  id: string
  homeTeam: string
  awayTeam: string
  homeFlag: string | null
  awayFlag: string | null
  phase: string
  groupName: string | null
  kickoffAt: string | null
  status: 'OPEN' | 'CLOSED' | 'FINISHED'
  homeScore: number | null
  awayScore: number | null
  advancesReal: string | null
  myPrediction: {
    homePredict: number
    awayPredict: number
    advancesPredict: string | null
    pointsEarned: number
  } | null
}

type MatchesResponse = {
  data: MatchRow[]
  entryStatus: string | null
  pointsConfig: { outcome: number; exactBonus: number; advance: number }
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

// La fecha/hora se guarda como hora-pared de Colombia dentro de un instante UTC
// (ej. 21:00 CO => ...T21:00:00Z). Por eso etiquetamos y mostramos la hora SIEMPRE en UTC:
// así un partido nocturno no se corre de día y la hora mostrada es la de Colombia.
// (dayKey/NO_DATE_KEY viven en lib/mundial-matches-pure para poder testearlos.)
function dayLabel(iso: string | null): string {
  if (!iso) return 'Sin fecha'
  const label = new Date(iso).toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  })
  return label.replace(',', '').toUpperCase() // "JUEVES 11 DE JUNIO"
}

function timeLabel(iso: string | null): string | null {
  if (!iso) return null
  return new Date(iso).toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  })
}

export default function MatchesSection() {
  const { data, refetch } = useQuery({
    queryKey: ['mundial-matches'],
    queryFn: fetchMatches,
    refetchInterval: 60_000,
  })

  const [draft, setDraft] = useState<Record<string, { h: string; a: string; adv?: string }>>({})
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  // null = aún sin elección del usuario → se usa el día por defecto (hoy / próximo).
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  // "Hoy" en la convención del proyecto (hora-pared de Colombia embebida en UTC).
  const today = useMemo(() => currentDayKey(new Date()), [])

  // Inicializa el borrador con TODAS las predicciones existentes (no solo el día visible),
  // para que al guardar nunca se pierdan los marcadores escritos en otros días.
  useEffect(() => {
    if (!data) return
    const init: Record<string, { h: string; a: string; adv?: string }> = {}
    for (const m of data.data) {
      init[m.id] = {
        h: m.myPrediction ? String(m.myPrediction.homePredict) : '',
        a: m.myPrediction ? String(m.myPrediction.awayPredict) : '',
        adv: m.myPrediction?.advancesPredict ?? undefined,
      }
    }
    setDraft(init)
  }, [data])

  // Días ordenados cronológicamente (el "sin fecha" va al final).
  const days = useMemo(() => {
    const map = new Map<string, { key: string; label: string; count: number }>()
    for (const m of data?.data ?? []) {
      const key = dayKey(m.kickoffAt)
      const existing = map.get(key)
      if (existing) existing.count++
      else map.set(key, { key, label: dayLabel(m.kickoffAt), count: 1 })
    }
    return Array.from(map.values()).sort((a, b) => {
      if (a.key === NO_DATE_KEY) return 1
      if (b.key === NO_DATE_KEY) return -1
      return a.key < b.key ? -1 : a.key > b.key ? 1 : 0
    })
  }, [data])

  // Día efectivo: el elegido por el usuario, o el default (hoy / próximo con partidos).
  const activeDay = selectedDay ?? pickDefaultDay(days.map((d) => d.key), today)

  // Centra la pestaña activa en el carrusel cuando cambia (incluye el default inicial).
  const activeTabRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    activeTabRef.current?.scrollIntoView({ inline: 'center', block: 'nearest' })
  }, [activeDay])

  // Partidos del/los día(s) visible(s), agrupados por día para mostrar el encabezado.
  const visibleGroups = useMemo(() => {
    const wanted = activeDay === 'ALL' ? days.map((d) => d.key) : [activeDay]
    return wanted
      .map((key) => ({
        key,
        label: days.find((d) => d.key === key)?.label ?? '',
        matches: (data?.data ?? []).filter((m) => dayKey(m.kickoffAt) === key),
      }))
      .filter((g) => g.matches.length > 0)
  }, [data, days, activeDay])

  // Marcadores completos (de partidos abiertos) que difieren de lo ya guardado en BD.
  const unsavedCount = useMemo(() => countUnsaved(data?.data ?? [], draft), [data, draft])

  if (!data || data.data.length === 0) return null

  const canEdit = data.entryStatus === 'CONFIRMED'

  function set(id: string, side: 'h' | 'a', value: string) {
    setDraft((prev) => ({ ...prev, [id]: { ...prev[id], [side]: value } }))
  }

  function setAdv(id: string, team: string) {
    setDraft((prev) => ({ ...prev, [id]: { ...prev[id], adv: team } }))
  }

  async function save() {
    setSaving(true)
    setError(null)
    // Recorre TODOS los partidos abiertos (sin importar el día visible) y manda los que tengan marcador.
    const predictions = buildPredictionsPayload(data?.data ?? [], draft)

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
          {data.pointsConfig.outcome} pts resultado · +{data.pointsConfig.exactBonus} exacto · +
          {data.pointsConfig.advance} avanza
        </span>
      </div>
      <p className="text-sm text-lt-muted mb-3">
        Pronostica el marcador de cada partido habilitado. Se cierran cuando el admin lo indique.
      </p>
      <div className="rounded-card bg-lt-amber/10 border border-lt-amber/40 px-3 py-2 mb-4">
        <p className="text-xs text-lt-amber leading-snug">
          ⚠️ En eliminación directa el marcador cuenta a los <b>90 minutos</b> (tiempo reglamentario).
          La prórroga y los penales no suman — sí puede haber empate. Acertar <b>quién avanza</b> suma{' '}
          <b>+{data.pointsConfig.advance}</b> extra (hasta {data.pointsConfig.outcome + data.pointsConfig.exactBonus + data.pointsConfig.advance} pts por partido).
        </p>
      </div>

      {/* Selector de día: TODOS + cada fecha */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-1 px-1">
        <button
          onClick={() => setSelectedDay('ALL')}
          className={`shrink-0 px-3 py-1.5 rounded-btn text-xs font-condensed uppercase tracking-wider whitespace-nowrap ${
            activeDay === 'ALL'
              ? 'bg-lt-green text-black'
              : 'bg-lt-card border border-lt-card2 text-lt-muted'
          }`}
        >
          Todos
        </button>
        {days.map((d) => {
          const rel = relativeDayLabel(d.key, today)
          return (
            <button
              key={d.key}
              ref={activeDay === d.key ? activeTabRef : undefined}
              onClick={() => setSelectedDay(d.key)}
              className={`shrink-0 px-3 py-1.5 rounded-btn text-xs font-condensed uppercase tracking-wider whitespace-nowrap ${
                activeDay === d.key
                  ? 'bg-lt-green text-black'
                  : 'bg-lt-card border border-lt-card2 text-lt-muted'
              }`}
            >
              {rel ? `${rel} · ${d.label}` : d.label}
            </button>
          )
        })}
      </div>

      {visibleGroups.map((group) => (
        <div key={group.key} className="mb-5">
          <div className="flex items-center justify-between bg-lt-card2 rounded-card px-3 py-2 mb-2">
            <span className="text-[11px] font-condensed uppercase tracking-widest text-lt-white">
              {group.label}
            </span>
            <span className="text-[10px] text-lt-muted">
              {group.matches.length} {group.matches.length === 1 ? 'partido' : 'partidos'}
            </span>
          </div>
          <div className="space-y-2">
            {group.matches.map((m) => {
              const editable = canEdit && m.status === 'OPEN'
              const d = draft[m.id] ?? { h: '', a: '' }
              const hora = timeLabel(m.kickoffAt)
              return (
                <div key={m.id} className="rounded-card bg-lt-card border border-lt-card2 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="flex items-center gap-2">
                      {m.groupName && (
                        <span className="text-[10px] font-condensed uppercase tracking-wider text-lt-green border border-lt-green/40 rounded px-1.5 py-0.5">
                          Grupo {m.groupName}
                        </span>
                      )}
                      <span className="text-[10px] uppercase tracking-wider text-lt-muted">
                        {STATUS_LABEL[m.status]}
                      </span>
                    </span>
                    {m.status === 'FINISHED' ? (
                      <span className="text-[10px] text-lt-green">
                        Real: {m.homeScore}-{m.awayScore}
                        {m.myPrediction ? ` · +${m.myPrediction.pointsEarned} pts` : ''}
                      </span>
                    ) : (
                      hora && <span className="text-[10px] text-lt-muted">{hora}</span>
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

                  {/* Eliminación + empate a los 90' → ¿quién avanza? (prórroga/penales) */}
                  {editable && needsAdvancePick(m.phase, Number(d.h), Number(d.a)) && d.h !== '' && d.a !== '' && (
                    <div className="mt-3 pt-3 border-t border-lt-card2">
                      <span className="block text-[10px] uppercase tracking-wider text-lt-amber mb-1.5">
                        Empate a los 90&apos; · ¿Quién avanza? (+{data.pointsConfig.advance})
                      </span>
                      <div className="flex gap-2">
                        {[m.homeTeam, m.awayTeam].map((team) => (
                          <button
                            key={team}
                            type="button"
                            onClick={() => setAdv(m.id, team)}
                            className={`flex-1 text-xs py-2 rounded-btn border transition-colors ${
                              d.adv === team
                                ? 'bg-lt-green text-black border-lt-green font-bold'
                                : 'bg-lt-card2 text-lt-white border-lt-card2'
                            }`}
                          >
                            {team}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Finalizado por prórroga/penales → quién avanzó realmente */}
                  {m.status === 'FINISHED' && m.advancesReal && (
                    <div className="mt-2 pt-2 border-t border-lt-card2 text-[11px] text-lt-muted">
                      Avanzó por penales/prórroga:{' '}
                      <span className="text-lt-green">{m.advancesReal}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {canEdit && hasOpen && (
        <div className="sticky bottom-0 mt-6 -mx-4 px-4 py-3 bg-lt-black/90 backdrop-blur border-t border-lt-card2">
          {error && <p className="text-sm text-lt-red mb-2 text-center">{error}</p>}
          {unsavedCount > 0 && !saving && (
            <p className="text-xs text-lt-amber mb-2 text-center">
              Tienes {unsavedCount} {unsavedCount === 1 ? 'marcador' : 'marcadores'} sin guardar
            </p>
          )}
          <button
            onClick={save}
            disabled={saving}
            className="w-full font-condensed uppercase tracking-wider font-bold py-3 rounded-btn bg-lt-green text-black disabled:opacity-50"
          >
            {saving
              ? 'Guardando…'
              : unsavedCount > 0
                ? `Guardar marcadores (${unsavedCount})`
                : savedAt
                  ? `Marcadores guardados ${savedAt}`
                  : 'Guardar marcadores'}
          </button>
        </div>
      )}
    </div>
  )
}
