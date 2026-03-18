'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { cn } from '@/lib/utils'

/* ---------- Types ---------- */

interface Business {
  id: string
  name: string
  type: string
  logoUrl: string | null
  address: string | null
  city: string | null
  distance: number | null
  checkinRadius: number
}

interface ActiveCheckin {
  id: string
  checkedAt: string
  business: {
    id: string
    name: string
    logoUrl: string | null
    address: string | null
  }
}

/* ---------- Helpers ---------- */

const TYPE_LABELS: Record<string, string> = {
  BAR: 'Bar',
  RESTAURANT: 'Restaurante',
  CLUB_CASINO: 'Club / Casino',
  OTHER: 'Otro',
}

const TYPE_ICONS: Record<string, string> = {
  BAR: '\u{1F37A}',
  RESTAURANT: '\u{1F37D}\uFE0F',
  CLUB_CASINO: '\u{1F3B0}',
  OTHER: '\u{1F4CD}',
}

function formatDistance(meters: number | null): string {
  if (meters === null) return '—'
  if (meters < 1000) return `${Math.round(meters)}m`
  return `${(meters / 1000).toFixed(1)}km`
}

/* ---------- Sub-components ---------- */

function SearchBar({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="relative">
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-lt-muted2"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <circle cx="11" cy="11" r="8" />
        <path strokeLinecap="round" d="m21 21-4.35-4.35" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Buscar negocio..."
        className="w-full bg-lt-card border border-[rgba(255,255,255,0.07)] rounded-btn pl-10 pr-4 py-2.5 text-sm text-lt-white placeholder:text-lt-muted2 font-condensed focus:outline-none focus:border-lt-green/40 transition-colors"
      />
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-lt-card rounded-card p-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-btn bg-lt-card2" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/3 rounded bg-lt-card2" />
          <div className="h-3 w-1/3 rounded bg-lt-card2" />
        </div>
        <div className="h-9 w-20 rounded-btn bg-lt-card2" />
      </div>
    </div>
  )
}

function GpsPrompt({ onRetry }: { onRetry: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center text-center py-16 px-6"
    >
      {/* Location pin icon */}
      <div className="w-20 h-20 rounded-full bg-lt-card2 flex items-center justify-center mb-5">
        <svg
          className="w-10 h-10 text-lt-green"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
          />
        </svg>
      </div>
      <h3 className="text-lt-white font-condensed font-700 text-lg uppercase tracking-wide mb-2">
        Activa tu ubicaci&oacute;n
      </h3>
      <p className="text-lt-muted2 text-sm font-condensed mb-6 max-w-[260px]">
        Permite el acceso a tu ubicaci&oacute;n para encontrar negocios
        cercanos y hacer check-in
      </p>
      <button
        onClick={onRetry}
        className="bg-lt-green text-lt-black font-condensed font-700 text-sm px-6 py-2.5 rounded-btn active:scale-95 transition-transform"
      >
        Permitir ubicaci&oacute;n
      </button>
    </motion.div>
  )
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center text-center py-16 px-6"
    >
      <div className="w-20 h-20 rounded-full bg-lt-card2 flex items-center justify-center mb-5">
        <svg
          className="w-10 h-10 text-lt-muted2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <circle cx="12" cy="12" r="10" />
          <polygon
            strokeLinecap="round"
            strokeLinejoin="round"
            points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"
          />
        </svg>
      </div>
      <h3 className="text-lt-white font-condensed font-700 text-lg uppercase tracking-wide mb-2">
        No hay negocios cerca
      </h3>
      <p className="text-lt-muted2 text-sm font-condensed max-w-[260px]">
        No encontramos negocios registrados en tu zona. Int&eacute;ntalo
        m&aacute;s tarde o mu&eacute;vete a otra ubicaci&oacute;n.
      </p>
    </motion.div>
  )
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center text-center py-16 px-6"
    >
      <div className="w-20 h-20 rounded-full bg-lt-card2 flex items-center justify-center mb-5">
        <svg
          className="w-10 h-10 text-lt-red"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
          />
        </svg>
      </div>
      <h3 className="text-lt-white font-condensed font-700 text-lg uppercase tracking-wide mb-2">
        Algo sali&oacute; mal
      </h3>
      <p className="text-lt-muted2 text-sm font-condensed mb-6 max-w-[260px]">
        No pudimos cargar los negocios. Revisa tu conexi&oacute;n e
        int&eacute;ntalo de nuevo.
      </p>
      <button
        onClick={onRetry}
        className="bg-lt-card2 text-lt-white font-condensed font-700 text-sm px-6 py-2.5 rounded-btn border border-[rgba(255,255,255,0.07)] active:scale-95 transition-transform"
      >
        Reintentar
      </button>
    </motion.div>
  )
}

