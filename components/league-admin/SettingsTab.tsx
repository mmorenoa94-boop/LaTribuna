'use client'
import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import type { LeagueAdminData } from './types'

interface Prize {
  position: number
  description: string
  pointsValue: number
}

const LEAGUE_TYPE_OPTIONS = [
  { value: 'BUSINESS', label: 'Local', desc: 'Liga asociada a tu negocio' },
  { value: 'PRIVATE', label: 'Privada', desc: 'Solo tú puedes invitar' },
  { value: 'INVITE_ONLY', label: 'Con invitación', desc: 'Necesitan código para unirse' },
  { value: 'PUBLIC', label: 'Pública', desc: 'Cualquiera puede unirse' },
] as const

export function SettingsTab({ league, onUpdate }: { league: LeagueAdminData; onUpdate: (l: LeagueAdminData) => void }) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  async function toggle(key: keyof LeagueAdminData, value: boolean) {
    const updated = { ...league, [key]: value }
    onUpdate(updated)
    await saveSettings({ [key]: value })
  }

  async function changeType(type: string) {
    let defaults: Record<string, unknown> = { type }
    switch (type) {
      case 'PUBLIC':
        defaults = { ...defaults, requireApproval: false, allowMemberInvites: true, allowRemote: true }
        break
      case 'PRIVATE':
        defaults = { ...defaults, requireApproval: true, allowMemberInvites: false, allowRemote: false }
        break
      case 'INVITE_ONLY':
        defaults = { ...defaults, requireApproval: false, allowMemberInvites: true, allowRemote: true }
        break
      case 'BUSINESS':
        defaults = { ...defaults, requireApproval: false, allowMemberInvites: true, allowRemote: false }
        break
    }
    onUpdate({ ...league, ...defaults } as LeagueAdminData)
    await saveSettings(defaults)
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

  const [name, setName] = useState(league.name)
  const [description, setDescription] = useState(league.description ?? '')

  const inputCls = 'w-full bg-lt-card2 border border-lt-muted rounded-btn px-4 py-3 text-lt-white font-barlow text-sm focus:outline-none focus:border-lt-amber transition-colors placeholder:text-lt-muted2'

  // Filter type options: hide BUSINESS if not linked to a business
  const typeOptions = league.hasLinkedBusiness
    ? LEAGUE_TYPE_OPTIONS
    : LEAGUE_TYPE_OPTIONS.filter((t) => t.value !== 'BUSINESS')

  return (
    <div className="space-y-4">
      {/* League Name */}
      <div className="bg-lt-card rounded-card border border-[rgba(255,255,255,0.07)] px-4 py-4">
        <label className="block text-lt-white font-condensed text-sm mb-2">Nombre de la liga</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre de tu liga"
            className={inputCls}
          />
          <button
            onClick={() => {
              if (!name.trim()) return
              onUpdate({ ...league, name: name.trim() })
              saveSettings({ name: name.trim() })
            }}
            disabled={saving || name.trim() === league.name}
            className="px-4 py-3 rounded-btn bg-lt-amber text-lt-black font-condensed text-sm font-700 disabled:opacity-40 flex-shrink-0"
          >
            {saving ? '...' : 'Guardar'}
          </button>
        </div>
      </div>

      {/* League Description */}
      <div className="bg-lt-card rounded-card border border-[rgba(255,255,255,0.07)] px-4 py-4">
        <label className="block text-lt-white font-condensed text-sm mb-2">Descripción</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe tu liga..."
          rows={3}
          className={`${inputCls} resize-none`}
        />
        <button
          onClick={() => {
            onUpdate({ ...league, description: description.trim() })
            saveSettings({ description: description.trim() })
          }}
          disabled={saving || description.trim() === (league.description ?? '')}
          className="mt-2 px-4 py-2 rounded-btn bg-lt-amber text-lt-black font-condensed text-sm font-700 disabled:opacity-40"
        >
          {saving ? '...' : 'Guardar descripción'}
        </button>
      </div>

      {/* League Type */}
      <div className="bg-lt-card rounded-card border border-[rgba(255,255,255,0.07)] px-4 py-4">
        <label className="block text-lt-white font-condensed text-sm mb-2">Tipo de liga</label>
        <div className="grid grid-cols-2 gap-2">
          {typeOptions.map(({ value, label, desc }) => (
            <button
              key={value}
              type="button"
              onClick={() => changeType(value)}
              className={`py-3 px-3 rounded-btn border font-condensed text-sm text-left transition-all ${
                league.type === value
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

      {/* Reset league */}
      <ResetSection leagueId={league.id} />

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

// ── Reset Section ────────────────────────────────────────────────────
function ResetSection({ leagueId }: { leagueId: string }) {
  const [confirmReset, setConfirmReset] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [resetDone, setResetDone] = useState(false)

  async function handleReset() {
    setResetting(true)
    try {
      const res = await fetch(`/api/leagues/${leagueId}/admin/reset`, { method: 'POST' })
      if (res.ok) {
        setResetDone(true)
        setConfirmReset(false)
        setTimeout(() => setResetDone(false), 4000)
      }
    } finally {
      setResetting(false)
    }
  }

  return (
    <div className="bg-lt-card rounded-card border border-lt-red/20 p-5 space-y-4">
      <h3 className="font-condensed text-sm font-700 text-lt-red uppercase tracking-wide flex items-center gap-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        Zona peligrosa
      </h3>

      <div>
        <p className="font-condensed text-sm text-lt-white font-700">Reiniciar liga</p>
        <p className="font-condensed text-xs text-lt-muted2 mt-1 leading-relaxed">
          Esto pone todos los puntos de los miembros en 0, borra todas las respuestas y predicciones,
          y reinicia las preguntas a estado pendiente. Los miembros y partidos se mantienen.
        </p>
      </div>

      {resetDone && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-lt-green/10 border border-lt-green/30 rounded-btn px-4 py-2.5"
        >
          <p className="font-condensed text-sm text-lt-green font-700">
            ✓ Liga reiniciada correctamente. Todos los puntos están en 0.
          </p>
        </motion.div>
      )}

      {!confirmReset ? (
        <button
          onClick={() => setConfirmReset(true)}
          className="w-full py-3 rounded-btn bg-lt-red/15 border border-lt-red/30 text-lt-red font-condensed text-sm font-700 hover:bg-lt-red/25 active:scale-[0.98] transition-all"
        >
          Reiniciar liga
        </button>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-3"
        >
          <p className="font-condensed text-sm text-lt-white text-center font-700">
            ¿Estás seguro? Esta acción no se puede deshacer.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setConfirmReset(false)}
              className="flex-1 py-2.5 rounded-btn bg-lt-card2 border border-[rgba(255,255,255,0.07)] text-lt-muted2 font-condensed text-sm font-700 hover:text-lt-white transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleReset}
              disabled={resetting}
              className="flex-1 py-2.5 rounded-btn bg-lt-red text-white font-condensed text-sm font-700 disabled:opacity-50 active:scale-[0.98] transition-all"
            >
              {resetting ? 'Reiniciando…' : 'Sí, reiniciar'}
            </button>
          </div>
        </motion.div>
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
