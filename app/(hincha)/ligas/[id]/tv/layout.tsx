/**
 * TV Mode layout — removes all navigation (BottomNav, LiveTicker, etc.)
 * so the page can be projected full-screen on a TV/monitor.
 */
export default function TVLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-[#0A0C0F] overflow-hidden">
      {children}
    </div>
  )
}