function ActiveCheckinCard({
  checkin,
  loading,
  onCheckout,
}: {
  checkin: ActiveCheckin
  loading: boolean
  onCheckout: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-lt-card rounded-card p-4 border border-lt-green/30 shadow-glow-g"
    >
      <div className="flex items-center gap-3">
        {/* Logo */}
        <div className="w-12 h-12 rounded-btn bg-lt-card2 flex items-center justify-center overflow-hidden flex-shrink-0">
          {checkin.business.logoUrl ? (
            <Image
              src={checkin.business.logoUrl}
              alt={checkin.business.name}
              width={48}
              height={48}
              className="object-cover w-full h-full"
            />
          ) : (
            <svg
              className="w-6 h-6 text-lt-green"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
              />
            </svg>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="inline-flex items-center gap-1 bg-lt-green/15 text-lt-green text-[10px] font-condensed font-600 px-2 py-0.5 rounded-full uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-lt-green animate-pulse-dot" />
              Est&aacute;s aqu&iacute;
            </span>
          </div>
          <p className="text-lt-white font-condensed font-700 text-sm truncate">
            {checkin.business.name}
          </p>
          {checkin.business.address && (
            <p className="text-lt-muted2 text-xs font-condensed truncate">
              {checkin.business.address}
            </p>
          )}
        </div>

        {/* Checkout button */}
        <button
          onClick={onCheckout}
          disabled={loading}
          className="flex-shrink-0 bg-lt-card2 text-lt-red font-condensed font-700 text-xs px-3 py-2 rounded-btn border border-[rgba(255,255,255,0.07)] active:scale-95 transition-transform disabled:opacity-50"
        >
          {loading ? 'Saliendo...' : 'Salir'}
        </button>
      </div>
    </motion.div>
  )
}

function BusinessCard({
  business,
  isCheckingIn,
  showSuccess,
  hasActiveCheckin,
  onCheckin,
}: {
  business: Business
  isCheckingIn: boolean
  showSuccess: boolean
  hasActiveCheckin: boolean
  onCheckin: () => void
}) {
  const withinRange =
    business.distance !== null && business.distance <= business.checkinRadius
  const canCheckin = withinRange && !hasActiveCheckin

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="bg-lt-card rounded-card p-4 border border-[rgba(255,255,255,0.07)] card-hover-green transition-all"
    >
      <div className="flex items-center gap-3">
        {/* Logo */}
        <div className="w-12 h-12 rounded-btn bg-lt-card2 flex items-center justify-center overflow-hidden flex-shrink-0">
          {business.logoUrl ? (
            <Image
              src={business.logoUrl}
              alt={business.name}
              width={48}
              height={48}
              className="object-cover w-full h-full"
            />
          ) : (
            <span className="text-2xl">
              {TYPE_ICONS[business.type] || TYPE_ICONS.OTHER}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-lt-white font-condensed font-700 text-sm truncate">
            {business.name}
          </p>

          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {/* Type badge */}
            <span className="inline-block bg-lt-card2 text-lt-muted2 text-[10px] font-condensed font-600 px-2 py-0.5 rounded-full uppercase tracking-wider">
              {TYPE_LABELS[business.type] || business.type}
            </span>

            {/* Distance */}
            {business.distance !== null && (
              <span className="text-lt-muted2 text-[11px] font-condensed">
                {formatDistance(business.distance)}
              </span>
            )}
          </div>

          {business.address && (
            <p className="text-lt-muted2 text-[11px] font-condensed mt-1 truncate">
              {business.address}
            </p>
          )}

          {/* Range indicator */}
          <div className="flex items-center gap-1.5 mt-1.5">
            {withinRange ? (
              <>
                <span className="w-2 h-2 rounded-full bg-lt-green" />
                <span className="text-lt-green text-[10px] font-condensed font-600">
                  Dentro del rango
                </span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-lt-red" />
                <span className="text-lt-red text-[10px] font-condensed font-600">
                  Fuera de rango
                  {business.distance !== null &&
                    ` (${formatDistance(business.distance)})`}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Check-in button / success state */}
        <div className="flex-shrink-0">
          <AnimatePresence mode="wait">
            {showSuccess ? (
              <motion.div
                key="success"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                className="w-[76px] h-9 flex items-center justify-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.3, 1] }}
                  transition={{ duration: 0.5 }}
                  className="w-9 h-9 rounded-full bg-lt-green/20 flex items-center justify-center"
                >
                  <svg
                    className="w-5 h-5 text-lt-green"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m4.5 12.75 6 6 9-13.5"
                    />
                  </svg>
                </motion.div>
                {/* Green pulse ring */}
                <motion.div
                  initial={{ scale: 0.5, opacity: 0.6 }}
                  animate={{ scale: 2.5, opacity: 0 }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="absolute w-9 h-9 rounded-full border-2 border-lt-green"
                />
              </motion.div>
            ) : (
              <motion.button
                key="button"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onCheckin}
                disabled={!canCheckin || isCheckingIn}
                className={cn(
                  'font-condensed font-700 text-xs px-4 py-2 rounded-btn transition-all active:scale-95',
                  canCheckin
                    ? 'bg-lt-green text-lt-black'
                    : 'bg-lt-card2 text-lt-muted2 cursor-not-allowed'
                )}
              >
                {isCheckingIn ? (
                  <span className="flex items-center gap-1.5">
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{
                        repeat: Infinity,
                        duration: 0.8,
                        ease: 'linear',
                      }}
                      className="inline-block w-3 h-3 border-2 border-lt-black/30 border-t-lt-black rounded-full"
                    />
                    ...
                  </span>
                ) : (
                  'Check-in'
                )}
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}

/* ---------- Main Component ---------- */

export function ExplorarScreen() {
  const [location, setLocation] = useState<{
    lat: number
    lng: number
  } | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [activeCheckin, setActiveCheckin] = useState<ActiveCheckin | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)
  const [search, setSearch] = useState('')
  const [checkingIn, setCheckingIn] = useState<string | null>(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [successId, setSuccessId] = useState<string | null>(null)

  /* --- Request geolocation --- */
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Tu navegador no soporta geolocalizaci\u00F3n')
      setLoading(false)
      return
    }
    setLocationError(null)
    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      },
      (err) => {
        setLocationError(
          err.code === 1
            ? 'Permite el acceso a tu ubicaci\u00F3n para encontrar negocios cercanos'
            : 'No pudimos obtener tu ubicaci\u00F3n'
        )
        setLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [])

  useEffect(() => {
    requestLocation()
  }, [requestLocation])

  /* --- Fetch businesses + active checkin --- */
  const fetchData = useCallback(async (loc: { lat: number; lng: number }) => {
    setLoading(true)
    setFetchError(false)
    try {
      const [bizRes, checkinRes] = await Promise.all([
        fetch(
          `/api/businesses/search?lat=${loc.lat}&lng=${loc.lng}&radius=5000`
        ),
        fetch('/api/checkins/active'),
      ])
      if (!bizRes.ok) throw new Error('fetch failed')
      setBusinesses(await bizRes.json())
      if (checkinRes.ok) {
        const data = await checkinRes.json()
        setActiveCheckin(data ?? null)
      }
    } catch {
      setFetchError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (location) fetchData(location)
  }, [location, fetchData])

  /* --- Check-in --- */
  async function handleCheckin(businessId: string) {
    if (!location) return
    setCheckingIn(businessId)
    try {
      const res = await fetch('/api/checkins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          lat: location.lat,
          lng: location.lng,
        }),
      })
      if (res.ok) {
        const checkin = await res.json()
        const biz = businesses.find((b) => b.id === businessId)
        setActiveCheckin({
          id: checkin.id,
          checkedAt: checkin.checkedAt,
          business: {
            id: businessId,
            name: biz?.name ?? '',
            logoUrl: biz?.logoUrl ?? null,
            address: biz?.address ?? null,
          },
        })
        setSuccessId(businessId)
        setTimeout(() => setSuccessId(null), 2000)
      } else {
        const err = await res.json()
        alert(err.error || 'Error al hacer check-in')
      }
    } catch {
      alert('Error de conexi\u00F3n')
    } finally {
      setCheckingIn(null)
    }
  }

  /* --- Checkout --- */
  async function handleCheckout() {
    if (!activeCheckin) return
    setCheckoutLoading(true)
    try {
      const res = await fetch(`/api/checkins/${activeCheckin.id}/checkout`, {
        method: 'POST',
      })
      if (res.ok) setActiveCheckin(null)
    } catch {
      // silent
    } finally {
      setCheckoutLoading(false)
    }
  }

  /* --- Filter --- */
  const filtered = businesses.filter(
    (b) => !search || b.name.toLowerCase().includes(search.toLowerCase())
  )

  /* ---------- Render ---------- */
  return (
    <div className="px-4 pt-4 space-y-4 animate-fade-in">
      {/* Page header */}
      <div>
        <h1 className="text-lt-white font-bebas text-3xl leading-tight">
          Explorar
        </h1>
        <p className="text-lt-muted2 text-sm font-condensed">
          Encuentra negocios y haz check-in
        </p>
      </div>

      {/* Search */}
      <SearchBar value={search} onChange={setSearch} />

      {/* No GPS */}
      {locationError && !location ? (
        <GpsPrompt onRetry={requestLocation} />
      ) : /* Loading skeletons */ loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : /* Fetch error */ fetchError ? (
        <ErrorState onRetry={() => location && fetchData(location)} />
      ) : (
        <>
          {/* Active check-in banner */}
          <AnimatePresence>
            {activeCheckin && (
              <ActiveCheckinCard
                checkin={activeCheckin}
                loading={checkoutLoading}
                onCheckout={handleCheckout}
              />
            )}
          </AnimatePresence>

          {/* Section header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lt-white font-condensed text-base font-700 uppercase tracking-wide">
              Negocios cercanos
            </h2>
            <span className="text-lt-muted2 text-xs font-condensed">
              {filtered.length}{' '}
              {filtered.length === 1 ? 'resultado' : 'resultados'}
            </span>
          </div>

          {/* Business list or empty */}
          {filtered.length === 0 ? (
            search ? (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-lt-muted2 text-sm font-condensed py-10"
              >
                No hay resultados para &ldquo;{search}&rdquo;
              </motion.p>
            ) : (
              <EmptyState />
            )
          ) : (
            <motion.div layout className="space-y-3 pb-4">
              <AnimatePresence>
                {filtered.map((biz) => (
                  <BusinessCard
                    key={biz.id}
                    business={biz}
                    isCheckingIn={checkingIn === biz.id}
                    showSuccess={successId === biz.id}
                    hasActiveCheckin={activeCheckin !== null}
                    onCheckin={() => handleCheckin(biz.id)}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </>
      )}
    </div>
  )
}
