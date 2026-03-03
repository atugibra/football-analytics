"use client"

export function PredictionSkeleton() {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      {/* Score Hero Skeleton */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="h-4 w-32 rounded bg-secondary" />
          <div className="h-6 w-28 rounded-full bg-secondary" />
        </div>
        <div className="flex items-center justify-center gap-6">
          <div className="flex flex-col items-center gap-2 flex-1">
            <div className="h-14 w-14 rounded-xl bg-secondary" />
            <div className="h-4 w-24 rounded bg-secondary" />
            <div className="h-3 w-12 rounded bg-secondary" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-12 w-10 rounded bg-secondary" />
            <div className="h-6 w-3 rounded bg-secondary" />
            <div className="h-12 w-10 rounded bg-secondary" />
          </div>
          <div className="flex flex-col items-center gap-2 flex-1">
            <div className="h-14 w-14 rounded-xl bg-secondary" />
            <div className="h-4 w-24 rounded bg-secondary" />
            <div className="h-3 w-12 rounded bg-secondary" />
          </div>
        </div>
      </div>

      {/* Two-column layout skeleton */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        {/* Left column */}
        <div className="xl:col-span-3 flex flex-col gap-4">
          {/* Probability Gauge */}
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="h-4 w-32 rounded bg-secondary mb-5" />
            <div className="flex flex-col items-center gap-5">
              <div className="h-44 w-44 rounded-full bg-secondary" />
              <div className="h-3 w-full rounded-full bg-secondary" />
              <div className="flex items-center justify-between w-full">
                <div className="flex flex-col items-center gap-1">
                  <div className="h-3 w-16 rounded bg-secondary" />
                  <div className="h-6 w-12 rounded bg-secondary" />
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="h-3 w-10 rounded bg-secondary" />
                  <div className="h-6 w-12 rounded bg-secondary" />
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="h-3 w-16 rounded bg-secondary" />
                  <div className="h-6 w-12 rounded bg-secondary" />
                </div>
              </div>
            </div>
          </div>
          {/* Insights skeleton */}
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="h-4 w-28 rounded bg-secondary mb-4" />
            <div className="flex flex-col gap-2.5">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-2.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-secondary shrink-0" />
                  <div className="h-3 w-full rounded bg-secondary" />
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Right column */}
        <div className="xl:col-span-2 flex flex-col gap-4">
          {/* Stat Comparison */}
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="h-4 w-32 rounded bg-secondary mb-5" />
            <div className="flex flex-col gap-3.5">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="h-3 w-8 rounded bg-secondary" />
                    <div className="h-2.5 w-16 rounded bg-secondary" />
                    <div className="h-3 w-8 rounded bg-secondary" />
                  </div>
                  <div className="h-2 w-full rounded-full bg-secondary" />
                </div>
              ))}
            </div>
          </div>
          {/* Confidence */}
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="h-4 w-32 rounded bg-secondary mb-4" />
            <div className="h-3 w-full rounded-full bg-secondary mb-4" />
            <div className="h-16 w-full rounded-lg bg-secondary" />
          </div>
        </div>
      </div>
    </div>
  )
}
