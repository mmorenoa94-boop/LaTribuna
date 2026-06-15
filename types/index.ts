import type {
  User, Business, League, Match, LeagueQuestion,
  LeagueMember, WalletTransaction, Reward, Notification,
  UserRole, LeagueType, MatchStatus, QuestionType,
  QuestionTiming, QuestionStatus, TransactionType,
  WorldCupPool, PoolQuestion, PoolEntry, PoolAnswer,
  PoolStatus, PoolEntryStatus, PoolQuestionType, PoolQuestionCategory,
} from '@prisma/client'

// Re-exportar tipos de Prisma
export type {
  User, Business, League, Match, LeagueQuestion,
  LeagueMember, WalletTransaction, Reward, Notification,
  UserRole, LeagueType, MatchStatus, QuestionType,
  QuestionTiming, QuestionStatus, TransactionType,
  WorldCupPool, PoolQuestion, PoolEntry, PoolAnswer,
  PoolStatus, PoolEntryStatus, PoolQuestionType, PoolQuestionCategory,
}

// Tipos extendidos para la UI

export interface LeagueWithDetails extends League {
  members: (LeagueMember & { user: Pick<User, 'id' | 'name' | 'image' | 'level'> })[]
  _count: { members: number }
  business?: Pick<Business, 'id' | 'name' | 'logoUrl'> | null
}

export interface MatchWithLeagues extends Match {
  leagueMatches: { league: Pick<League, 'id' | 'name' | 'type'> }[]
}

export interface LeagueQuestionWithAnswers extends LeagueQuestion {
  _count: { answers: number; predictions: number }
}

export interface UserProfile extends User {
  business?: Business | null
  _count: {
    leagueMemberships: number
    answers: number
    predictions: number
  }
}

export interface LeaderboardEntry {
  userId: string
  name: string
  image?: string | null
  points: number
  position: number
  level: number
}

export interface WalletSummary {
  balance: number
  transactions: WalletTransaction[]
}

// Tipos para el socket
export interface LiveQuestion {
  id: string
  leagueId: string
  matchId: string
  text: string
  type: QuestionType
  options: string[]
  pointsValue: number
  expiresAt: number // timestamp ms
}

export interface LivePowerUp {
  id: string
  question: string
  options: string[]
  rewardText: string
  expiresAt: number
}

// Respuestas de API

export interface ApiResponse<T> {
  data?: T
  error?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  perPage: number
}

// ── Polla Mundialista ──

// Pregunta para el participante (sin correctAnswer)
export interface PoolQuestionPublic {
  id: string
  order: number
  text: string
  type: PoolQuestionType
  category: PoolQuestionCategory
  options: unknown
  pointsValue: number
  isTiebreaker: boolean
}

export interface PoolWithQuestions extends WorldCupPool {
  questions: PoolQuestion[]
}

export interface PoolEntryWithAnswers extends PoolEntry {
  answers: PoolAnswer[]
}

// Estado que ve el participante en /mundial
export interface PoolStateResponse {
  pool: {
    id: string
    name: string
    season: string
    entryFee: number
    prizeSplit: number[]
    status: PoolStatus
    lockAt: string | null
    nequiNumber: string | null
    whatsappUrl: string | null
  } | null
  entry: {
    id: string
    status: PoolEntryStatus
    submittedAt: string | null
  } | null
  questions: PoolQuestionPublic[]
  myAnswers: Record<string, unknown> // questionId -> answer
  confirmedCount: number
}

export interface PoolRankingEntry {
  position: number
  userId: string
  name: string
  image?: string | null
  totalPoints: number
  groupsCorrect: number
  matchesCorrect: number // partidos con resultado (1X2) acertado
  prize: number // monto en COP (0 si no está en podio)
}
