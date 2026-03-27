'use client'
import { xpProgress, xpForNextLevel } from '@/lib/utils'

interface XPBarProps {
  xp: number
  level: number
}

export function XPBar({ xp, level }: XPBarProps) {
  const pct = xpProgress(xp, level)
  const nextLevel = xpForNextLevel(level)

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-lt-muted2 text-xs font-condensed">Nivel {level}</span>
        <span className="text-lt-muted2 text-xs font-condensed">{xp} / {nextLevel} XP</span>
      </div>
      <div className="h-2 w-full bg-lt-card2 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-lt-green to-lt-gd relative animate-xp-fill"
          style={{ width: `${pct}%` }}
        >
          {/* glow on the tip */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white/60 blur-sm" />
        </div>
      </div>
    </div>
  )
}
