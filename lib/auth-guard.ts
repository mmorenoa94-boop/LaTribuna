import { auth } from './auth'
import { NextResponse } from 'next/server'
import type { UserRole } from '@prisma/client'

interface AuthResult {
  session: {
    user: {
      id: string
      email: string
      name: string
      role: UserRole
      image?: string | null
      level: number
      xp: number
    }
  }
}

/**
 * Require authenticated session, optionally enforce role.
 * Returns session or NextResponse error.
 */
export async function requireAuth(
  requiredRole?: UserRole | UserRole[]
): Promise<AuthResult | NextResponse> {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
    if (!roles.includes(session.user.role as UserRole)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }
  }
  return { session } as AuthResult
}

// Type guard
export function isAuthError(result: AuthResult | NextResponse): result is NextResponse {
  return result instanceof NextResponse
}
