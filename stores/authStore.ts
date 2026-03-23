import { create } from 'zustand'
import type { UserRole } from '@prisma/client'

interface AuthUser {
  id: string
  name: string
  email: string
  image?: string | null
  role: UserRole
  level: number
  xp: number
}

interface AuthState {
  user: AuthUser | null
  setUser: (user: AuthUser | null) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}))
