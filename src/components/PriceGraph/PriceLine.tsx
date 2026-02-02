import { useRef, useEffect, useState } from 'react'
import type { PricePoint } from '../../hooks/usePriceBuffer'

interface PriceLineProps {
  points: PricePoint[]
  width: number
  height: number
  minPrice: number
  maxPrice: number
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

export function PriceLine({ points, width, height, minPrice, maxPrice }: PriceLineProps) {
  const [animatedCoords, setAnimatedCoords] = useState<Coord[]>([])
  const prevCoordsRef = useRef<Coord[]>([])
  const animationRef = useRef<number>(undefined)

  const priceRange = maxPrice - minPrice || 1
  const padding = 0.05 * height

  // Calculate target coordinates
  const targetCoords: Coord[] = points.map((p, i) => {
    const totalPoints = points.length
    // Position so that the last point (head) is at center
    const x = width / 2 + (i - (totalPoints - 1)) * (width / (totalPoints - 1 || 1))
    const y = padding + ((maxPrice - p.price) / priceRange) * (height - 2 * padding)
    return { x, y }
  })

  // Animate coordinates smoothly
  useEffect(() => {
    if (targetCoords.length === 0) return

    const prevCoords = prevCoordsRef.current
    const startTime = performance.now()
    const duration = 200 // ms

    // If first render or length changed significantly, just set directly
    if (prevCoords.length === 0 || Math.abs(prevCoords.length - targetCoords.length) > 1) {
      setAnimatedCoords(targetCoords)
      prevCoordsRef.current = targetCoords
      return
    }

    // Cancel any ongoing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }

    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)

      // Interpolate between prev and target coords
      // If counts differ, interpolate what we can and fill rest from target
      const maxLen = Math.max(prevCoords.length, targetCoords.length)
      const interpolated: Coord[] = []

      for (let i = 0; i < maxLen; i++) {
        const prev = prevCoords[i] || targetCoords[i]
        const target = targetCoords[i] || prevCoords[i]
        interpolated.push({
          x: prev.x + (target.x - prev.x) * eased,
          y: prev.y + (target.y - prev.y) * eased,
        })
      }

      setAnimatedCoords(interpolated)

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        prevCoordsRef.current = targetCoords
      }
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [points, width, height, minPrice, maxPrice])

  const path = generatePath(animatedCoords)

  if (!path) return null

  return (
    <path
      d={path}
      fill="none"
      stroke="var(--chart-1)"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        willChange: 'auto',
      }}
    />
  )
}
