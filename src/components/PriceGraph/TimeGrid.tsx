interface TimeGridProps {
  width: number
  height: number
  currentTime: number
  pixelsPerMs: number
  timeWindowMs: number
  intervalMs?: number // grid line spacing (default 5s)
}

export function TimeGrid({
  width,
  height,
  currentTime,
  pixelsPerMs,
  timeWindowMs,
  intervalMs = 5000,
}: TimeGridProps) {
  const centerX = width / 2

  // Calculate visible time range
  const oldestVisibleTime = currentTime - timeWindowMs / 2
  const newestVisibleTime = currentTime + timeWindowMs / 2

  // Generate grid lines at fixed intervals
  const lines: { x: number; label: string; relativeS: number }[] = []

  // Start from a round interval before oldest visible time
  const startTime = Math.floor(oldestVisibleTime / intervalMs) * intervalMs

  for (let t = startTime; t <= newestVisibleTime; t += intervalMs) {
    const relativeMs = t - currentTime
    const x = centerX + relativeMs * pixelsPerMs

    // Only include if within visible bounds (with small margin)
    if (x >= -50 && x <= width + 50) {
      const relativeS = Math.round(relativeMs / 1000)
      const label = relativeS === 0 ? 'now' : `${relativeS}s`
      lines.push({ x, label, relativeS })
    }
  }

  return (
    <g className="time-grid">
      {lines.map(({ x, label, relativeS }) => (
        <g key={relativeS}>
          <line
            x1={x}
            y1={0}
            x2={x}
            y2={height}
            stroke="var(--border)"
            strokeWidth={relativeS === 0 ? 1 : 0.5}
            opacity={relativeS === 0 ? 0.5 : 0.25}
            strokeDasharray={relativeS === 0 ? '4 4' : undefined}
          />
          <text
            x={x}
            y={height - 6}
            textAnchor="middle"
            fontSize={10}
            fill="var(--muted-foreground)"
            opacity={0.6}
          >
            {label}
          </text>
        </g>
      ))}
    </g>
  )
}
