import { motion } from 'framer-motion'

interface PriceHeadProps {
  x: number
  y: number
}

export function PriceHead({ x, y }: PriceHeadProps) {
  return (
    <g>
      {/* Outer glow */}
      <motion.circle
        cx={x}
        r={12}
        fill="var(--chart-1)"
        initial={{ cy: y, opacity: 0.2 }}
        animate={{
          cy: y,
          r: [12, 16, 12],
          opacity: [0.2, 0.1, 0.2],
        }}
        transition={{
          cy: { type: 'spring', stiffness: 300, damping: 30 },
          r: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
          opacity: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
        }}
      />
      {/* Middle glow */}
      <motion.circle
        cx={x}
        r={8}
        fill="var(--chart-1)"
        initial={{ cy: y, opacity: 0.4 }}
        animate={{
          cy: y,
          r: [8, 10, 8],
          opacity: [0.4, 0.25, 0.4],
        }}
        transition={{
          cy: { type: 'spring', stiffness: 300, damping: 30 },
          r: { duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.1 },
          opacity: { duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.1 },
        }}
      />
      {/* Core dot */}
      <motion.circle
        cx={x}
        r={4}
        fill="var(--chart-1)"
        initial={{ cy: y }}
        animate={{ cy: y }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30,
        }}
      />
    </g>
  )
}
