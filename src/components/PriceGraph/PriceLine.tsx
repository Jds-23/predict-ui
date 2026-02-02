import type { PricePoint } from '../../hooks/usePriceBuffer'

interface PriceLineProps {
  points: PricePoint[]
  currentTime: number
  pixelsPerMs: number
  centerX: number
  height: number
  minPrice: number
  maxPrice: number
  paddingY: number
}

interface Coord {
  x: number
  y: number
}

function generatePath(coords: Coord[]): string {
  if (coords.length < 2) return ''

  // Generate smooth cubic bezier path using Catmull-Rom to Bezier conversion
  let path = `M ${coords[0].x.toFixed(2)} ${coords[0].y.toFixed(2)}`

  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[i - 1] || coords[i]
    const p1 = coords[i]
    const p2 = coords[i + 1]
    const p3 = coords[i + 2] || p2

    // Catmull-Rom to Bezier conversion
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6

    path += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`
  }

  return path
}

export function PriceLine({
  points,
  currentTime,
  pixelsPerMs,
  centerX,
  height,
  minPrice,
  maxPrice,
  paddingY,
}: PriceLineProps) {
  const priceRange = maxPrice - minPrice || 1

  // Calculate coordinates based on time (not array index)
  const coords: Coord[] = points.map((p) => {
    // X position: relative to currentTime, centered at centerX
    const relativeMs = p.time - currentTime
    const x = centerX + relativeMs * pixelsPerMs

    // Y position: price mapped to height
    const y = paddingY + ((maxPrice - p.price) / priceRange) * (height - 2 * paddingY)

    return { x, y }
  })

  // Extend line to center (head position) using last point's Y
  if (coords.length > 0) {
    const lastCoord = coords[coords.length - 1]
    if (lastCoord.x < centerX) {
      coords.push({ x: centerX, y: lastCoord.y })
    }
  }

  const path = generatePath(coords)

  if (!path) return null

  return (
    <path
      d={path}
      fill="none"
      stroke="var(--chart-1)"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  )
}
