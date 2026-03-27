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

/** XP thresholds per level (cumulative) — must match lib/scoring.ts */
const LEVEL_THRESHOLDS = [
  0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5200,
  6600, 8200, 10000, 12000, 14500, 17500, 21000, 25000, 30000, 36000,
]

/** Calcula el XP necesario para el siguiente nivel */
export function xpForNextLevel(level: number): number {
  if (level >= LEVEL_THRESHOLDS.length) return LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]
  return LEVEL_THRESHOLDS[level]
}

/** Calcula el porcentaje de XP en el nivel actual */
export function xpProgress(xp: number, level: number): number {
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] ?? 0
  const nextThreshold = LEVEL_THRESHOLDS[level] ?? currentThreshold + 5000
  const current = xp - currentThreshold
  const needed = nextThreshold - currentThreshold
  return Math.min(Math.round((current / needed) * 100), 100)
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
