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
  priceStep?: number // fixed price grid interval (default $200)
  smoothingMs?: number // exponential smoothing time constant (default 500ms)
  onPriceLineClick?: (price: number) => void
}

export function PriceGraph({
  symbol = 'btcusdt',
  maxPoints = 100,
  throttleMs = 250,
  className = '',
  timeWindowSeconds = 25,
  priceStep = 200,
  smoothingMs = 500,
  onPriceLineClick,
}: PriceGraphProps) {
  const [points, setPoints] = useState<PricePoint[]>([])
  const [dimensions, setDimensions] = useState({ width: 800, height: 300 })
  const containerRef = useRef<HTMLDivElement>(null)
  const smoothedPriceRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number>(Date.now())

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

  // Exponential smoothing for center price - follows latest price with delay
  const smoothedCenterPrice = useMemo(() => {
    if (points.length === 0) return null

    const latestPrice = points[points.length - 1].price
    const now = Date.now()
    const deltaMs = now - lastTimeRef.current
    lastTimeRef.current = now

    if (smoothedPriceRef.current === null) {
      smoothedPriceRef.current = latestPrice
    } else {
      const alpha = 1 - Math.exp(-deltaMs / smoothingMs)
      smoothedPriceRef.current += (latestPrice - smoothedPriceRef.current) * alpha
    }

    return smoothedPriceRef.current
  }, [points, smoothingMs, currentTime]) // currentTime triggers update each frame

  // Visible price range based on step count (show ~5 steps above/below center)
  const visiblePriceRange = priceStep * 10 // $2000 total range for $200 step

  // Filter points to only those in visible time window
  const visiblePoints = useMemo(() => {
    const oldestVisibleTime = currentTime - timeWindowMs / 2
    return points.filter((p) => p.time >= oldestVisibleTime)
  }, [points, currentTime, timeWindowMs])

  // Calculate head Y position relative to smoothed center
  const headY = useMemo(() => {
    if (points.length === 0 || smoothedCenterPrice === null) return dimensions.height / 2

    const lastPoint = points[points.length - 1]
    const centerY = dimensions.height / 2
    const pixelsPerDollar = (dimensions.height - 2 * paddingY) / visiblePriceRange

    return centerY + (smoothedCenterPrice - lastPoint.price) * pixelsPerDollar
  }, [points, smoothedCenterPrice, dimensions.height, paddingY, visiblePriceRange])

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
        {/* Price grid - moves with smoothed center price */}
        {smoothedCenterPrice !== null && (
          <PriceGrid
            width={dimensions.width}
            height={dimensions.height}
            centerPrice={smoothedCenterPrice}
            priceStep={priceStep}
            visiblePriceRange={visiblePriceRange}
            paddingY={paddingY}
            onLineClick={onPriceLineClick}
          />
        )}

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
        {smoothedCenterPrice !== null && (
          <PriceLine
            points={visiblePoints}
            currentTime={currentTime}
            pixelsPerMs={pixelsPerMs}
            centerX={centerX}
            height={dimensions.height}
            centerPrice={smoothedCenterPrice}
            visiblePriceRange={visiblePriceRange}
            paddingY={paddingY}
          />
        )}

        {/* Head dot (current price) - always at center X */}
        {points.length > 0 && <PriceHead x={centerX} y={headY} />}
      </svg>
    </div>
  )
}
