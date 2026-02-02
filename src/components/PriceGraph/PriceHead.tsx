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
        cy={y}
        r={12}
        fill="var(--chart-1)"
        opacity={0.2}
        initial={false}
        animate={{
          r: [12, 16, 12],
          opacity: [0.2, 0.1, 0.2],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      {/* Middle glow */}
      <motion.circle
        cx={x}
        cy={y}
        r={8}
        fill="var(--chart-1)"
        opacity={0.4}
        initial={false}
        animate={{
          r: [8, 10, 8],
          opacity: [0.4, 0.25, 0.4],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 0.1,
        }}
      />
      {/* Core dot */}
      <motion.circle
        cx={x}
        cy={y}
        r={4}
        fill="var(--chart-1)"
        initial={false}
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
