'use client'
import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ComingSoonModalProps {
  open: boolean
  onClose: () => void
}

// Sparkle particle positions (pre-computed for performance)
const SPARKLES = [
  { x: '15%', y: '18%', delay: 0, size: 3 },
  { x: '82%', y: '12%', delay: 0.5, size: 2 },
  { x: '8%',  y: '72%', delay: 1.2, size: 2.5 },
  { x: '88%', y: '65%', delay: 0.8, size: 3 },
  { x: '45%', y: '8%',  delay: 1.5, size: 2 },
  { x: '72%', y: '82%', delay: 0.3, size: 2 },
  { x: '25%', y: '85%', delay: 1.0, size: 3 },
]

export default function ComingSoonModal({ open, onClose }: ComingSoonModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null)

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={backdropRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[100] flex items-center justify-center px-5"
          style={{ backgroundColor: 'rgba(10, 15, 26, 0.92)' }}
          onClick={(e) => { if (e.target === backdropRef.current) onClose() }}
        >
          {/* Floating sparkles */}
          {SPARKLES.map((s, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-lt-green"
              style={{ left: s.x, top: s.y, width: s.size, height: s.size }}
              animate={{
                opacity: [0, 0.8, 0],
                scale: [0.5, 1.2, 0.5],
                y: [0, -12, 0],
              }}
              transition={{
                duration: 2.5,
                delay: s.delay,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          ))}

          {/* Modal card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-sm overflow-hidden"
          >
            {/* Glassmorphism card */}
            <div
              className="rounded-[16px] border border-[rgba(255,255,255,0.08)] p-6 flex flex-col items-center gap-5"
              style={{
                background: 'linear-gradient(135deg, rgba(20,25,40,0.95) 0%, rgba(15,20,35,0.98) 100%)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
              }}
            >
              {/* Glow behind gift icon */}
              <div className="absolute top-12 left-1/2 -translate-x-1/2 w-32 h-32 bg-lt-green/10 rounded-full blur-3xl pointer-events-none" />

              {/* Gift box icon */}
              <div className="relative mt-2">
                {/* Golden ribbon glow */}
                <div className="absolute inset-0 bg-[#FFD700]/10 rounded-full blur-xl" />
                <div className="relative w-20 h-20 flex items-center justify-center">
                  {/* Gift box SVG */}
                  <svg viewBox="0 0 80 80" className="w-full h-full" fill="none">
                    {/* Box body */}
                    <rect x="10" y="38" width="60" height="36" rx="4" fill="#1a2235" stroke="#FFD700" strokeWidth="2" />
                    {/* Box lid */}
                    <rect x="6" y="28" width="68" height="14" rx="3" fill="#1a2235" stroke="#FFD700" strokeWidth="2" />
                    {/* Vertical ribbon */}
                    <rect x="36" y="28" width="8" height="46" fill="#FFD700" opacity="0.3" />
                    {/* Horizontal ribbon */}
                    <rect x="6" y="32" width="68" height="6" fill="#FFD700" opacity="0.3" />
                    {/* Bow left */}
                    <ellipse cx="32" cy="26" rx="10" ry="7" fill="none" stroke="#FFD700" strokeWidth="2" />
                    {/* Bow right */}
                    <ellipse cx="48" cy="26" rx="10" ry="7" fill="none" stroke="#FFD700" strokeWidth="2" />
                    {/* Bow center */}
                    <circle cx="40" cy="28" r="3" fill="#FFD700" />
                  </svg>

                  {/* Green sparkle particles around gift */}
                  <motion.div
                    className="absolute -top-1 -right-1 w-2 h-2 bg-lt-green rounded-full"
                    animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                  />
                  <motion.div
                    className="absolute top-2 -left-2 w-1.5 h-1.5 bg-lt-green rounded-full"
                    animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.7 }}
                  />
                  <motion.div
                    className="absolute -bottom-1 right-0 w-1.5 h-1.5 bg-lt-green rounded-full"
                    animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 1.1 }}
                  />
                </div>
              </div>

              {/* Title */}
              <div className="text-center relative">
                <h2 className="font-bebas text-3xl text-lt-white tracking-wider uppercase">
                  MUY PRONTO!
                </h2>
                {/* Green accent underline */}
                <div className="mx-auto mt-1 w-16 h-[3px] rounded-full bg-lt-green" />
              </div>

              {/* Subtitle */}
              <p className="text-[#94a3b8] font-barlow text-sm text-center leading-relaxed max-w-[280px]">
                Pronto podrás conocer a nuestros aliados y canjear tus puntos por premios exclusivos.
              </p>

              {/* Coming soon indicator */}
              <div className="flex items-center gap-2">
                <motion.div
                  className="w-2 h-2 rounded-full bg-lt-green"
                  animate={{ opacity: [0.4, 1, 0.4], scale: [0.9, 1.1, 0.9] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
                <span className="text-lt-muted2 font-condensed text-xs tracking-wider uppercase">
                  Te avisaremos cuando esté listo
                </span>
              </div>

              {/* CTA Button */}
              <button
                onClick={onClose}
                className="w-full mt-1 py-3 rounded-btn border border-lt-green/40 text-lt-green font-condensed font-700 text-sm tracking-wide hover:bg-lt-green/10 active:scale-[0.97] transition-all"
              >
                ← Volver a mi billetera
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
