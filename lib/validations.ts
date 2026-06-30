import { z } from 'zod'

// ── Auth ──
export const registerHinchaSchema = z.object({
  name: z.string().min(2).max(60),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  city: z.string().max(60).optional(),
  favoriteTeam: z.string().max(60).optional(),
})

export const registerNegocioSchema = z.object({
  name: z.string().min(2).max(60),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  businessName: z.string().min(2).max(100),
  businessType: z.enum(['BAR', 'RESTAURANT', 'CLUB_CASINO', 'OTHER']),
  address: z.string().max(200).optional(),
  city: z.string().max(60).optional(),
  phone: z.string().max(20).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
})

// ── Profile ──
export const updateProfileSchema = z.object({
  name: z.string().min(2).max(60).optional(),
  bio: z.string().max(300).optional(),
  city: z.string().max(60).optional(),
  phone: z.string().max(20).optional(),
  favoriteTeam: z.string().max(60).optional(),
  image: z.string().url().optional(),
  birthDate: z.string().datetime().optional(),
  gender: z.enum(['MASCULINO', 'FEMENINO', 'OTRO', 'PREFIERO_NO_DECIR']).optional(),
})

// ── Check-in ──
export const checkinSchema = z.object({
  businessId: z.string().cuid(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
})

// ── Leagues ──
export const createLeagueSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(500).optional(),
  maxMembers: z.number().int().min(2).max(500).default(50),
  allowRemote: z.boolean().default(false),
  matchMode: z.enum(['PER_MATCH', 'SEASON']).default('PER_MATCH'),
})

export const updateLeagueSettingsSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  description: z.string().max(500).optional(),
  allowRemote: z.boolean().optional(),
  requireApproval: z.boolean().optional(),
  minConsumption: z.boolean().optional(),
  minConsumptionAmount: z.number().int().min(0).optional(),
  verificationType: z.enum(['QR', 'STAFF_CODE', 'RECEIPT']).nullable().optional(),
  matchMode: z.enum(['PER_MATCH', 'SEASON', 'HYBRID']).optional(),
  maxMembers: z.number().int().min(2).max(500).optional(),
})

export const joinLeagueSchema = z.object({
  inviteCode: z.string().min(4).max(20),
})

// ── Answers ──
export const submitAnswerSchema = z.object({
  questionId: z.string().cuid(),
  answer: z.string().min(1).max(200),
})

// ── Predictions ──
export const submitPredictionSchema = z.object({
  questionId: z.string().cuid(),
  answer: z.string().min(1).max(200),
})

// ── Questions ──
export const createQuestionSchema = z.object({
  matchId: z.string(),
  text: z.string().min(5).max(300),
  type: z.enum(['WINNER', 'SCORE', 'SCORER', 'YES_NO', 'RANGE', 'CUSTOM']),
  options: z.array(z.string().min(1).max(100)).min(2).max(10),
  pointsValue: z.number().int().min(1).max(1000).default(20),
  timing: z.enum(['PRE_MATCH', 'LIVE']).default('PRE_MATCH'),
})

// ── Promotions ──
export const createPromotionSchema = z.object({
  message: z.string().min(1).max(120),
  segment: z.enum(['ALL_IN_VENUE', 'LEAGUE_PLAYERS', 'VERIFIED_CONSUMERS', 'RECURRING']),
  channels: z.array(z.enum(['push', 'in-app', 'email'])).min(1),
  timing: z.enum(['IMMEDIATE', 'HALFTIME', 'SCHEDULED']).default('IMMEDIATE'),
  scheduledAt: z.string().datetime().optional(),
})

// ── Rewards ──
export const createRewardSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  imageUrl: z.string().url().optional(),
  pointsCost: z.number().int().min(1),
  stock: z.number().int().min(0).optional(),
  expiresAt: z.string().datetime().optional(),
})

export const updateRewardSchema = createRewardSchema.partial()

