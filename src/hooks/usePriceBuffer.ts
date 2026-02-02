import { useRef, useMemo } from 'react'

export interface PricePoint {
  price: number
  time: number
}

interface UsePriceBufferOptions {
  maxPoints?: number
}

export function usePriceBuffer({ maxPoints = 100 }: UsePriceBufferOptions = {}) {
  const bufferRef = useRef<PricePoint[]>([])

  const addPoint = (price: number, time: number) => {
    const buffer = bufferRef.current
    buffer.push({ price, time })
    if (buffer.length > maxPoints) {
      buffer.shift()
    }
    return [...buffer]
  }

  const getPoints = () => [...bufferRef.current]

  const clear = () => {
    bufferRef.current = []
  }

  return useMemo(
    () => ({
      addPoint,
      getPoints,
      clear,
      maxPoints,
    }),
    [maxPoints]
  )
}
