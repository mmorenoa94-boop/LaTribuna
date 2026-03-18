'use client'
import { signOut } from 'next-auth/react'

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/login' })}
      className="w-full py-3.5 rounded-btn border border-red-500/30 bg-red-500/10 text-red-400 font-condensed font-700 text-sm tracking-wide hover:bg-red-500/15 transition-colors"
    >
      Cerrar sesión
    </button>
  )
}
