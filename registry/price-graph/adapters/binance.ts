import { useEffect, useRef, useState, useCallback } from 'react'
import type { PriceAdapter } from './types'
import type { PricePoint } from '../lib/types'

interface UseBinancePriceOptions {
  symbol?: string
  throttleMs?: number
}

export function useBinancePrice({
  symbol = 'btcusdt',
  throttleMs = 250,
}: UseBinancePriceOptions = {}): PriceAdapter {
  const [priceData, setPriceData] = useState<PricePoint | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const lastUpdateRef = useRef<number>(0)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    const ws = new WebSocket(
      `wss://stream.binance.com:9443/ws/${symbol}@trade`
    )

    ws.onopen = () => {
      setIsConnected(true)
      setError(null)
    }

    ws.onmessage = (event) => {
      const now = Date.now()
      if (now - lastUpdateRef.current < throttleMs) return
      lastUpdateRef.current = now

      try {
        const data = JSON.parse(event.data)
        setPriceData({
          price: parseFloat(data.p),
          time: data.T,
        })
      } catch {
        // ignore parse errors
      }
    }

    ws.onerror = () => {
      setError('WebSocket error')
      setIsConnected(false)
    }

    ws.onclose = () => {
      setIsConnected(false)
      reconnectTimeoutRef.current = setTimeout(connect, 2000)
    }

    wsRef.current = ws
  }, [symbol, throttleMs])

  useEffect(() => {
    connect()

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      wsRef.current?.close()
    }
  }, [connect])

  return { priceData, isConnected, error }
}
