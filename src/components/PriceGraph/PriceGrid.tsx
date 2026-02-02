interface PriceGridProps {
  width: number
  height: number
  centerPrice: number
  priceStep: number
  visiblePriceRange: number
  paddingY: number
  onLineClick?: (price: number) => void
}

function formatPrice(price: number): string {
  if (price >= 1000) {
    return price.toLocaleString('en-US', { maximumFractionDigits: 0 })
  }
  return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function PriceGrid({
  width,
  height,
  centerPrice,
  priceStep,
  visiblePriceRange,
  paddingY,
  onLineClick,
}: PriceGridProps) {
  const centerY = height / 2
  const pixelsPerDollar = (height - 2 * paddingY) / visiblePriceRange

  // Generate lines at fixed intervals relative to smoothed center
  const lines: { y: number; price: number }[] = []

  // Find the nearest round price to center
  const nearestRoundPrice = Math.round(centerPrice / priceStep) * priceStep

  // Generate lines above and below center
  const numLines = Math.ceil(visiblePriceRange / priceStep / 2) + 1

  for (let i = -numLines; i <= numLines; i++) {
    const price = nearestRoundPrice + i * priceStep
    const y = centerY + (centerPrice - price) * pixelsPerDollar

    // Only include if within visible bounds (with some margin)
    if (y >= -20 && y <= height + 20) {
      lines.push({ y, price })
    }
  }

  return (
    <g className="price-grid">
      {lines.map(({ y, price }) => (
        <g
          key={price}
          onClick={() => onLineClick?.(price)}
          style={{ cursor: onLineClick ? 'pointer' : 'default' }}
        >
          {/* Invisible wider hit area for easier clicking */}
          <line
            x1={0}
            y1={y}
            x2={width}
            y2={y}
            stroke="transparent"
            strokeWidth={16}
          />
          <line
            x1={0}
            y1={y}
            x2={width}
            y2={y}
            stroke="black"
            strokeWidth={0.5}
            opacity={0.3}
          />
          <text
            x={6}
            y={y - 4}
            fontSize={10}
            fill="var(--muted-foreground)"
            opacity={0.6}
          >
            ${formatPrice(price)}
          </text>
        </g>
      ))}
    </g>
  )
}
