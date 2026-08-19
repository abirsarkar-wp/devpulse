import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  return <div className="min-h-screen bg-paper technical-grid">
    <header className="sticky top-0 z-20 border-b border-white/10 bg-ink/95 text-white backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link to="/dashboard" className="group flex items-center gap-3" aria-label="DevPulse dashboard">
          <span className="relative grid h-8 w-8 place-items-center rounded-lg border border-white/15 bg-white/8 font-mono text-xs font-bold shadow-lg">DP<span className="pulse-glow absolute -right-1 -top-1 h-2 w-2 rounded-full bg-signal-resolved" /></span>
          <span><strong className="block font-display text-base font-semibold tracking-tight">DevPulse</strong><span className="hidden font-mono text-[9px] uppercase tracking-[.22em] text-white/45 sm:block">Control room</span></span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-4">
          <span className="hidden items-center gap-2 font-mono text-[10px] text-white/55 md:flex"><span className="pulse-glow h-1.5 w-1.5 rounded-full bg-signal-resolved" />Live system</span>
          <span className="max-w-35 truncate rounded-full border border-white/10 bg-white/6 px-2.5 py-1 font-mono text-[10px] text-white/70 sm:max-w-none">{user?.email} <b className="ml-1 text-white/90">{user?.role}</b></span>
          <button onClick={logout} className="rounded-md px-2 py-1.5 text-xs text-white/65 transition hover:bg-white/10 hover:text-white">Log out</button>
        </div>
      </div>
    </header>{children}
  </div>;
}
