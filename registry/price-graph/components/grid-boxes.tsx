import { useState, useMemo } from 'react'

interface GridBoxesProps {
  width: number
  height: number
  centerPrice: number
  priceStep: number
  visiblePriceRange: number
  paddingY: number
  currentTime: number
  pixelsPerMs: number
  timeIntervalMs: number
  timeWindowMs: number
  onBoxSelect?: (boxes: Set<string>) => void
}

interface BoxKey {
  priceIndex: number
  timeIndex: number
}

function boxKeyToString(key: BoxKey): string {
  return `${key.priceIndex}:${key.timeIndex}`
}

export function GridBoxes({
  width,
  height,
  centerPrice,
  priceStep,
  visiblePriceRange,
  paddingY,
  currentTime,
  pixelsPerMs,
  timeIntervalMs,
  timeWindowMs,
  onBoxSelect,
}: GridBoxesProps) {
  const [hoveredBox, setHoveredBox] = useState<string | null>(null)
  const [selectedBoxes, setSelectedBoxes] = useState<Set<string>>(new Set())

  const centerY = height / 2
  const centerX = width / 2
  const pixelsPerDollar = (height - 2 * paddingY) / visiblePriceRange

  // Generate price line Y positions
  const priceLines = useMemo(() => {
    const lines: { y: number; priceIndex: number }[] = []
    const nearestRoundPrice = Math.round(centerPrice / priceStep) * priceStep
    const numLines = Math.ceil(visiblePriceRange / priceStep / 2) + 2

    for (let i = -numLines; i <= numLines; i++) {
      const price = nearestRoundPrice + i * priceStep
      const y = centerY + (centerPrice - price) * pixelsPerDollar
      const priceIndex = Math.round(price / priceStep)
      lines.push({ y, priceIndex })
    }

    return lines.sort((a, b) => a.y - b.y)
  }, [centerPrice, priceStep, visiblePriceRange, centerY, pixelsPerDollar, paddingY])

  // Generate time line X positions
  const timeLines = useMemo(() => {
    const lines: { x: number; timeIndex: number }[] = []
    const oldestVisibleTime = currentTime - timeWindowMs / 2
    const newestVisibleTime = currentTime + timeWindowMs / 2
    const startTime = Math.floor(oldestVisibleTime / timeIntervalMs) * timeIntervalMs

    for (let t = startTime; t <= newestVisibleTime + timeIntervalMs; t += timeIntervalMs) {
      const relativeMs = t - currentTime
      const x = centerX + relativeMs * pixelsPerMs
      const timeIndex = Math.floor(t / timeIntervalMs)
      lines.push({ x, timeIndex })
    }

    return lines.sort((a, b) => a.x - b.x)
  }, [currentTime, timeIntervalMs, timeWindowMs, centerX, pixelsPerMs])

  // Generate boxes from adjacent price/time lines
  const boxes = useMemo(() => {
    const result: {
      x: number
      y: number
      width: number
      height: number
      key: string
    }[] = []

    for (let pi = 0; pi < priceLines.length - 1; pi++) {
      for (let ti = 0; ti < timeLines.length - 1; ti++) {
        const top = priceLines[pi].y
        const bottom = priceLines[pi + 1].y
        const left = timeLines[ti].x
        const right = timeLines[ti + 1].x

        // Skip if completely outside visible area
        if (right < 0 || left > width || bottom < 0 || top > height) continue

        const boxKey = boxKeyToString({
          priceIndex: priceLines[pi].priceIndex,
          timeIndex: timeLines[ti].timeIndex,
        })

        result.push({
          x: left,
          y: top,
          width: right - left,
          height: bottom - top,
          key: boxKey,
        })
      }
    }

    return result
  }, [priceLines, timeLines, width, height])

  const handleClick = (key: string) => {
    setSelectedBoxes((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      onBoxSelect?.(next)
      return next
    })
  }

  return (
    <g className="grid-boxes">
      {boxes.map((box) => {
        const isHovered = hoveredBox === box.key
        const isSelected = selectedBoxes.has(box.key)

        return (
          <rect
            key={box.key}
            x={box.x}
            y={box.y}
            width={box.width}
            height={box.height}
            fill={
              isSelected
                ? 'rgba(59, 130, 246, 0.3)'
                : isHovered
                  ? 'rgba(59, 130, 246, 0.15)'
                  : 'transparent'
            }
            stroke="transparent"
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => setHoveredBox(box.key)}
            onMouseLeave={() => setHoveredBox(null)}
            onClick={() => handleClick(box.key)}
          />
        )
      })}
    </g>
  )
}
