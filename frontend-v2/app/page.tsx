"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { StatsOverview } from "@/components/stats-overview"
import { GameCard } from "@/components/game-card"
import { StandingsTable } from "@/components/standings-table"
import { HeadToHead } from "@/components/head-to-head"
import { predictions } from "@/lib/football-data"
import { ChevronLeft } from "lucide-react"

export default function Home() {
  const [selectedGameId, setSelectedGameId] = useState(predictions[0].id)
  const [showDetail, setShowDetail] = useState(false)
  const [splitView, setSplitView] = useState<"overall" | "home" | "away">("overall")

  const selectedGame = predictions.find((g) => g.id === selectedGameId) ?? predictions[0]

  const handleSelect = (id: string) => {
    setSelectedGameId(id)
    setShowDetail(true)
  }

  return (
    <div className="min-h-screen bg-background bg-fixed bg-gradient-to-b from-background via-background/95 to-muted/20">
      <Header />

      <main className="mx-auto max-w-5xl p-4 lg:p-6">
        {/* Stats Overview */}
        <section aria-label="Season statistics overview" className="mb-6">
          <StatsOverview />
        </section>

        {/* Global Split View Toggle (Home/Away/Overall) */}
        <div className="mb-6 flex items-center justify-center">
          <div className="inline-flex items-center rounded-lg border border-border bg-card p-2 shadow-sm">
            {["overall", "home", "away"].map((view) => (
              <button
                key={view}
                onClick={() => setSplitView(view as any)}
                className={`px-4 py-2 text-base font-medium rounded-md transition-all ${splitView === view
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
              >
                {view.charAt(0).toUpperCase() + view.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
          {/* Left Column — Game Cards */}
          <aside
            className={`w-full lg:w-[380px] shrink-0 ${showDetail ? "hidden lg:block" : "block"}`}
            aria-label="Game predictions"
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Week 18 Predictions</h2>
              <span className="text-[10px] font-mono text-muted-foreground">
                {predictions.length} games
              </span>
            </div>
            <div className="flex flex-col gap-3 lg:max-h-[calc(100vh-240px)] lg:overflow-y-auto lg:pr-1 scrollbar-thin">
              {predictions.map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  isSelected={selectedGameId === game.id}
                  onSelect={handleSelect}
                />
              ))}
            </div>
          </aside>

          {/* Right Column — Analysis Detail */}
          <section
            className={`flex-1 min-w-0 ${showDetail ? "block" : "hidden lg:block"}`}
            aria-label="Game analysis detail"
          >
            {/* Mobile back button */}
            <button
              onClick={() => setShowDetail(false)}
              className="lg:hidden flex items-center gap-1 mb-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Back to predictions
            </button>

            {/* Game Header */}
            <div className="mb-4 flex items-center justify-between rounded-lg border border-border bg-card p-4 shadow-sm backdrop-blur-sm bg-card/90">
              <div className="flex items-center gap-4">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-lg text-lg font-bold border border-border"
                  style={{
                    backgroundColor: `${selectedGame.awayTeam.color}15`,
                    color: selectedGame.awayTeam.color,
                  }}
                >
                  {selectedGame.awayTeam.abbreviation}
                </div>
                <div className="text-center">
                  <span className="text-base text-muted-foreground">@</span>
                </div>
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-lg text-lg font-bold border border-border"
                  style={{
                    backgroundColor: `${selectedGame.homeTeam.color}15`,
                    color: selectedGame.homeTeam.color,
                  }}
                >
                  {selectedGame.homeTeam.abbreviation}
                </div>
                <div className="ml-4">
                  <p className="text-lg font-semibold text-foreground">
                    {selectedGame.awayTeam.abbreviation} @ {selectedGame.homeTeam.abbreviation}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedGame.date} — {selectedGame.venue}
                  </p>
                </div>
              </div>

              {selectedGame.status === "live" && (
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-2xl font-bold font-mono text-foreground">
                      {selectedGame.awayScore}
                    </span>
                    <span className="mx-2 text-muted-foreground">-</span>
                    <span className="text-2xl font-bold font-mono text-foreground">
                      {selectedGame.homeScore}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 rounded-full bg-destructive/10 px-4 py-2">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive" />
                    </span>
                    <span className="text-sm font-semibold text-destructive">
                      {selectedGame.quarter} {selectedGame.gameTime}
                    </span>
                  </div>
                </div>
              )}

              {selectedGame.status === "final" && (
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-2xl font-bold font-mono text-foreground">
                      {selectedGame.awayScore}
                    </span>
                    <span className="mx-2 text-muted-foreground">-</span>
                    <span className="text-2xl font-bold font-mono text-foreground">
                      {selectedGame.homeScore}
                    </span>
                  </div>
                  <div className="rounded-full bg-muted px-4 py-2">
                    <span className="text-sm font-semibold text-muted-foreground">FINAL</span>
                  </div>
                </div>
              )}
            </div>

            {/* Analysis Grid (Soccer View) */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Standings Table — spans 2 cols */}
              <div className="xl:col-span-2">
                <StandingsTable splitView={splitView} />
              </div>

              {/* Head To Head */}
              <div className="xl:col-span-1">
                <HeadToHead
                  splitView={splitView}
                  homeTeam={selectedGame.homeTeam.abbreviation}
                  awayTeam={selectedGame.awayTeam.abbreviation}
                />
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-8">
        <div className="mx-auto max-w-5xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Football Analytics — Advanced prediction engine powered by Match Data.
          </p>
          <p className="text-sm text-muted-foreground">
            For entertainment purposes only. Not financial advice.
          </p>
        </div>
      </footer>
    </div>
  )
}
