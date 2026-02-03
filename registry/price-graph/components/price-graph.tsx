import { useState, useEffect, useRef, useMemo, type ReactNode } from 'react'
import type { PriceAdapter } from '../adapters/types'
import type { PricePoint, BoxData } from '../lib/types'
import { usePriceBuffer } from '../hooks/use-price-buffer'
import { useAnimationTime } from '../hooks/use-animation-time'
import { PriceLine } from './price-line'
import { PriceHead } from './price-head'
import { TimeGrid } from './time-grid'
import { PriceGrid } from './price-grid'
import { GridBoxes } from './grid-boxes'

interface PriceGraphProps {
  adapter?: PriceAdapter
  priceData?: PricePoint | null
  isConnected?: boolean
  maxPoints?: number
  className?: string
  timeWindowSeconds?: number
  priceStep?: number
  smoothingMs?: number
  renderBoxes?: (boxes: BoxData[]) => ReactNode
}

const defaultRenderBoxes = (boxes: BoxData[]): ReactNode =>
  boxes.map((box) => (
    <rect
      key={box.key}
      x={box.x}
      y={box.y}
      width={box.width}
      height={box.height}
      fill="transparent"
      stroke="transparent"
    />
  ))

export function PriceGraph({
  adapter,
  priceData: manualPriceData,
  isConnected: manualIsConnected,
  maxPoints = 100,
  className = "",
  timeWindowSeconds = 25,
  priceStep = 200,
  smoothingMs = 500,
  renderBoxes = defaultRenderBoxes,
}: PriceGraphProps) {
  // Use adapter if provided, otherwise use manual props
  const priceData = adapter?.priceData ?? manualPriceData ?? null
  const isConnected = adapter?.isConnected ?? manualIsConnected ?? false

  const [points, setPoints] = useState<PricePoint[]>([])
  const [dimensions, setDimensions] = useState({ width: 800, height: 300 })
  const containerRef = useRef<HTMLDivElement>(null)
  const smoothedPriceRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number>(Date.now())

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
      const newPoints = buffer.addPoint(priceData.price, priceData.time)
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
  }, [points, smoothingMs, currentTime])

  // Visible price range based on step count (show ~5 steps above/below center)
  const visiblePriceRange = priceStep * 10

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
        {/* Clickable grid boxes - render first so lines appear on top */}
        {smoothedCenterPrice !== null && (
          <GridBoxes
            width={dimensions.width}
            height={dimensions.height}
            centerPrice={smoothedCenterPrice}
            priceStep={priceStep}
            visiblePriceRange={visiblePriceRange}
            paddingY={paddingY}
            currentTime={currentTime}
            pixelsPerMs={pixelsPerMs}
            timeIntervalMs={5000}
            timeWindowMs={timeWindowMs}
          >
            {renderBoxes}
          </GridBoxes>
        )}

        {/* Price grid - moves with smoothed center price */}
        {smoothedCenterPrice !== null && (
          <PriceGrid
            width={dimensions.width}
            height={dimensions.height}
            centerPrice={smoothedCenterPrice}
            priceStep={priceStep}
            visiblePriceRange={visiblePriceRange}
            paddingY={paddingY}
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
