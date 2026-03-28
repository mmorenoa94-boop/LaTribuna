'use client'
import { useState } from 'react'
import type { LeagueData } from './LeagueAdminPanel'

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

      {error && <p className="text-lt-red text-sm font-condensed">{error}</p>}
      {saved && <p className="text-lt-green text-sm font-condensed">✓ Guardado</p>}
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
