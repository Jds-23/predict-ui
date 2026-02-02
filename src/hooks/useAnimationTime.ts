import { useState, useEffect, useRef } from 'react'

/**
 * Returns continuously updating Unix timestamp for smooth animations.
 * Uses requestAnimationFrame (~60fps).
 */
export function useAnimationTime() {
  const [time, setTime] = useState(() => Date.now())
  const rafRef = useRef<number>(undefined)

  useEffect(() => {
    const tick = () => {
      setTime(Date.now())
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return time
}
