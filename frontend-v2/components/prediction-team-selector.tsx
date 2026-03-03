"use client"

import { useState, useEffect } from "react"
import { getLeagues, getTeams } from "@/lib/api"
import { Trophy, ChevronDown, Zap, ArrowRightLeft, Shield } from "lucide-react"

interface League {
  id: number
  name: string
  country: string | null
}

interface Team {
  id: number
  name: string
  league_id: number
  league: string
}

interface PredictionTeamSelectorProps {
  onGenerate: (homeTeam: string, awayTeam: string) => void
  isLoading: boolean
}

export function PredictionTeamSelector({ onGenerate, isLoading }: PredictionTeamSelectorProps) {
  const [leagues, setLeagues] = useState<League[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedLeague, setSelectedLeague] = useState<number | null>(null)
  const [homeTeam, setHomeTeam] = useState("")
  const [awayTeam, setAwayTeam] = useState("")
  const [loadingLeagues, setLoadingLeagues] = useState(true)
  const [loadingTeams, setLoadingTeams] = useState(false)
  const [leagueOpen, setLeagueOpen] = useState(false)
  const [homeOpen, setHomeOpen] = useState(false)
  const [awayOpen, setAwayOpen] = useState(false)

  useEffect(() => {
    async function fetchLeagues() {
      setLoadingLeagues(true)
      const data = await getLeagues()
      if (data && Array.isArray(data)) {
        setLeagues(data)
      }
      setLoadingLeagues(false)
    }
    fetchLeagues()
  }, [])

  useEffect(() => {
    async function fetchTeams() {
      if (!selectedLeague) return
      setLoadingTeams(true)
      setHomeTeam("")
      setAwayTeam("")
      const data = await getTeams(selectedLeague)
      if (data && Array.isArray(data)) {
        setTeams(data)
      }
      setLoadingTeams(false)
    }
    fetchTeams()
  }, [selectedLeague])

  const selectedLeagueName = leagues.find(l => l.id === selectedLeague)?.name ?? ""
  const canGenerate = homeTeam && awayTeam && homeTeam !== awayTeam && !isLoading

  function handleSwap() {
    const tmp = homeTeam
    setHomeTeam(awayTeam)
    setAwayTeam(tmp)
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Zap className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Match Prediction</h2>
          <p className="text-xs text-muted-foreground">Select a league and two teams to generate a prediction</p>
        </div>
      </div>

      {/* League Selector */}
      <div className="mb-5">
        <label className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">League</label>
        <div className="relative">
          <button
            onClick={() => setLeagueOpen(!leagueOpen)}
            className="flex items-center justify-between w-full rounded-lg border border-border bg-secondary/50 px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-ring"
            disabled={loadingLeagues}
          >
            <span className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-muted-foreground" />
              {loadingLeagues ? "Loading leagues..." : selectedLeagueName || "Choose a league"}
            </span>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${leagueOpen ? "rotate-180" : ""}`} />
          </button>
          {leagueOpen && (
            <div className="absolute z-20 mt-1 w-full rounded-lg border border-border bg-card shadow-lg max-h-60 overflow-y-auto scrollbar-thin">
              {leagues.map((league) => (
                <button
                  key={league.id}
                  onClick={() => { setSelectedLeague(league.id); setLeagueOpen(false) }}
                  className={`flex items-center gap-3 w-full px-4 py-2.5 text-sm text-left transition-colors hover:bg-secondary/50 ${selectedLeague === league.id ? "bg-primary/10 text-primary" : "text-foreground"}`}
                >
                  <Trophy className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span>{league.name}</span>
                  {league.country && <span className="text-xs text-muted-foreground ml-auto">{league.country}</span>}
                </button>
              ))}
              {leagues.length === 0 && !loadingLeagues && (
                <div className="px-4 py-3 text-sm text-muted-foreground text-center">No leagues found</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Team Selectors */}
      <div className="flex flex-col sm:flex-row items-stretch gap-3">
        {/* Home Team */}
        <div className="flex-1">
          <label className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Shield className="h-3 w-3" />
              Home Team
            </span>
          </label>
          <div className="relative">
            <button
              onClick={() => setHomeOpen(!homeOpen)}
              className="flex items-center justify-between w-full rounded-lg border border-border bg-secondary/50 px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!selectedLeague || loadingTeams}
            >
              <span className="truncate">{loadingTeams ? "Loading..." : homeTeam || "Select home team"}</span>
              <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 ml-2 transition-transform ${homeOpen ? "rotate-180" : ""}`} />
            </button>
            {homeOpen && (
              <div className="absolute z-20 mt-1 w-full rounded-lg border border-border bg-card shadow-lg max-h-52 overflow-y-auto scrollbar-thin">
                {teams.filter(t => t.name !== awayTeam).map((team) => (
                  <button
                    key={team.id}
                    onClick={() => { setHomeTeam(team.name); setHomeOpen(false) }}
                    className={`w-full px-4 py-2.5 text-sm text-left transition-colors hover:bg-secondary/50 ${homeTeam === team.name ? "bg-primary/10 text-primary" : "text-foreground"}`}
                  >
                    {team.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex items-end justify-center pb-1">
          <button
            onClick={handleSwap}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-secondary/50 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
            disabled={!homeTeam && !awayTeam}
            title="Swap teams"
          >
            <ArrowRightLeft className="h-4 w-4" />
          </button>
        </div>

        {/* Away Team */}
        <div className="flex-1">
          <label className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Shield className="h-3 w-3" />
              Away Team
            </span>
          </label>
          <div className="relative">
            <button
              onClick={() => setAwayOpen(!awayOpen)}
              className="flex items-center justify-between w-full rounded-lg border border-border bg-secondary/50 px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!selectedLeague || loadingTeams}
            >
              <span className="truncate">{loadingTeams ? "Loading..." : awayTeam || "Select away team"}</span>
              <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 ml-2 transition-transform ${awayOpen ? "rotate-180" : ""}`} />
            </button>
            {awayOpen && (
              <div className="absolute z-20 mt-1 w-full rounded-lg border border-border bg-card shadow-lg max-h-52 overflow-y-auto scrollbar-thin">
                {teams.filter(t => t.name !== homeTeam).map((team) => (
                  <button
                    key={team.id}
                    onClick={() => { setAwayTeam(team.name); setAwayOpen(false) }}
                    className={`w-full px-4 py-2.5 text-sm text-left transition-colors hover:bg-secondary/50 ${awayTeam === team.name ? "bg-primary/10 text-primary" : "text-foreground"}`}
                  >
                    {team.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Generate Button */}
      <div className="mt-6">
        <button
          onClick={() => canGenerate && onGenerate(homeTeam, awayTeam)}
          disabled={!canGenerate}
          className="flex items-center justify-center gap-2 w-full rounded-lg bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
        >
          {isLoading ? (
            <>
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Generating Prediction...
            </>
          ) : (
            <>
              <Zap className="h-4 w-4" />
              Generate Prediction
            </>
          )}
        </button>
      </div>
    </div>
  )
}
