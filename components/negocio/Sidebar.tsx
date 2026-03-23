'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'

interface Props {
  businessName: string
  businessLogo?: string | null
}

const NAV_ITEMS = [
  { href: '/dashboard',             label: 'Dashboard',    icon: ChartIcon },
  { href: '/dashboard/ligas',       label: 'Mis Ligas',    icon: TrophyIcon },
  { href: '/dashboard/promociones', label: 'Promociones',  icon: MegaphoneIcon },
  { href: '/dashboard/config',      label: 'Mi Negocio',   icon: StoreIcon },
]

export function Sidebar({ businessName, businessLogo }: Props) {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* ── Desktop Sidebar ─────────────────────────────────── */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-60 bg-lt-dark border-r border-[rgba(255,255,255,0.07)] flex-col z-40">
        {/* Brand */}
        <div className="px-5 pt-5 pb-4 border-b border-[rgba(255,255,255,0.07)]">
          <Link href="/dashboard" className="block">
            <p className="font-bebas text-2xl text-lt-amber tracking-wider leading-none">La Tribuna</p>
            <p className="font-condensed text-[10px] text-lt-muted2 uppercase tracking-widest mt-0.5">Negocio</p>
          </Link>
        </div>

        {/* Business info */}
        <div className="px-5 py-4 border-b border-[rgba(255,255,255,0.07)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-lt-amber/15 border border-lt-amber/30 flex items-center justify-center flex-shrink-0">
              {businessLogo ? (
                <img src={businessLogo} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="font-bebas text-lg text-lt-amber">
                  {businessName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="font-condensed text-sm font-700 text-lt-white truncate">{businessName}</p>
              <p className="font-condensed text-[10px] text-lt-muted2">Administrador</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-btn font-condensed text-sm font-600 transition-all',
                  active
                    ? 'bg-lt-amber/15 text-lt-amber border border-lt-amber/25'
                    : 'text-lt-muted2 hover:text-lt-white hover:bg-lt-card'
                )}
              >
                <Icon className="w-5 h-5" />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 pb-5">
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-btn font-condensed text-sm text-lt-muted2 hover:text-lt-red hover:bg-lt-red/10 transition-all"
          >
            <LogoutIcon className="w-5 h-5" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── Mobile Bottom Nav ───────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-lt-dark border-t border-[rgba(255,255,255,0.07)] safe-bottom">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex flex-col items-center gap-1 flex-1 py-2 transition-colors',
                  active ? 'text-lt-amber' : 'text-lt-muted2'
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-condensed font-600 tracking-wide">{label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}

// ── Icons ────────────────────────────────────────────────────
function ChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m7 17 4-8 4 4 5-9" />
    </svg>
  )
}
function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 9H4a2 2 0 0 1-2-2V5h4m10 4h2a2 2 0 0 0 2-2V5h-4M8 21h8M12 17v4m-4 0h8M7 5h10v7a5 5 0 0 1-10 0V5z" />
    </svg>
  )
}
function StoreIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v4M12 14v4M16 14v4" />
    </svg>
  )
}
function MegaphoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 0 1-3.417.592l-2.147-6.15M18 13a3 3 0 1 0 0-6M5.436 13.683A4.001 4.001 0 0 1 3 10V9a4 4 0 0 1 2.436-3.683L18 2v14L5.436 13.683z" />
    </svg>
  )
}
function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
  )
}
