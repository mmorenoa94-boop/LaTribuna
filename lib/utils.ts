import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Formatea puntos con separador de miles en es-CO */
export function formatPoints(points: number): string {
  return points.toLocaleString('es-CO')
}

/** Formatea precio en COP */
export function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount)
}

/** Genera un código de invitación aleatorio de 6 caracteres */
export function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

/** Calcula el XP necesario para el siguiente nivel */
export function xpForNextLevel(level: number): number {
  return level * 500
}

/** Calcula el porcentaje de XP en el nivel actual */
export function xpProgress(xp: number, level: number): number {
  const base = (level - 1) * 500
  const needed = xpForNextLevel(level)
  return Math.min(((xp - base) / (needed - base)) * 100, 100)
}

/** Formatea la duración de un timer en mm:ss */
export function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

/** Convierte minutos de partido a display */
export function formatMatchMinute(minute: number | null): string {
  if (!minute) return ''
  return `${minute}'`
}
