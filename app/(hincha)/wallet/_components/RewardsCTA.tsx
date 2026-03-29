'use client'
import { useState } from 'react'
import ComingSoonModal from './ComingSoonModal'

export default function RewardsCTA() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full py-3.5 rounded-btn bg-lt-green/10 border border-lt-green/30 text-lt-green font-condensed font-700 text-sm tracking-wide hover:bg-lt-green/15 active:scale-[0.97] transition-all"
      >
        🎁 Explorar premios y canjes
      </button>
      <ComingSoonModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}
