"use client"

import { Activity, BarChart3, TrendingUp, Zap } from "lucide-react"

export function Header() {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="mx-auto max-w-[1440px] px-4 lg:px-6">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Activity className="h-4 w-4" />
              </div>
              <span className="text-base font-semibold tracking-tight text-foreground">
                GridIron Analytics
              </span>
            </div>
            <div className="hidden md:flex items-center gap-1 rounded-full border border-border bg-secondary/50 px-2.5 py-1">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              <span className="text-xs font-medium text-primary">LIVE</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1" role="navigation" aria-label="Main navigation">
            <NavItem icon={<BarChart3 className="h-3.5 w-3.5" />} label="Predictions" active />
            <NavItem icon={<TrendingUp className="h-3.5 w-3.5" />} label="WPA Analysis" />
            <NavItem icon={<Zap className="h-3.5 w-3.5" />} label="Model Insights" />
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-medium text-foreground">Season 2025-26</span>
              <span className="text-[10px] text-muted-foreground">Week 18 Predictions</span>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
              W18
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

function NavItem({ icon, label, active = false }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <button
      className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
      }`}
    >
      {icon}
      {label}
    </button>
  )
}
