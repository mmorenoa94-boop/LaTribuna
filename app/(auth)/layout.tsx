export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-lt-black pitch-bg flex flex-col">
      {children}
    </div>
  )
}
