'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

interface Props {
  leagueId: string
  initialName: string
  initialDescription: string | null
  initialMaxMembers: number
  initialAllowRemote: boolean
  initialAllowMemberInvites: boolean
  initialScoringMode: 'FIXED' | 'POOL'
  initialMatchMode: 'PER_MATCH' | 'SEASON'
  hasLinkedBusiness: boolean
}

export function SettingsTab({
  leagueId,
  initialName,
  initialDescription,
  initialMaxMembers,
  initialAllowRemote,
  initialAllowMemberInvites,
  initialScoringMode,
  initialMatchMode,
  hasLinkedBusiness,
}: Props) {
  const [name, setName] = useState(initialName)
  const [description, setDescription] = useState(initialDescription ?? '')
  const [maxMembers, setMaxMembers] = useState(initialMaxMembers)
  const [allowRemote, setAllowRemote] = useState(initialAllowRemote)
  const [allowMemberInvites, setAllowMemberInvites] = useState(initialAllowMemberInvites)
  const [scoringMode, setScoringMode] = useState(initialScoringMode)
  const [matchMode, setMatchMode] = useState(initialMatchMode)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [confirmReset, setConfirmReset] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [resetDone, setResetDone] = useState(false)

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch(`/api/leagues/${leagueId}/admin/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          maxMembers,
          allowRemote,
          allowMemberInvites,
          scoringMode,
          matchMode,
        }),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } finally {
      setSaving(false)
    }
  }

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

  const hasChanges =
    name.trim() !== initialName ||
    (description.trim() || null) !== (initialDescription || null) ||
    maxMembers !== initialMaxMembers ||
    allowRemote !== initialAllowRemote ||
    allowMemberInvites !== initialAllowMemberInvites ||
    scoringMode !== initialScoringMode ||
    matchMode !== initialMatchMode

  return (
    <div className="flex flex-col gap-6">
      {/* ── League settings ──────────────────────────────────── */}
      <div className="bg-lt-card rounded-card border border-[rgba(255,255,255,0.07)] p-5 space-y-4">
        <h3 className="font-condensed text-sm font-700 text-lt-white uppercase tracking-wide">
          Configuración de la liga
        </h3>

        {/* Name */}
        <div>
          <label className="block font-condensed text-xs text-lt-muted2 mb-1.5 uppercase tracking-wide">
            Nombre
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            className="w-full bg-lt-card2 border border-[rgba(255,255,255,0.07)] rounded-btn px-4 py-3 text-lt-white font-barlow text-sm outline-none focus:border-lt-green/40 transition-colors"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block font-condensed text-xs text-lt-muted2 mb-1.5 uppercase tracking-wide">
            Descripción
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={200}
            rows={3}
            className="w-full bg-lt-card2 border border-[rgba(255,255,255,0.07)] rounded-btn px-4 py-3 text-lt-white font-barlow text-sm outline-none focus:border-lt-green/40 transition-colors resize-none"
            placeholder="Descripción opcional de la liga"
          />
        </div>

        {/* Max members */}
        <div>
          <label className="block font-condensed text-xs text-lt-muted2 mb-1.5 uppercase tracking-wide">
            Máximo de miembros
          </label>
          <input
            type="number"
            value={maxMembers}
            onChange={(e) => setMaxMembers(Math.max(2, parseInt(e.target.value) || 2))}
            min={2}
            max={500}
            className="w-full bg-lt-card2 border border-[rgba(255,255,255,0.07)] rounded-btn px-4 py-3 text-lt-white font-barlow text-sm outline-none focus:border-lt-green/40 transition-colors"
          />
          <p className="font-condensed text-[10px] text-lt-muted2 mt-1">Mínimo 2, máximo 500</p>
        </div>

        {/* Scoring mode */}
        <div>
          <label className="block font-condensed text-xs text-lt-muted2 mb-2 uppercase tracking-wide">
            Modo de puntaje
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setScoringMode('FIXED')}
              className={`p-3 rounded-btn border text-left transition-all ${
                scoringMode === 'FIXED'
                  ? 'border-lt-green bg-lt-green/10'
                  : 'border-[rgba(255,255,255,0.07)] bg-lt-card2 hover:border-[rgba(255,255,255,0.15)]'
              }`}
            >
              <p className={`font-condensed text-sm font-700 ${scoringMode === 'FIXED' ? 'text-lt-green' : 'text-lt-white'}`}>
                Puntaje fijo
              </p>
              <p className="font-condensed text-[10px] text-lt-muted2 mt-0.5 leading-snug">
                Cada acierto da los puntos definidos en la pregunta
              </p>
            </button>
            <button
              type="button"
              onClick={() => setScoringMode('POOL')}
              className={`p-3 rounded-btn border text-left transition-all ${
                scoringMode === 'POOL'
                  ? 'border-lt-green bg-lt-green/10'
                  : 'border-[rgba(255,255,255,0.07)] bg-lt-card2 hover:border-[rgba(255,255,255,0.15)]'
              }`}
            >
              <p className={`font-condensed text-sm font-700 ${scoringMode === 'POOL' ? 'text-lt-green' : 'text-lt-white'}`}>
                Pozo
              </p>
              <p className="font-condensed text-[10px] text-lt-muted2 mt-0.5 leading-snug">
                Los puntos se reparten entre los que aciertan
              </p>
            </button>
          </div>
        </div>

        {/* Match Mode */}
        <div>
          <label className="block font-condensed text-xs text-lt-muted2 mb-2 uppercase tracking-wide">
            Modalidad de la liga
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setMatchMode('PER_MATCH')}
              className={`p-3 rounded-btn border text-left transition-all ${
                matchMode === 'PER_MATCH'
                  ? 'border-lt-green bg-lt-green/10'
                  : 'border-[rgba(255,255,255,0.07)] bg-lt-card2 hover:border-[rgba(255,255,255,0.15)]'
              }`}
            >
              <p className={`font-condensed text-sm font-700 ${matchMode === 'PER_MATCH' ? 'text-lt-green' : 'text-lt-white'}`}>
                Partido a partido
              </p>
              <p className="font-condensed text-[10px] text-lt-muted2 mt-0.5 leading-snug">
                Puntos se calculan por partido individual
              </p>
            </button>
            <button
              type="button"
              onClick={() => setMatchMode('SEASON')}
              className={`p-3 rounded-btn border text-left transition-all ${
                matchMode === 'SEASON'
                  ? 'border-lt-green bg-lt-green/10'
                  : 'border-[rgba(255,255,255,0.07)] bg-lt-card2 hover:border-[rgba(255,255,255,0.15)]'
              }`}
            >
              <p className={`font-condensed text-sm font-700 ${matchMode === 'SEASON' ? 'text-lt-green' : 'text-lt-white'}`}>
                Temporada
              </p>
              <p className="font-condensed text-[10px] text-lt-muted2 mt-0.5 leading-snug">
                Puntos se acumulan a lo largo de toda la temporada
              </p>
            </button>
          </div>
        </div>

        {/* Allow member invites */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-condensed text-sm text-lt-white font-700">Miembros pueden invitar</p>
            <p className="font-condensed text-[10px] text-lt-muted2">
              Permitir que los miembros compartan el código de invitación
            </p>
          </div>
          <button
            onClick={() => setAllowMemberInvites(!allowMemberInvites)}
            className={`relative w-12 h-7 rounded-full transition-colors ${
              allowMemberInvites ? 'bg-lt-green' : 'bg-lt-card2 border border-[rgba(255,255,255,0.15)]'
            }`}
          >
            <span
              className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all shadow-sm ${
                allowMemberInvites ? 'left-6' : 'left-1'
              }`}
            />
          </button>
        </div>

        {/* Allow remote — only for business-linked leagues */}
        {hasLinkedBusiness && (
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-condensed text-sm text-lt-white font-700">Permitir remotos</p>
              <p className="font-condensed text-[10px] text-lt-muted2">
                Miembros pueden participar sin estar en el local
              </p>
            </div>
            <button
              onClick={() => setAllowRemote(!allowRemote)}
              className={`relative w-12 h-7 rounded-full transition-colors ${
                allowRemote ? 'bg-lt-green' : 'bg-lt-card2 border border-[rgba(255,255,255,0.15)]'
              }`}
            >
              <span
                className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all shadow-sm ${
                  allowRemote ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>
        )}

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving || !hasChanges || !name.trim()}
          className="w-full py-3 rounded-btn bg-lt-green text-lt-black font-condensed text-sm font-700 disabled:opacity-40 active:scale-[0.98] transition-all"
        >
          {saving ? 'Guardando…' : saved ? '✓ Guardado' : 'Guardar cambios'}
        </button>
      </div>

      {/* ── Danger zone: Reset ───────────────────────────────── */}
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
    </div>
  )
}
