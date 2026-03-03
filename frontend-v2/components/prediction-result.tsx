"use client"

import type { PredictionResponse } from "@/lib/api"
import {
  Target, TrendingUp, Shield, Swords, BarChart3,
  CheckCircle2, XCircle, Calendar, AlertTriangle, Info
} from "lucide-react"

interface PredictionResultProps {
  data: PredictionResponse
}

/* ──────────────────────────── Score Hero ──────────────────────────── */
function ScoreHero({ data }: { data: PredictionResponse }) {
  const confidenceColor =
    data.confidence === "high" ? "bg-success/15 text-success border-success/30" :
    data.confidence === "medium" ? "bg-warning/15 text-warning border-warning/30" :
    "bg-muted/30 text-muted-foreground border-border"

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Predicted Score</h3>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${confidenceColor}`}>
          <span className="relative flex h-1.5 w-1.5">
            <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${data.confidence === "high" ? "bg-success animate-ping" : data.confidence === "medium" ? "bg-warning animate-ping" : "bg-muted-foreground"}`} />
            <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${data.confidence === "high" ? "bg-success" : data.confidence === "medium" ? "bg-warning" : "bg-muted-foreground"}`} />
          </span>
          {data.confidence} confidence
        </span>
      </div>

      {/* Score Display */}
      <div className="flex items-center justify-center gap-6">
        {/* Home */}
        <div className="flex flex-col items-center gap-2 flex-1">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
            <Shield className="h-7 w-7" />
          </div>
          <span className="text-sm font-semibold text-foreground text-center leading-tight">{data.home_team}</span>
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Home</span>
        </div>

        {/* Score */}
        <div className="flex items-center gap-3">
          <span className="text-5xl font-bold font-mono text-foreground tabular-nums">{data.predicted_score.home}</span>
          <span className="text-2xl font-light text-muted-foreground">-</span>
          <span className="text-5xl font-bold font-mono text-foreground tabular-nums">{data.predicted_score.away}</span>
        </div>

        {/* Away */}
        <div className="flex flex-col items-center gap-2 flex-1">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-info/10 border border-info/20 text-info">
            <Shield className="h-7 w-7" />
          </div>
          <span className="text-sm font-semibold text-foreground text-center leading-tight">{data.away_team}</span>
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Away</span>
        </div>
      </div>
    </div>
  )
}

/* ────────────────────── Three-Way Probability Gauge ──────────────────────── */
function ProbabilityGauge({ data }: { data: PredictionResponse }) {
  const homeP = Math.round(data.home_win_prob * 100)
  const drawP = Math.round(data.draw_prob * 100)
  const awayP = Math.round(data.away_win_prob * 100)

  // Determine the favored outcome
  const maxProb = Math.max(homeP, drawP, awayP)
  const favored = homeP === maxProb ? "home" : awayP === maxProb ? "away" : "draw"

  // SVG circular gauge
  const radius = 50
  const circumference = 2 * Math.PI * radius
  const homeArc = (data.home_win_prob * circumference)
  const drawArc = (data.draw_prob * circumference)
  const awayArc = (data.away_win_prob * circumference)

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex items-center gap-2 mb-5">
        <BarChart3 className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Win Probability</h3>
      </div>

      <div className="flex flex-col items-center gap-5">
        {/* Circular Gauge */}
        <div className="relative h-44 w-44">
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden="true">
            {/* Background */}
            <circle cx="60" cy="60" r={radius} fill="none" stroke="oklch(0.19 0.008 260)" strokeWidth="10" />
            {/* Home arc - green */}
            <circle
              cx="60" cy="60" r={radius} fill="none"
              stroke="oklch(0.65 0.19 145)"
              strokeWidth="10"
              strokeDasharray={`${homeArc} ${circumference}`}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
            {/* Draw arc - amber */}
            <circle
              cx="60" cy="60" r={radius} fill="none"
              stroke="oklch(0.7 0.18 55)"
              strokeWidth="10"
              strokeDasharray={`${drawArc} ${circumference}`}
              strokeDashoffset={`${-homeArc}`}
              className="transition-all duration-1000 ease-out"
            />
            {/* Away arc - blue */}
            <circle
              cx="60" cy="60" r={radius} fill="none"
              stroke="oklch(0.6 0.16 250)"
              strokeWidth="10"
              strokeDasharray={`${awayArc} ${circumference}`}
              strokeDashoffset={`${-(homeArc + drawArc)}`}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold font-mono text-foreground">{maxProb}%</span>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              {favored === "home" ? data.home_team : favored === "away" ? data.away_team : "Draw"}
            </span>
          </div>
        </div>

        {/* Horizontal probability bar */}
        <div className="w-full">
          <div className="flex h-3 rounded-full overflow-hidden">
            <div
              className="transition-all duration-700 ease-out rounded-l-full"
              style={{ width: `${homeP}%`, backgroundColor: "oklch(0.65 0.19 145)" }}
            />
            <div
              className="transition-all duration-700 ease-out"
              style={{ width: `${drawP}%`, backgroundColor: "oklch(0.7 0.18 55)" }}
            />
            <div
              className="transition-all duration-700 ease-out rounded-r-full"
              style={{ width: `${awayP}%`, backgroundColor: "oklch(0.6 0.16 250)" }}
            />
          </div>
        </div>

        {/* Labels */}
        <div className="flex items-center justify-between w-full">
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "oklch(0.65 0.19 145)" }} />
              <span className="text-xs font-medium text-foreground">{data.home_team}</span>
            </div>
            <span className="text-lg font-bold font-mono text-foreground">{homeP}%</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "oklch(0.7 0.18 55)" }} />
              <span className="text-xs font-medium text-foreground">Draw</span>
            </div>
            <span className="text-lg font-bold font-mono text-foreground">{drawP}%</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "oklch(0.6 0.16 250)" }} />
              <span className="text-xs font-medium text-foreground">{data.away_team}</span>
            </div>
            <span className="text-lg font-bold font-mono text-foreground">{awayP}%</span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ────────────────────── Stat Comparison Bars ──────────────────────── */
interface StatBarProps {
  label: string
  homeValue: string | number
  awayValue: string | number
  homeRaw: number
  awayRaw: number
  invert?: boolean // Higher is worse (e.g., goals_against)
}

function StatBar({ label, homeValue, awayValue, homeRaw, awayRaw, invert = false }: StatBarProps) {
  const total = homeRaw + awayRaw
  let homePct = total > 0 ? (homeRaw / total) * 100 : 50
  if (invert) homePct = 100 - homePct
  const awayPct = 100 - homePct

  const homeColor = homePct >= awayPct ? "oklch(0.65 0.19 145)" : "oklch(0.55 0.01 260)"
  const awayColor = awayPct >= homePct ? "oklch(0.6 0.16 250)" : "oklch(0.55 0.01 260)"

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-mono font-bold text-foreground">{homeValue}</span>
        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{label}</span>
        <span className="text-xs font-mono font-bold text-foreground">{awayValue}</span>
      </div>
      <div className="flex h-2 rounded-full overflow-hidden bg-secondary gap-0.5">
        <div
          className="rounded-full transition-all duration-500 ease-out"
          style={{ width: `${homePct}%`, backgroundColor: homeColor }}
        />
        <div
          className="rounded-full transition-all duration-500 ease-out"
          style={{ width: `${awayPct}%`, backgroundColor: awayColor }}
        />
      </div>
    </div>
  )
}

function StatComparison({ data }: { data: PredictionResponse }) {
  const h = data.home_stats
  const a = data.away_stats
  if (!h && !a) return null

  const stats = [
    { label: "Goals / Game", home: h?.goals_per_game, away: a?.goals_per_game, fmt: (v: number | null) => v?.toFixed(2) ?? "-" },
    { label: "Win Rate", home: h?.win_rate, away: a?.win_rate, fmt: (v: number | null) => v != null ? `${Math.round(v * 100)}%` : "-" },
    { label: "Possession", home: h?.possession, away: a?.possession, fmt: (v: number | null) => v != null ? `${v}%` : "-" },
    { label: "Goals For", home: h?.goals_for, away: a?.goals_for, fmt: (v: number | null) => v?.toString() ?? "-" },
    { label: "Goals Against", home: h?.goals_against, away: a?.goals_against, fmt: (v: number | null) => v?.toString() ?? "-", invert: true },
    { label: "League Rank", home: h?.rank, away: a?.rank, fmt: (v: number | null) => v != null ? `#${v}` : "-", invert: true },
    { label: "Points", home: h?.points, away: a?.points, fmt: (v: number | null) => v?.toString() ?? "-" },
    { label: "Avg Age", home: h?.avg_age, away: a?.avg_age, fmt: (v: number | null) => v?.toFixed(1) ?? "-" },
  ]

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex items-center gap-2 mb-2">
        <Swords className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Team Comparison</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-5">
        {data.home_team} vs {data.away_team} — Statistical breakdown
      </p>

      {/* Team Headers */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md text-[10px] font-bold border border-primary/20 bg-primary/10 text-primary">
            <Shield className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-semibold text-foreground">{data.home_team}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-foreground">{data.away_team}</span>
          <div className="flex h-7 w-7 items-center justify-center rounded-md text-[10px] font-bold border border-info/20 bg-info/10 text-info">
            <Shield className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3.5">
        {stats.map((s) => (
          <StatBar
            key={s.label}
            label={s.label}
            homeValue={s.fmt(s.home ?? null)}
            awayValue={s.fmt(s.away ?? null)}
            homeRaw={Number(s.home) || 0}
            awayRaw={Number(s.away) || 0}
            invert={s.invert}
          />
        ))}
      </div>
    </div>
  )
}

