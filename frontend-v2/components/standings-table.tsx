"use client"

import { useState } from "react"
import { Trophy, TrendingUp, TrendingDown, Minus } from "lucide-react"

// Strict typography scale: text-sm (14px), text-base (16px), text-lg (20px), text-2xl (24px)
// Strict spacing: 8px grid (p-2, p-4, mt-2, mt-4, gap-2, gap-4)

interface StandingsTableProps {
    splitView: "overall" | "home" | "away"
}

export function StandingsTable({ splitView }: StandingsTableProps) {
    // Static placeholder data mimicking the backend
    const standingsData = [
        { rank: 1, team: "Arsenal", points: 85, played: 38, won: 26, drawn: 7, lost: 5, form: ["W", "W", "W", "D", "W"] },
        { rank: 2, team: "Man City", points: 83, played: 38, won: 25, drawn: 8, lost: 5, form: ["W", "W", "D", "L", "W"] },
        { rank: 3, team: "Liverpool", points: 79, played: 38, won: 22, drawn: 13, lost: 3, form: ["D", "W", "D", "W", "L"] },
        { rank: 4, team: "Aston Villa", points: 68, played: 38, won: 20, drawn: 8, lost: 10, form: ["W", "L", "D", "W", "W"] },
    ]

    // Modify dummy data slightly based on splitView to prove the UI works
    const displayData = standingsData.map(d => ({
        ...d,
        points: splitView === "home" ? Math.floor(d.points * 0.6) : splitView === "away" ? Math.floor(d.points * 0.4) : d.points
    }))

    const renderFormIcon = (result: string) => {
        switch (result) {
            case "W": return <TrendingUp className="h-4 w-4 text-success" />
            case "L": return <TrendingDown className="h-4 w-4 text-destructive" />
            default: return <Minus className="h-4 w-4 text-muted-foreground" />
        }
    }

    return (
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-primary" />
                    League Standings <span className="text-sm font-normal text-muted-foreground">({splitView.toUpperCase()})</span>
                </h3>
            </div>

            <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="border-b border-border bg-muted/50">
                        <tr>
                            <th className="p-4 font-medium text-muted-foreground">#</th>
                            <th className="p-4 font-medium text-muted-foreground w-full">Club</th>
                            <th className="p-4 font-medium text-muted-foreground text-center">MP</th>
                            <th className="p-4 font-medium text-muted-foreground text-center">W</th>
                            <th className="p-4 font-medium text-muted-foreground text-center">D</th>
                            <th className="p-4 font-medium text-muted-foreground text-center">L</th>
                            <th className="p-4 font-medium text-foreground text-center font-bold">Pts</th>
                            <th className="p-4 font-medium text-muted-foreground text-right">Form</th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayData.map((row, idx) => (
                            <tr
                                key={row.team}
                                className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${idx < 4 ? 'bg-primary/5' : ''}`}
                            >
                                <td className="p-4 font-mono text-muted-foreground">{row.rank}</td>
                                <td className="p-4 font-medium text-base">{row.team}</td>
                                <td className="p-4 text-center text-muted-foreground">{row.played}</td>
                                <td className="p-4 text-center text-muted-foreground">{row.won}</td>
                                <td className="p-4 text-center text-muted-foreground">{row.drawn}</td>
                                <td className="p-4 text-center text-muted-foreground">{row.lost}</td>
                                <td className="p-4 text-center font-bold text-base text-primary">{row.points}</td>
                                <td className="p-4">
                                    <div className="flex items-center justify-end gap-2">
                                        {row.form.map((f, i) => (
                                            <div key={i} className="flex h-6 w-6 items-center justify-center rounded bg-muted">
                                                {renderFormIcon(f)}
                                            </div>
                                        ))}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
