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
