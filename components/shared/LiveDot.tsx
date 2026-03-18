import { cn } from '@/lib/utils'

interface LiveDotProps {
  className?: string
  label?: string
}

export function LiveDot({ className, label = 'EN VIVO' }: LiveDotProps) {
  return (
    <span className={cn('flex items-center gap-1.5', className)}>
      <span className="w-2 h-2 rounded-full bg-lt-red animate-pulse-dot" />
      <span className="text-lt-red text-xs font-condensed font-700 tracking-wider">{label}</span>
    </span>
  )
}