// ── Power-Ups ──
export const createPowerUpSchema = z.object({
  matchId: z.string(),
  question: z.string().min(5).max(300),
  options: z.array(z.string().min(1).max(100)).min(2).max(6),
  rewardText: z.string().min(1).max(200),
  durationSecs: z.number().int().min(10).max(120).default(30),
  trigger: z.enum(['MANUAL', 'GOAL', 'HALFTIME', 'MINUTE']).default('MANUAL'),
  triggerMin: z.number().int().min(1).max(120).optional(),
})

// ── Upload ──
export const uploadImageSchema = z.object({
  folder: z.enum(['avatars', 'logos', 'rewards']).default('avatars'),
})

// ── Payments (Wompi) ──
export const createPaymentSchema = z.object({
  planId: z.string(),
  amountInCents: z.number().int().min(100),
  currency: z.literal('COP').default('COP'),
  customerEmail: z.string().email(),
  redirectUrl: z.string().url(),
})

// ── Polla Mundialista ──

// Solicitud de cupo (participante)
export const poolEntrySchema = z.object({
  paymentNote: z.string().max(300).optional(),
})

// Guardado masivo de respuestas. answer admite string | number | string[] | { [grupo]: [1ro, 2do] }
const poolAnswerValue = z.union([
  z.string().max(200),
  z.number(),
  z.array(z.string().max(100)).max(48),
  z.record(z.string(), z.array(z.string().max(100)).max(4)),
])

export const poolAnswersSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.string().cuid(),
        answer: poolAnswerValue,
      })
    )
    .min(1)
    .max(60),
})

// Crear/editar pool (admin)
export const adminPoolSchema = z.object({
  name: z.string().min(2).max(100),
  season: z.string().max(10).default('2026'),
  entryFee: z.number().int().min(0).max(10_000_000),
  prizeSplit: z.array(z.number().int().min(0).max(100)).length(3).default([60, 30, 10]),
  status: z.enum(['DRAFT', 'OPEN_REGISTRATION', 'LOCKED', 'RESOLVED']).optional(),
  lockAt: z.string().datetime().nullable().optional(),
  nequiNumber: z.string().max(40).nullable().optional(),
  whatsappUrl: z.string().url().nullable().optional(),
  matchPointsOutcome: z.number().int().min(0).max(100).optional(),
  matchPointsExactBonus: z.number().int().min(0).max(100).optional(),
})

// Update SIN defaults (mismo motivo que en las preguntas)
export const adminPoolUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  season: z.string().max(10).optional(),
  entryFee: z.number().int().min(0).max(10_000_000).optional(),
  prizeSplit: z.array(z.number().int().min(0).max(100)).length(3).optional(),
  status: z.enum(['DRAFT', 'OPEN_REGISTRATION', 'LOCKED', 'RESOLVED']).optional(),
  lockAt: z.string().datetime().nullable().optional(),
  nequiNumber: z.string().max(40).nullable().optional(),
  whatsappUrl: z.string().url().nullable().optional(),
  matchPointsOutcome: z.number().int().min(0).max(100).optional(),
  matchPointsExactBonus: z.number().int().min(0).max(100).optional(),
})

// Crear/editar pregunta (admin)
export const adminPoolQuestionSchema = z.object({
  order: z.number().int().min(0).max(200),
  text: z.string().min(3).max(300),
  type: z.enum(['TEAM_PICK', 'PLAYER_PICK', 'YES_NO', 'SINGLE_CHOICE', 'NUMERIC', 'GROUP_RANK']),
  category: z.enum(['GLOBAL', 'COLOMBIA', 'BRACKET']).default('GLOBAL'),
  options: z.any().optional(),
  pointsValue: z.number().int().min(0).max(1000).default(20),
  isTiebreaker: z.boolean().default(false),
  tiebreakRank: z.number().int().min(1).max(10).nullable().optional(),
})

