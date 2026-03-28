'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  QUESTION_PROFILES,
  hydrateTemplate,
  type QuestionTemplate,
  type QuestionProfile,
} from '@/lib/question-templates'
import type { QuestionRow } from './AddQuestionModal'

interface Props {
  leagueId: string
  matchId: string
  homeTeam: string
  awayTeam: string
  open: boolean
  onClose: () => void
  onGenerated: (questions: QuestionRow[]) => void
}

interface SelectedTemplate extends QuestionTemplate {
  selected: boolean
  index: number
}

export function GenerateQuestionsModal({
  leagueId,
  matchId,
  homeTeam,
  awayTeam,
  open,
  onClose,
  onGenerated,
}: Props) {
  const [step, setStep] = useState<'profiles' | 'customize'>('profiles')
  const [selectedProfile, setSelectedProfile] = useState<QuestionProfile | null>(null)
  const [templates, setTemplates] = useState<SelectedTemplate[]>([])
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  function selectProfile(profile: QuestionProfile) {
    setSelectedProfile(profile)
    // Hydrate templates with team names
    const hydrated = profile.templates.map((t, i) => ({
      ...hydrateTemplate(t, homeTeam, awayTeam),
      selected: true,
      index: i,
    }))
    setTemplates(hydrated)
    setStep('customize')
    setError('')
  }

  function toggleTemplate(index: number) {
    setTemplates((prev) =>
      prev.map((t) => (t.index === index ? { ...t, selected: !t.selected } : t))
    )
  }

  function updatePoints(index: number, points: number) {
    setTemplates((prev) =>
      prev.map((t) => (t.index === index ? { ...t, points } : t))
    )
  }

  function goBack() {
    setStep('profiles')
    setSelectedProfile(null)
    setTemplates([])
    setError('')
  }

  const selectedCount = templates.filter((t) => t.selected).length

  async function handleGenerate() {
    const toCreate = templates.filter((t) => t.selected)
    if (toCreate.length === 0) return

    setGenerating(true)
    setError('')

    try {
      const res = await fetch(`/api/leagues/${leagueId}/admin/questions/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId,
          questions: toCreate.map((t) => ({
            text: t.text,
            type: t.type,
            options: t.options,
            pointsValue: t.points,
            timing: t.timing,
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al generar preguntas')
      onGenerated(data.questions)
      // Reset and close
      setStep('profiles')
      setSelectedProfile(null)
      setTemplates([])
      onClose()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setGenerating(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto bg-lt-dark border border-[rgba(255,255,255,0.1)] rounded-t-2xl md:rounded-2xl p-5 z-10"
      >
        <AnimatePresence mode="wait">
          {step === 'profiles' ? (
            <motion.div
              key="profiles"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.15 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-condensed text-base text-lt-green font-700">
                    Generar preguntas
                  </p>
                  <p className="font-barlow text-xs text-lt-muted2 mt-0.5">
                    {homeTeam} vs {awayTeam}
                  </p>
                </div>
                <button onClick={onClose} className="text-lt-muted2 hover:text-lt-white p-1">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <p className="font-barlow text-sm text-lt-muted2 mb-4">
                Elige un perfil para generar preguntas automáticamente con los nombres de los equipos.
              </p>

              {/* Profile cards */}
              <div className="space-y-2.5">
                {QUESTION_PROFILES.map((profile) => (
                  <button
                    key={profile.id}
                    onClick={() => selectProfile(profile)}
                    className="w-full bg-lt-card rounded-card border border-[rgba(255,255,255,0.07)] p-4 text-left hover:border-lt-green/40 transition-all active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{profile.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-condensed text-sm font-700 text-lt-white">
                          {profile.name}
                        </p>
                        <p className="font-barlow text-xs text-lt-muted2 mt-0.5">
                          {profile.description}
                        </p>
                      </div>
                      <span className="bg-lt-green/15 text-lt-green font-condensed text-xs font-700 px-2 py-1 rounded-full flex-shrink-0">
                        {profile.templates.length}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="customize"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.15 }}
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <button onClick={goBack} className="text-lt-muted2 hover:text-lt-white transition-colors">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <div className="flex-1">
                  <p className="font-condensed text-base text-lt-green font-700">
                    {selectedProfile?.icon} {selectedProfile?.name}
                  </p>
                  <p className="font-barlow text-xs text-lt-muted2">
                    {selectedCount} de {templates.length} seleccionadas
                  </p>
                </div>
                <button onClick={onClose} className="text-lt-muted2 hover:text-lt-white p-1">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* Select all / none */}
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => setTemplates((prev) => prev.map((t) => ({ ...t, selected: true })))}
                  className="font-condensed text-xs text-lt-green hover:underline"
                >
                  Todas
                </button>
                <span className="text-lt-muted2">·</span>
                <button
                  onClick={() => setTemplates((prev) => prev.map((t) => ({ ...t, selected: false })))}
                  className="font-condensed text-xs text-lt-muted2 hover:underline"
                >
                  Ninguna
                </button>
              </div>

              {/* Template list */}
              <div className="space-y-2 mb-4">
                {templates.map((t) => (
                  <div
                    key={t.index}
                    className={cn(
                      'rounded-btn border p-3 transition-all',
                      t.selected
                        ? 'bg-lt-green/5 border-lt-green/30'
                        : 'bg-lt-card border-[rgba(255,255,255,0.05)] opacity-50'
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      {/* Checkbox */}
                      <button
                        onClick={() => toggleTemplate(t.index)}
                        className={cn(
                          'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all',
                          t.selected
                            ? 'bg-lt-green border-lt-green'
                            : 'border-lt-muted'
                        )}
                      >
                        {t.selected && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                            <path d="m20 6-11 11-5-5" />
                          </svg>
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        {/* Question text */}
                        <p className="font-barlow text-sm text-lt-white leading-snug">
                          {t.text}
                        </p>

                        {/* Options preview */}
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {t.options.map((opt, oi) => (
                            <span
                              key={oi}
                              className="bg-lt-card2 text-lt-muted2 font-condensed text-[10px] px-1.5 py-0.5 rounded"
                            >
                              {opt}
                            </span>
                          ))}
                        </div>

                        {/* Meta row */}
                        <div className="flex items-center gap-2 mt-2">
                          <span className={cn(
                            'font-condensed text-[10px] font-700 uppercase tracking-wider px-1.5 py-0.5 rounded-full border',
                            t.timing === 'PRE_MATCH'
                              ? 'text-lt-amber bg-lt-amber/10 border-lt-amber/20'
                              : 'text-lt-red bg-lt-red/10 border-lt-red/20'
                          )}>
                            {t.timing === 'PRE_MATCH' ? '⏰ Pre' : '🔴 Vivo'}
                          </span>

                          {/* Points selector */}
                          {t.selected && (
                            <div className="flex items-center gap-1">
                              {[10, 15, 20, 25, 30].map((p) => (
                                <button
                                  key={p}
                                  onClick={() => updatePoints(t.index, p)}
                                  className={cn(
                                    'font-condensed text-[10px] font-700 px-1.5 py-0.5 rounded transition-all',
                                    t.points === p
                                      ? 'bg-lt-green/20 text-lt-green'
                                      : 'text-lt-muted2 hover:text-lt-white'
                                  )}
                                >
                                  {p}
                                </button>
                              ))}
                              <span className="font-condensed text-[10px] text-lt-muted2">pts</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {error && <p className="text-lt-red text-sm font-condensed mb-3">{error}</p>}

              {/* Generate button */}
              <button
                onClick={handleGenerate}
                disabled={generating || selectedCount === 0}
                className="w-full py-3.5 rounded-btn bg-lt-green text-lt-black font-condensed text-sm font-700 disabled:opacity-40 active:scale-[0.97] transition-all"
              >
                {generating
                  ? 'Generando...'
                  : `Crear ${selectedCount} pregunta${selectedCount !== 1 ? 's' : ''}`}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
