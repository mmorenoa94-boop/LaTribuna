'use client'
import { useState, useEffect, useCallback } from 'react'
import type { LeagueData } from './LeagueAdminPanel'

interface Prize {
  position: number
  description: string
  pointsValue: number
}

export function SettingsTab({ league, onUpdate }: { league: LeagueData; onUpdate: (l: LeagueData) => void }) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  async function toggle(key: keyof LeagueData, value: boolean) {
    const updated = { ...league, [key]: value }
    onUpdate(updated)
    await saveSettings({ [key]: value })
  }

  async function updateAmount(value: string) {
    const amount = value ? parseInt(value, 10) : null
    onUpdate({ ...league, minConsumptionAmount: amount })
  }

  async function saveSettings(partial: Record<string, unknown>) {
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/leagues/${league.id}/admin/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partial),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? 'Error al guardar')
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setSaving(false)
    }
  }

  async function saveAmount() {
    await saveSettings({ minConsumptionAmount: league.minConsumptionAmount })
  }

  return (
    <div className="space-y-4">
      {/* Match Mode */}
      <div className="bg-lt-card rounded-card border border-[rgba(255,255,255,0.07)] px-4 py-4">
        <label className="block text-lt-white font-condensed text-sm mb-2">Modalidad</label>
        <div className="grid grid-cols-2 gap-2">
          {([
            { value: 'PER_MATCH', label: 'Partido a partido' },
            { value: 'SEASON', label: 'Temporada' },
          ] as const).map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                onUpdate({ ...league, matchMode: value })
                saveSettings({ matchMode: value })
              }}
              className={`py-2.5 px-3 rounded-btn border font-condensed text-sm font-600 transition-all ${
                league.matchMode === value
                  ? 'bg-lt-amber/20 border-lt-amber text-lt-amber'
                  : 'bg-lt-card2 border-lt-muted text-lt-white hover:border-lt-amber/30'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Scoring Mode */}
      <div className="bg-lt-card rounded-card border border-[rgba(255,255,255,0.07)] px-4 py-4">
        <label className="block text-lt-white font-condensed text-sm mb-2">Tipo de puntaje</label>
        <div className="grid grid-cols-2 gap-2">
          {([
            { value: 'FIXED', label: 'Puntaje fijo', desc: 'Cada acierto da los puntos completos' },
            { value: 'POOL', label: 'Pozo', desc: 'Los puntos se reparten entre ganadores' },
          ] as const).map(({ value, label, desc }) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                onUpdate({ ...league, scoringMode: value })
                saveSettings({ scoringMode: value })
              }}
              className={`py-3 px-3 rounded-btn border font-condensed text-sm text-left transition-all ${
                league.scoringMode === value
                  ? 'bg-lt-amber/20 border-lt-amber text-lt-amber'
                  : 'bg-lt-card2 border-lt-muted text-lt-white hover:border-lt-amber/30'
              }`}
            >
              <p className="font-600">{label}</p>
              <p className="text-xs mt-0.5 opacity-70">{desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Allow Remote */}
      <ToggleRow
        title="Permitir remotos"
        description="Jugadores que no están físicamente en el local"
        checked={league.allowRemote}
        onChange={(v) => toggle('allowRemote', v)}
      />

      {/* Require Approval */}
      <ToggleRow
        title="Aprobación manual"
        description="Revisar y aprobar cada solicitud de ingreso"
        checked={league.requireApproval}
        onChange={(v) => toggle('requireApproval', v)}
      />

      {/* Allow Member Invites */}
      <ToggleRow
        title="Miembros pueden invitar"
        description="Permitir que los miembros compartan el código de invitación"
        checked={league.allowMemberInvites}
        onChange={(v) => toggle('allowMemberInvites', v)}
      />

      {/* Min Consumption */}
      <ToggleRow
        title="Consumo mínimo"
        description="Exigir un consumo mínimo para participar"
        checked={league.minConsumption}
        onChange={(v) => toggle('minConsumption', v)}
      />

      {/* Consumption amount (conditional) */}
      {league.minConsumption && (
        <div className="bg-lt-card rounded-card border border-[rgba(255,255,255,0.07)] px-4 py-4">
          <label className="block text-lt-white font-condensed text-sm mb-2">
            Monto mínimo <span className="text-lt-muted2">(COP)</span>
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={league.minConsumptionAmount ?? ''}
              onChange={(e) => updateAmount(e.target.value)}
              placeholder="Ej: 20000"
              min={0}
              className="flex-1 bg-lt-card2 border border-lt-muted rounded-btn px-4 py-3 text-lt-white font-barlow text-sm focus:outline-none focus:border-lt-amber transition-colors placeholder:text-lt-muted2"
            />
            <button
              onClick={saveAmount}
              disabled={saving}
              className="px-4 py-3 rounded-btn bg-lt-amber text-lt-black font-condensed text-sm font-700 disabled:opacity-40"
            >
              {saving ? '...' : 'Guardar'}
            </button>
          </div>
        </div>
      )}

      {/* Max Members */}
      <div className="bg-lt-card rounded-card border border-[rgba(255,255,255,0.07)] px-4 py-4">
        <label className="block text-lt-white font-condensed text-sm mb-2">Máximo de miembros</label>
        <select
          value={league.maxMembers}
          onChange={(e) => {
            const v = Number(e.target.value)
            onUpdate({ ...league, maxMembers: v })
            saveSettings({ maxMembers: v })
          }}
          className="w-full bg-lt-card2 border border-lt-muted text-lt-white font-condensed text-sm rounded-btn px-4 py-3 focus:outline-none focus:border-lt-amber"
        >
          {[10, 20, 50, 100, 200, 500].map((n) => (
            <option key={n} value={n}>{n} jugadores</option>
          ))}
        </select>
      </div>

      {/* Prizes */}
      <PrizesSection leagueId={league.id} />

      {error && <p className="text-lt-red text-sm font-condensed">{error}</p>}
      {saved && <p className="text-lt-green text-sm font-condensed">✓ Guardado</p>}
    </div>
  )
}

// ── Prizes Section ────────────────────────────────────────────────────
const MEDALS = ['🥇', '🥈', '🥉']

function PrizesSection({ leagueId }: { leagueId: string }) {
  const [prizes, setPrizes] = useState<Prize[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState(false)

  const fetchPrizes = useCallback(async () => {
    try {
      const res = await fetch(`/api/leagues/${leagueId}/admin/prizes`)
      if (res.ok) {
        const data = await res.json()
        setPrizes(data.map((p: { position: number; description: string; pointsValue: number }) => ({
          position: p.position,
          description: p.description,
          pointsValue: p.pointsValue,
        })))
      }
    } finally {
      setLoading(false)
    }
  }, [leagueId])

  useEffect(() => { fetchPrizes() }, [fetchPrizes])

  function addPrize() {
    const nextPos = prizes.length > 0 ? Math.max(...prizes.map((p) => p.position)) + 1 : 1
    if (nextPos > 10) return
    setPrizes([...prizes, { position: nextPos, description: '', pointsValue: 0 }])
  }

  function removePrize(pos: number) {
    setPrizes(prizes.filter((p) => p.position !== pos))
  }

  function updatePrize(pos: number, field: 'description' | 'pointsValue', value: string | number) {
    setPrizes(prizes.map((p) =>
      p.position === pos ? { ...p, [field]: value } : p
    ))
  }

  async function savePrizes() {
    setSaving(true)
    try {
      const res = await fetch(`/api/leagues/${leagueId}/admin/prizes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prizes: prizes.filter((p) => p.description.trim()) }),
      })
      if (res.ok) {
        const updated = await res.json()
        setPrizes(updated.map((p: { position: number; description: string; pointsValue: number }) => ({
          position: p.position,
          description: p.description,
          pointsValue: p.pointsValue,
        })))
        setSavedMsg(true)
        setTimeout(() => setSavedMsg(false), 2000)
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) return null

  return (
    <div className="bg-lt-card rounded-card border border-[rgba(255,255,255,0.07)] px-4 py-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lt-white font-condensed text-sm font-600">Premios</p>
          <p className="text-lt-muted2 text-xs font-barlow">Los usuarios verán estos premios en la clasificación</p>
        </div>
        {prizes.length < 10 && (
          <button
            onClick={addPrize}
            className="text-lt-amber font-condensed text-xs font-700 hover:underline"
          >
            + Agregar
          </button>
        )}
      </div>

      {prizes.length === 0 ? (
        <button
          onClick={addPrize}
          className="w-full py-4 rounded-btn border-2 border-dashed border-lt-muted text-lt-muted2 font-condensed text-sm hover:border-lt-amber/40 hover:text-lt-amber transition-colors"
        >
          🎁 Agregar primer premio
        </button>
      ) : (
        <>
          <div className="space-y-2">
            {prizes
              .sort((a, b) => a.position - b.position)
              .map((prize) => (
                <div key={prize.position} className="flex items-center gap-2">
                  <span className="text-lg w-6 text-center flex-shrink-0">
                    {MEDALS[prize.position - 1] ?? `#${prize.position}`}
                  </span>
                  <input
                    type="text"
                    value={prize.description}
                    onChange={(e) => updatePrize(prize.position, 'description', e.target.value)}
                    placeholder={`Premio ${prize.position}° lugar`}
                    className="flex-1 bg-lt-card2 border border-lt-muted rounded-btn px-3 py-2 text-lt-white font-barlow text-sm focus:outline-none focus:border-lt-amber transition-colors placeholder:text-lt-muted2 min-w-0"
                  />
                  <button
                    onClick={() => removePrize(prize.position)}
                    className="text-lt-muted2 hover:text-lt-red transition-colors flex-shrink-0 p-1"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={savePrizes}
              disabled={saving}
              className="px-4 py-2 rounded-btn bg-lt-amber text-lt-black font-condensed text-sm font-700 disabled:opacity-40"
            >
              {saving ? 'Guardando...' : 'Guardar premios'}
            </button>
            {savedMsg && (
              <span className="text-lt-green font-condensed text-xs">✓ Guardado</span>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function ToggleRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between bg-lt-card rounded-card border border-[rgba(255,255,255,0.07)] px-4 py-4">
      <div className="pr-4">
        <p className="text-lt-white font-condensed text-sm font-600">{title}</p>
        <p className="text-lt-muted2 text-xs font-barlow">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-lt-amber' : 'bg-lt-muted'}`}
      >
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
      </button>
    </div>
  )
}
