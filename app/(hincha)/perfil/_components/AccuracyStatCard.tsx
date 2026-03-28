'use client'

import { useState, useRef, useEffect } from 'react'
import { formatPoints } from '@/lib/utils'

export function AccuracyStatCard({ correct, total }: { correct: number; total: number }) {
  const [showTooltip, setShowTooltip] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showTooltip) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setShowTooltip(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showTooltip])

  const pct = total > 0 ? Math.round((correct / total) * 100) : 0

  return (
    <div ref={ref} className="relative bg-lt-card rounded-btn border border-[rgba(255,255,255,0.07)] px-3 py-3 flex flex-col items-center gap-1">
      <span className="text-xl">🎯</span>
      <p className="font-bebas text-xl text-lt-white leading-none tabular-nums">{formatPoints(correct)}</p>
      <div className="flex items-center gap-1">
        <p className="text-lt-muted2 font-condensed text-[10px] uppercase tracking-wider text-center">
          Aciertos
        </p>
        {total > 0 && (
          <button
            onClick={() => setShowTooltip(!showTooltip)}
            className="w-3.5 h-3.5 rounded-full border border-lt-muted2 flex items-center justify-center text-lt-muted2 hover:border-lt-green hover:text-lt-green transition-colors flex-shrink-0"
          >
            <span className="text-[8px] font-700 leading-none">i</span>
          </button>
        )}
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-lt-card2 border border-[rgba(255,255,255,0.15)] rounded-lg px-3 py-2 shadow-xl z-10 whitespace-nowrap">
          <p className="text-lt-white font-condensed text-xs font-700 tabular-nums">
            {correct}/{total} correctas · {pct}%
          </p>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-lt-card2 border-r border-b border-[rgba(255,255,255,0.15)] rotate-45" />
        </div>
      )}
    </div>
  )
}
