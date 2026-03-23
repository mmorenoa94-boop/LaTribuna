'use client'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { TabPartidos } from './TabPartidos'
import { TabClasificacion } from './TabClasificacion'
import { TabMiembros } from './TabMiembros'
import type { SLeague, SPrediction } from './types'

type Tab = 'partidos' | 'clasificacion' | 'miembros'

interface Props {
  league: SLeague
  userId: string
  userPoints: number
  userPosition: number
  isCreator: boolean
  predictions: SPrediction[]
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'partidos',      label: 'Partidos'      },
  { id: 'clasificacion', label: 'Clasificación' },
  { id: 'miembros',      label: 'Miembros'      },
]

export function LigaTabs(props: Props) {
  const [active, setActive] = useState<Tab>('partidos')

  return (
    <div className="flex flex-col flex-1">
      {/* Tab bar */}
      <div className="flex bg-lt-dark border-b border-[rgba(255,255,255,0.07)] sticky top-0 z-10">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={cn(
              'flex-1 py-3 font-condensed text-sm font-700 uppercase tracking-wider transition-colors relative',
              active === t.id ? 'text-lt-green' : 'text-lt-muted2 hover:text-lt-white'
            )}
          >
            {t.label}
            {active === t.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-lt-green rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 px-4 py-4">
        {active === 'partidos'      && <TabPartidos      {...props} />}
        {active === 'clasificacion' && <TabClasificacion {...props} />}
        {active === 'miembros'      && <TabMiembros      {...props} />}
      </div>
    </div>
  )
}
