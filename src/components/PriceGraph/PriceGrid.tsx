interface PriceGridProps {
  width: number
  height: number
  minPrice: number
  maxPrice: number
  paddingY: number
}

/**
 * Calculate nice round numbers for grid lines
 */
function calculateNiceStep(min: number, max: number, targetLines: number = 5): number {
  const range = max - min
  const roughStep = range / targetLines

  // Find order of magnitude
  const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)))

  // Normalize to 1-10 range
  const normalized = roughStep / magnitude

  // Pick a nice step: 1, 2, 5, or 10
  let niceNormalized: number
  if (normalized < 1.5) niceNormalized = 1
  else if (normalized < 3.5) niceNormalized = 2
  else if (normalized < 7.5) niceNormalized = 5
  else niceNormalized = 10

  return niceNormalized * magnitude
}

function formatPrice(price: number): string {
  if (price >= 1000) {
    return price.toLocaleString('en-US', { maximumFractionDigits: 0 })
  }
  return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function PriceGrid({ width, height, minPrice, maxPrice, paddingY }: PriceGridProps) {
  const priceRange = maxPrice - minPrice || 1
  const step = calculateNiceStep(minPrice, maxPrice, 5)

  // Generate horizontal lines at nice price intervals
  const lines: { y: number; price: number }[] = []

  const startPrice = Math.ceil(minPrice / step) * step

  for (let p = startPrice; p <= maxPrice; p += step) {
    const y = paddingY + ((maxPrice - p) / priceRange) * (height - 2 * paddingY)
    // Only include if within visible bounds
    if (y >= paddingY - 10 && y <= height - paddingY + 10) {
      lines.push({ y, price: p })
    }
  }

  return (
    <g className="price-grid">
      {lines.map(({ y, price }) => (
        <g key={price}>
          <line
            x1={0}
            y1={y}
            x2={width}
            y2={y}
            stroke="var(--border)"
            strokeWidth={0.5}
            opacity={0.25}
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
