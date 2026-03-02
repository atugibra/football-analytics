"use client"

import { Crosshair, ShieldAlert } from "lucide-react"

// Strict typography scale: text-sm (14px), text-base (16px), text-lg (20px), text-2xl (24px)
// Strict spacing: 8px grid (p-2, p-4, mt-2, mt-4, gap-2, gap-4)

interface HeadToHeadProps {
    splitView: "overall" | "home" | "away"
    homeTeam: string
    awayTeam: string
}

export function HeadToHead({ splitView, homeTeam, awayTeam }: HeadToHeadProps) {
    // Static placeholder data mimicking the backend
    const previousMatches = [
        { date: "2025-10-14", home: homeTeam, away: awayTeam, homeScore: 2, awayScore: 1 },
        { date: "2025-03-02", home: awayTeam, away: homeTeam, homeScore: 0, awayScore: 0 },
        { date: "2024-11-20", home: homeTeam, away: awayTeam, homeScore: 3, awayScore: 0 },
        { date: "2024-04-15", home: awayTeam, away: homeTeam, homeScore: 1, awayScore: 2 },
    ]

    // Filter based on split view (e.g. if home is selected, show only when homeTeam is actually home)
    const displayMatches = splitView === "overall"
        ? previousMatches
        : splitView === "home"
            ? previousMatches.filter(m => m.home === homeTeam)
            : previousMatches.filter(m => m.home === awayTeam)

    return (
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm h-full">
            <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Crosshair className="h-5 w-5 text-primary" />
                    Head-to-Head <span className="text-sm font-normal text-muted-foreground">({splitView.toUpperCase()})</span>
                </h3>
            </div>

            <div className="flex flex-col gap-4">
                {displayMatches.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center bg-muted/20 border border-border/50 rounded-md border-dashed">
                        <ShieldAlert className="h-8 w-8 text-muted-foreground mb-2 opacity-50" />
                        <p className="text-sm text-muted-foreground">No matches found for this view.</p>
                    </div>
                ) : (
                    displayMatches.map((match, idx) => (
                        <div
                            key={idx}
                            className="flex items-center gap-4 bg-background border border-border/50 p-4 rounded-md shadow-sm transition-colors hover:border-primary/50"
                        >
                            <div className="flex flex-col flex-1">
                                <p className="text-sm font-mono text-muted-foreground mb-2">{match.date}</p>
                                <div className="flex items-center justify-between">
                                    <span className={`text-base font-semibold ${match.homeScore > match.awayScore ? 'text-primary' : 'text-foreground'}`}>
                                        {match.home}
                                    </span>
                                    <span className={`text-xl font-bold font-mono ${match.homeScore > match.awayScore ? 'text-primary' : 'text-muted-foreground'}`}>
                                        {match.homeScore}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between mt-2">
                                    <span className={`text-base ${match.awayScore > match.homeScore ? 'text-primary' : 'text-foreground'}`}>
                                        {match.away}
                                    </span>
                                    <span className={`text-xl font-bold font-mono ${match.awayScore > match.homeScore ? 'text-primary' : 'text-muted-foreground'}`}>
                                        {match.awayScore}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
