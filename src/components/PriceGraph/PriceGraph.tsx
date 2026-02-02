import { useState, useEffect, useRef, useCallback } from 'react'
import { useBinancePrice } from '../../hooks/useBinancePrice'
import { usePriceBuffer, type PricePoint } from '../../hooks/usePriceBuffer'
import { PriceLine } from './PriceLine'
import { PriceHead } from './PriceHead'

interface PriceGraphProps {
  symbol?: string
  maxPoints?: number
  throttleMs?: number
  className?: string
}

export function PriceGraph({
  symbol = 'btcusdt',
  maxPoints = 100,
  throttleMs = 250,
  className = '',
}: PriceGraphProps) {
  const [points, setPoints] = useState<PricePoint[]>([])
  const [dimensions, setDimensions] = useState({ width: 800, height: 300 })
  const containerRef = useRef<HTMLDivElement>(null)

  const { priceData, isConnected } = useBinancePrice({ symbol, throttleMs })
  const buffer = usePriceBuffer({ maxPoints })

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

  // Calculate price range with padding
  const { minPrice, maxPrice } = useCallback(() => {
    if (points.length === 0) return { minPrice: 0, maxPrice: 100 }
    const prices = points.map((p) => p.price)
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    const range = max - min || 1
    const padding = range * 0.1
    return { minPrice: min - padding, maxPrice: max + padding }
  }, [points])()

  // Calculate head position (always at center horizontally)
  const getHeadPosition = () => {
    if (points.length === 0) return { x: dimensions.width / 2, y: dimensions.height / 2 }

    const lastPoint = points[points.length - 1]
    const priceRange = maxPrice - minPrice || 1
    const paddingY = 0.05 * dimensions.height

    return {
      x: dimensions.width / 2,
      y: paddingY + ((maxPrice - lastPoint.price) / priceRange) * (dimensions.height - 2 * paddingY),
    }
  }

  const headPos = getHeadPosition()

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
        {/* Grid lines (subtle) */}
        <defs>
          <pattern
            id="grid"
            width={dimensions.width / 10}
            height={dimensions.height / 5}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${dimensions.width / 10} 0 L 0 0 0 ${dimensions.height / 5}`}
              fill="none"
              stroke="var(--border)"
              strokeWidth={0.5}
              opacity={0.3}
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Center line (vertical guide where head sits) */}
        <line
          x1={dimensions.width / 2}
          y1={0}
          x2={dimensions.width / 2}
          y2={dimensions.height}
          stroke="var(--border)"
          strokeWidth={1}
          strokeDasharray="4 4"
          opacity={0.5}
        />

        {/* Price line */}
        <PriceLine
          points={points}
          width={dimensions.width}
          height={dimensions.height}
          minPrice={minPrice}
          maxPrice={maxPrice}
        />

        {/* Head dot (current price) */}
        {points.length > 0 && <PriceHead x={headPos.x} y={headPos.y} />}
      </svg>
    </div>
  )
}