// Update SIN defaults: si se omite un campo, NO debe rellenarse con un valor
// por defecto (eso sobreescribía pts/categoría/desempate al guardar solo opciones).
export const adminPoolQuestionUpdateSchema = z.object({
  order: z.number().int().min(0).max(200).optional(),
  text: z.string().min(3).max(300).optional(),
  type: z.enum(['TEAM_PICK', 'PLAYER_PICK', 'YES_NO', 'SINGLE_CHOICE', 'NUMERIC', 'GROUP_RANK']).optional(),
  category: z.enum(['GLOBAL', 'COLOMBIA', 'BRACKET']).optional(),
  options: z.any().optional(),
  pointsValue: z.number().int().min(0).max(1000).optional(),
  isTiebreaker: z.boolean().optional(),
  tiebreakRank: z.number().int().min(1).max(10).nullable().optional(),
})

// Resolución (admin): respuestas correctas + valor real de goles Colombia
export const resolvePoolSchema = z.object({
  corrections: z
    .array(
      z.object({
        questionId: z.string().cuid(),
        correctAnswer: poolAnswerValue,
      })
    )
    .min(1),
  colombiaGoalsReal: z.number().int().min(0).max(100).nullable().optional(),
  totalGoalsReal: z.number().int().min(0).max(500).nullable().optional(),
})

// Resolución incremental de UNA pregunta (no cierra la polla).
// correctAnswer = null limpia la respuesta y resetea sus puntos.
export const questionResolveSchema = z.object({
  correctAnswer: poolAnswerValue.nullable(),
})

// ── Partidos de la polla ──

export const poolMatchSchema = z.object({
  homeTeam: z.string().min(1).max(60),
  awayTeam: z.string().min(1).max(60),
  homeFlag: z.string().max(200).nullable().optional(),
  awayFlag: z.string().max(200).nullable().optional(),
  phase: z.string().max(60).default('Fase de grupos'),
  kickoffAt: z.string().datetime().nullable().optional(),
  order: z.number().int().min(0).max(1000).default(0),
})

// Carga masiva (CSV ya parseado a array en el cliente)
export const poolMatchBulkSchema = z.object({
  matches: z.array(poolMatchSchema).min(1).max(200),
})

// Edición admin: status, datos, y marcador real
export const poolMatchUpdateSchema = z.object({
  homeTeam: z.string().min(1).max(60).optional(),
  awayTeam: z.string().min(1).max(60).optional(),
  homeFlag: z.string().max(200).nullable().optional(),
  awayFlag: z.string().max(200).nullable().optional(),
  phase: z.string().max(60).optional(),
  kickoffAt: z.string().datetime().nullable().optional(),
  order: z.number().int().min(0).max(1000).optional(),
  status: z.enum(['SCHEDULED', 'OPEN', 'CLOSED', 'FINISHED']).optional(),
  homeScore: z.number().int().min(0).max(99).nullable().optional(),
  awayScore: z.number().int().min(0).max(99).nullable().optional(),
  // Equipo que avanza en eliminación con empate a los 90' (prórroga/penales)
  advancesReal: z.string().max(60).nullable().optional(),
})

// Pronóstico de marcadores del participante
export const poolMatchPredictionsSchema = z.object({
  predictions: z
    .array(
      z.object({
        matchId: z.string().cuid(),
        homePredict: z.number().int().min(0).max(99),
        awayPredict: z.number().int().min(0).max(99),
        // Solo relevante en eliminación cuando se predice empate a los 90'
        advancesPredict: z.string().max(60).nullable().optional(),
      })
    )
    .min(1)
    .max(200),
})

// ── Battles ──
export const createBattleSchema = z.object({
  name: z.string().min(2).max(100),
  zone: z.string().min(2).max(100),
  matchIds: z.array(z.string()).min(1),
  prizeDesc: z.string().max(500).optional(),
  prizeAmount: z.number().int().min(0).optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
})
