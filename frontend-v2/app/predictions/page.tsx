"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { PredictionTeamSelector } from "@/components/prediction-team-selector"
import { PredictionResult } from "@/components/prediction-result"
import { PredictionSkeleton } from "@/components/prediction-skeleton"
import { generatePrediction, type PredictionResponse } from "@/lib/api"
import { BarChart3, Brain, Database, Shield, Target, TrendingUp } from "lucide-react"

export default function PredictionsPage() {
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate(homeTeam: string, awayTeam: string) {
    setIsLoading(true)
    setError(null)
    setPrediction(null)

    const data = await generatePrediction(homeTeam, awayTeam)

    if (!data) {
      setError("Failed to connect to the prediction engine. Please check that the API is running and try again.")
      setIsLoading(false)
      return
    }

    if (!data.success) {
      setError(data.error || "An unexpected error occurred while generating the prediction.")
      setIsLoading(false)
      return
    }

    setPrediction(data)
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-background bg-fixed bg-gradient-to-b from-background via-background/95 to-muted/20">
      <Header />

      <main className="mx-auto max-w-5xl p-4 lg:p-6">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground text-balance">Match Predictions</h1>
              <p className="text-sm text-muted-foreground">
                Data-driven match outcome predictions powered by squad stats and league standings
              </p>
            </div>
          </div>
        </div>

        {/* Team Selector */}
        <section className="mb-6" aria-label="Team selection">
          <PredictionTeamSelector onGenerate={handleGenerate} isLoading={isLoading} />
        </section>

        {/* Error State */}
        {error && (
          <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10 text-destructive shrink-0">
                <Target className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1">Prediction Failed</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <section aria-label="Loading prediction">
            <PredictionSkeleton />
          </section>
        )}

        {/* Prediction Results */}
        {prediction && !isLoading && (
          <section aria-label="Prediction results">
            <PredictionResult data={prediction} />
          </section>
        )}

        {/* Empty State */}
        {!prediction && !isLoading && !error && (
          <section aria-label="Getting started" className="mt-8">
            <div className="rounded-lg border border-border bg-card p-8 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-5">
                <Brain className="h-8 w-8" />
              </div>
              <h2 className="text-lg font-semibold text-foreground mb-2 text-balance">Select Teams to Get Started</h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto mb-8 text-pretty">
                Choose a league and pick two teams above to generate a data-driven match prediction
                with detailed probability analysis and stat comparisons.
              </p>

              {/* Feature cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
                <div className="rounded-lg border border-border bg-secondary/30 p-4 text-left">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary mb-3">
                    <Target className="h-4 w-4" />
                  </div>
                  <h3 className="text-xs font-semibold text-foreground mb-1">Score Prediction</h3>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    Predicted match score based on historical performance data
                  </p>
                </div>

                <div className="rounded-lg border border-border bg-secondary/30 p-4 text-left">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary mb-3">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <h3 className="text-xs font-semibold text-foreground mb-1">Win Probability</h3>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    Three-way probability gauge for home win, draw, and away win
                  </p>
                </div>

                <div className="rounded-lg border border-border bg-secondary/30 p-4 text-left">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary mb-3">
                    <Database className="h-4 w-4" />
                  </div>
                  <h3 className="text-xs font-semibold text-foreground mb-1">Stat Comparison</h3>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    Head-to-head statistical breakdown across 8 key metrics
                  </p>
                </div>
              </div>
            </div>

            {/* How it works */}
            <div className="mt-6 rounded-lg border border-border bg-card p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">How It Works</h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {[
                  { step: "01", icon: Shield, title: "Select League", desc: "Choose from available leagues" },
                  { step: "02", icon: Shield, title: "Pick Teams", desc: "Select home and away teams" },
                  { step: "03", icon: Brain, title: "Analyze Data", desc: "Engine processes squad stats" },
                  { step: "04", icon: BarChart3, title: "Get Prediction", desc: "View scores and probabilities" },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-3">
                    <span className="text-xs font-bold font-mono text-primary bg-primary/10 rounded-md px-2 py-1 shrink-0">
                      {item.step}
                    </span>
                    <div>
                      <h4 className="text-xs font-semibold text-foreground">{item.title}</h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-8">
        <div className="mx-auto max-w-5xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            PlusOne Analytics — Advanced prediction engine powered by Match Data.
          </p>
          <p className="text-sm text-muted-foreground">
            For entertainment purposes only. Not financial advice.
          </p>
        </div>
      </footer>
    </div>
  )
}
