'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  category: string
  xpReward: number
  order: number
  secret?: boolean
  unlocked: boolean
  unlockedAt: string | null
}

interface CategoryInfo {
  label: string
  icon: string
}

interface AchievementsData {
  achievements: Achievement[]
  categories: Record<string, CategoryInfo>
  stats: { unlocked: number; total: number; pct: number }
}

/**
 * Full achievements grid — shows all achievements organized by category.
 * Unlocked ones are highlighted, locked ones are dimmed.
 * Optional: show only unlocked count in compact mode.
 */
export function AchievementsGrid({ compact = false }: { compact?: boolean }) {
  const [data, setData] = useState<AchievementsData | null>(null)
  const [expanded, setExpanded] = useState(!compact)
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null)

  useEffect(() => {
    fetch('/api/achievements')
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
  }, [])

  if (!data) return null

  const { achievements, categories, stats } = data

  // Group by category
  const grouped = Object.entries(categories).map(([key, catInfo]) => ({
    key,
    ...catInfo,
    items: achievements
      .filter((a) => a.category === key)
      .sort((a, b) => a.order - b.order),
  })).filter((g) => g.items.length > 0)

  if (compact && !expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="w-full bg-lt-card rounded-card border border-[rgba(255,255,255,0.07)] p-4 text-left hover:border-lt-green/20 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏆</span>
            <div>
              <p className="font-condensed text-sm text-lt-white font-700">Logros</p>
              <p className="font-condensed text-xs text-lt-muted2">
                {stats.unlocked} de {stats.total} desbloqueados
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Mini progress ring */}
            <div className="relative w-10 h-10">
              <svg viewBox="0 0 36 36" className="w-10 h-10 -rotate-90">
                <circle
                  cx="18" cy="18" r="15.5"
                  fill="none"
                  stroke="rgba(255,255,255,0.07)"
                  strokeWidth="3"
                />
                <circle
                  cx="18" cy="18" r="15.5"
                  fill="none"
                  stroke="#00E676"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${stats.pct * 0.975} 97.5`}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center font-bebas text-xs text-lt-green">
                {stats.pct}%
              </span>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-lt-muted2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>

        {/* Unlocked badges preview */}
        {stats.unlocked > 0 && (
          <div className="flex gap-1.5 mt-3 flex-wrap">
            {achievements
              .filter((a) => a.unlocked)
              .slice(0, 8)
              .map((a) => (
                <span
                  key={a.id}
                  className="w-8 h-8 rounded-full bg-lt-green/15 border border-lt-green/30 flex items-center justify-center text-base"
                  title={a.name}
                >
                  {a.icon}
                </span>
              ))}
            {stats.unlocked > 8 && (
              <span className="w-8 h-8 rounded-full bg-lt-card2 border border-[rgba(255,255,255,0.07)] flex items-center justify-center font-condensed text-xs text-lt-muted2">
                +{stats.unlocked - 8}
              </span>
            )}
          </div>
        )}
      </button>
    )
  }

  return (
    <div className="bg-lt-card rounded-card border border-[rgba(255,255,255,0.07)] overflow-hidden">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-[rgba(255,255,255,0.06)]">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏆</span>
          <div>
            <p className="font-condensed text-sm text-lt-white font-700">Logros</p>
            <p className="font-condensed text-xs text-lt-muted2">
              {stats.unlocked} de {stats.total} desbloqueados ({stats.pct}%)
            </p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="w-20 h-2 bg-lt-card2 rounded-full overflow-hidden">
          <div
            className="h-full bg-lt-green rounded-full transition-all"
            style={{ width: `${stats.pct}%` }}
          />
        </div>
      </div>

      {/* Categories */}
      <div className="divide-y divide-[rgba(255,255,255,0.04)]">
        {grouped.map((cat) => (
          <div key={cat.key} className="px-4 py-3">
            <p className="font-condensed text-xs text-lt-muted2 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <span>{cat.icon}</span>
              {cat.label}
              <span className="text-lt-green ml-auto">
                {cat.items.filter((a) => a.unlocked).length}/{cat.items.length}
              </span>
            </p>
            <div className="grid grid-cols-4 gap-2">
              {cat.items.map((achievement) => {
                const isSecret = achievement.secret && !achievement.unlocked
                return (
                  <button
                    key={achievement.id}
                    onClick={() => setSelectedAchievement(achievement)}
                    className={cn(
                      'relative flex flex-col items-center gap-1 p-2 rounded-btn border transition-all text-center',
                      achievement.unlocked
                        ? 'bg-lt-green/10 border-lt-green/30 hover:bg-lt-green/20'
                        : 'bg-lt-card2 border-[rgba(255,255,255,0.05)] opacity-50 hover:opacity-70'
                    )}
                  >
                    <span className={cn('text-2xl', !achievement.unlocked && !isSecret && 'grayscale')}>
                      {isSecret ? '❓' : achievement.icon}
                    </span>
                    <p className={cn(
                      'font-condensed text-[10px] leading-tight',
                      achievement.unlocked ? 'text-lt-white' : 'text-lt-muted2'
                    )}>
                      {isSecret ? '???' : achievement.name}
                    </p>
                    {achievement.unlocked && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-lt-green flex items-center justify-center">
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#0A0C0F" strokeWidth="4">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Collapse button in compact mode */}
      {compact && (
        <button
          onClick={() => setExpanded(false)}
          className="w-full py-2.5 border-t border-[rgba(255,255,255,0.06)] text-lt-muted2 font-condensed text-xs hover:text-lt-white transition-colors flex items-center justify-center gap-1"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="rotate-180">
            <polyline points="6 9 12 15 18 9" />
          </svg>
          Ocultar
        </button>
      )}

      {/* Achievement detail modal */}
      <AnimatePresence>
        {selectedAchievement && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedAchievement(null)}
              className="fixed inset-0 bg-black/60 z-[80]"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-[85vw] max-w-[320px] bg-lt-card rounded-card border border-[rgba(255,255,255,0.1)] p-6 z-[90] text-center"
            >
              <div className={cn(
                'w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center',
                selectedAchievement.unlocked
                  ? 'bg-lt-green/15 border-2 border-lt-green/40'
                  : 'bg-lt-card2 border-2 border-[rgba(255,255,255,0.1)]'
              )}>
                <span className={cn('text-4xl', !selectedAchievement.unlocked && 'grayscale')}>
                  {selectedAchievement.secret && !selectedAchievement.unlocked ? '❓' : selectedAchievement.icon}
                </span>
              </div>

              <h3 className={cn(
                'font-bebas text-xl leading-none mb-1',
                selectedAchievement.unlocked ? 'text-lt-green' : 'text-lt-white'
              )}>
                {selectedAchievement.secret && !selectedAchievement.unlocked ? '???' : selectedAchievement.name}
              </h3>

              <p className="font-condensed text-sm text-lt-muted2 mb-3">
                {selectedAchievement.secret && !selectedAchievement.unlocked
                  ? 'Logro secreto. Sigue jugando para descubrirlo.'
                  : selectedAchievement.description
                }
              </p>

              <div className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-condensed text-xs font-700',
                selectedAchievement.unlocked
                  ? 'bg-lt-green/15 text-lt-green'
                  : 'bg-lt-card2 text-lt-muted2'
              )}>
                {selectedAchievement.unlocked ? (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Desbloqueado
                    {selectedAchievement.unlockedAt && (
                      <span className="text-lt-green/60 ml-1">
                        {new Date(selectedAchievement.unlockedAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    🔒 Bloqueado · +{selectedAchievement.xpReward} XP al desbloquear
                  </>
                )}
              </div>

              <button
                onClick={() => setSelectedAchievement(null)}
                className="mt-4 w-full py-2.5 rounded-btn bg-lt-card2 border border-[rgba(255,255,255,0.07)] text-lt-white font-condensed text-sm font-700"
              >
                Cerrar
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
