import { useState, useEffect, useRef, useMemo } from 'react'
import { useBinancePrice } from '../../hooks/useBinancePrice'
import { usePriceBuffer, type PricePoint } from '../../hooks/usePriceBuffer'
import { useAnimationTime } from '../../hooks/useAnimationTime'
import { PriceLine } from './PriceLine'
import { PriceHead } from './PriceHead'
import { TimeGrid } from './TimeGrid'
import { PriceGrid } from './PriceGrid'

interface PriceGraphProps {
  symbol?: string
  maxPoints?: number
  throttleMs?: number
  className?: string
  timeWindowSeconds?: number
}

export function PriceGraph({
  symbol = 'btcusdt',
  maxPoints = 100,
  throttleMs = 250,
  className = '',
  timeWindowSeconds = 25,
}: PriceGraphProps) {
  const [points, setPoints] = useState<PricePoint[]>([])
  const [dimensions, setDimensions] = useState({ width: 800, height: 300 })
  const containerRef = useRef<HTMLDivElement>(null)

  const { priceData, isConnected } = useBinancePrice({ symbol, throttleMs })
  const buffer = usePriceBuffer({ maxPoints })
  const currentTime = useAnimationTime()

  const timeWindowMs = timeWindowSeconds * 1000
  const pixelsPerMs = dimensions.width / timeWindowMs

  const centerX = dimensions.width / 2
  const paddingY = 0.05 * dimensions.height

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setDimensions({ width: rect.width, height: rect.height })
      }
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  // Add new price points to buffer
  useEffect(() => {
    if (priceData) {
      const newPoints = buffer.addPoint(priceData.price, priceData.timestamp)
      setPoints(newPoints)
    }
  }, [priceData, buffer])

  // Calculate price range with padding - memoized to avoid recalc every frame
  const { minPrice, maxPrice } = useMemo(() => {
    if (points.length === 0) return { minPrice: 0, maxPrice: 100 }
    const prices = points.map((p) => p.price)
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    const range = max - min || 1
    const padding = range * 0.1
    return { minPrice: min - padding, maxPrice: max + padding }
  }, [points])

  // Filter points to only those in visible time window
  const visiblePoints = useMemo(() => {
    const oldestVisibleTime = currentTime - timeWindowMs / 2
    return points.filter((p) => p.time >= oldestVisibleTime)
  }, [points, currentTime, timeWindowMs])

  // Calculate head Y position (X is always center)
  const headY = useMemo(() => {
    if (points.length === 0) return dimensions.height / 2

    const lastPoint = points[points.length - 1]
    const priceRange = maxPrice - minPrice || 1

    return paddingY + ((maxPrice - lastPoint.price) / priceRange) * (dimensions.height - 2 * paddingY)
  }, [points, maxPrice, minPrice, dimensions.height, paddingY])

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full min-h-[200px] ${className}`}
    >
      {/* Connection status indicator */}
      <div className="absolute top-2 right-2 flex items-center gap-2 text-xs text-muted-foreground">
        <span
          className={`w-2 h-2 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          }`}
        />
        {isConnected ? 'Live' : 'Disconnected'}
      </div>

      <svg
        width={dimensions.width}
        height={dimensions.height}
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        preserveAspectRatio="none"
        className="overflow-visible"
      >
        {/* Price grid - static horizontal lines */}
        <PriceGrid
          width={dimensions.width}
          height={dimensions.height}
          minPrice={minPrice}
          maxPrice={maxPrice}
          paddingY={paddingY}
        />

        {/* Time grid - moves with time */}
        <TimeGrid
          width={dimensions.width}
          height={dimensions.height}
          currentTime={currentTime}
          pixelsPerMs={pixelsPerMs}
          timeWindowMs={timeWindowMs}
          intervalMs={5000}
        />

        {/* Price line - coordinates calculated from time */}
        <PriceLine
          points={visiblePoints}
          currentTime={currentTime}
          pixelsPerMs={pixelsPerMs}
          centerX={centerX}
          height={dimensions.height}
          minPrice={minPrice}
          maxPrice={maxPrice}
          paddingY={paddingY}
        />

        {/* Head dot (current price) - always at center X */}
        {points.length > 0 && <PriceHead x={centerX} y={headY} />}
      </svg>
    </div>
  )
}