/* ────────────────────── Confidence Meter ──────────────────────── */
function ConfidenceMeter({ data }: { data: PredictionResponse }) {
  const level = data.confidence
  const pct = level === "high" ? 90 : level === "medium" ? 60 : 30
  const color = level === "high" ? "oklch(0.65 0.19 145)" : level === "medium" ? "oklch(0.7 0.18 55)" : "oklch(0.55 0.01 260)"
  const descriptions: Record<string, string> = {
    high: "Strong data available for both teams. Prediction is based on comprehensive squad stats and league standings.",
    medium: "Partial data available. Some squad or standings data may be missing, which may reduce accuracy.",
    low: "Limited data available for one or both teams. Treat this prediction with caution.",
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Model Confidence</h3>
      </div>

      {/* Gauge */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex-1">
          <div className="h-3 w-full rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${pct}%`, backgroundColor: color }}
            />
          </div>
        </div>
        <span className="text-lg font-bold font-mono text-foreground min-w-[48px] text-right">{pct}%</span>
      </div>

      {/* Level indicator */}
      <div className="flex items-center gap-3 mb-3">
        {["low", "medium", "high"].map((l) => (
          <div key={l} className="flex items-center gap-1.5">
            <span
              className={`h-2 w-2 rounded-full transition-all ${level === l ? "scale-125" : "opacity-40"}`}
              style={{ backgroundColor: l === "high" ? "oklch(0.65 0.19 145)" : l === "medium" ? "oklch(0.7 0.18 55)" : "oklch(0.55 0.01 260)" }}
            />
            <span className={`text-[10px] font-medium uppercase tracking-wider ${level === l ? "text-foreground" : "text-muted-foreground/50"}`}>
              {l}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-start gap-2 rounded-lg bg-secondary/50 p-3">
        <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">{descriptions[level]}</p>
      </div>
    </div>
  )
}

/* ────────────────────── Actual Result Panel ──────────────────────── */
function ActualResultPanel({ data }: { data: PredictionResponse }) {
  const actual = data.actual_result
  if (!actual) return null

  const correct = actual.prediction_correct
  const matchDate = actual.match_date
    ? new Date(actual.match_date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })
    : null

  return (
    <div className={`rounded-lg border p-6 ${correct ? "border-success/30 bg-success/5" : "border-destructive/30 bg-destructive/5"}`}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          {correct ? (
            <CheckCircle2 className="h-5 w-5 text-success" />
          ) : (
            <XCircle className="h-5 w-5 text-destructive" />
          )}
          <h3 className="text-sm font-semibold text-foreground">
            {correct ? "Prediction Correct" : "Prediction Incorrect"}
          </h3>
        </div>
        {matchDate && (
          <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {matchDate}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Predicted */}
        <div className="rounded-lg border border-border bg-card p-4 text-center">
          <span className="block text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Predicted</span>
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl font-bold font-mono text-foreground">{data.predicted_score.home}</span>
            <span className="text-sm text-muted-foreground">-</span>
            <span className="text-2xl font-bold font-mono text-foreground">{data.predicted_score.away}</span>
          </div>
        </div>
        {/* Actual */}
        <div className={`rounded-lg border p-4 text-center ${correct ? "border-success/20 bg-success/5" : "border-destructive/20 bg-destructive/5"}`}>
          <span className="block text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Actual Result</span>
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl font-bold font-mono text-foreground">{actual.home_score}</span>
            <span className="text-sm text-muted-foreground">-</span>
            <span className="text-2xl font-bold font-mono text-foreground">{actual.away_score}</span>
          </div>
        </div>
      </div>

      {/* Outcome breakdown */}
      <div className="mt-4 flex items-start gap-2 rounded-lg bg-secondary/50 p-3">
        <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          {correct
            ? "The predicted match outcome (winner/draw) matched the actual result."
            : "The predicted match outcome did not match the actual result. Our model is continuously improving."
          }
        </p>
      </div>
    </div>
  )
}

/* ────────────────────── Key Insights Panel ──────────────────────── */
function KeyInsights({ data }: { data: PredictionResponse }) {
  const h = data.home_stats
  const a = data.away_stats
  if (!h && !a) return null

  const insights: string[] = []

  // Home advantage note
  insights.push(`${data.home_team} have home advantage in this fixture.`)

  // Goals per game comparison
  if (h?.goals_per_game != null && a?.goals_per_game != null) {
    if (h.goals_per_game > a.goals_per_game) {
      insights.push(`${data.home_team} score more frequently (${h.goals_per_game.toFixed(2)} vs ${a.goals_per_game.toFixed(2)} goals/game).`)
    } else if (a.goals_per_game > h.goals_per_game) {
      insights.push(`${data.away_team} score more frequently (${a.goals_per_game.toFixed(2)} vs ${h.goals_per_game.toFixed(2)} goals/game).`)
    }
  }

  // Win rate
  if (h?.win_rate != null && a?.win_rate != null) {
    const diff = Math.abs(h.win_rate - a.win_rate)
    if (diff > 0.15) {
      const better = h.win_rate > a.win_rate ? data.home_team : data.away_team
      insights.push(`${better} have a significantly higher win rate this season.`)
    }
  }

  // Possession
  if (h?.possession != null && a?.possession != null) {
    const diff = Math.abs(h.possession - a.possession)
    if (diff > 5) {
      const dominant = h.possession > a.possession ? data.home_team : data.away_team
      insights.push(`${dominant} dominate possession (${Math.max(h.possession, a.possession)}%).`)
    }
  }

  // Rank
  if (h?.rank != null && a?.rank != null) {
    if (h.rank < a.rank) {
      insights.push(`${data.home_team} are ranked higher (${h.rank}${ordinal(h.rank)} vs ${a.rank}${ordinal(a.rank)}).`)
    } else if (a.rank < h.rank) {
      insights.push(`${data.away_team} are ranked higher (${a.rank}${ordinal(a.rank)} vs ${h.rank}${ordinal(h.rank)}).`)
    }
  }

  if (insights.length === 0) return null

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Info className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Key Insights</h3>
      </div>
      <ul className="flex flex-col gap-2.5">
        {insights.map((insight, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
            <span className="text-xs text-muted-foreground leading-relaxed">{insight}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"]
  const v = n % 100
  return s[(v - 20) % 10] || s[v] || s[0]
}

/* ────────────────────── Main Export ──────────────────────── */
export function PredictionResult({ data }: PredictionResultProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Score Hero - Full Width */}
      <ScoreHero data={data} />

      {/* Two-column layout on larger screens */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        {/* Left column - 3/5 width */}
        <div className="xl:col-span-3 flex flex-col gap-4">
          <ProbabilityGauge data={data} />
          {data.actual_result && <ActualResultPanel data={data} />}
          <KeyInsights data={data} />
        </div>

        {/* Right column - 2/5 width */}
        <div className="xl:col-span-2 flex flex-col gap-4">
          <StatComparison data={data} />
          <ConfidenceMeter data={data} />
        </div>
      </div>
    </div>
  )
}
