import { useEffect, useRef, useState, useCallback } from "react"
import type { PriceAdapter } from "./types"
import type { PricePoint } from "../lib/types"

interface UsePythPriceOptions {
	symbol?: string
	throttleMs?: number
}

const STREAMING_URL =
	"https://benchmarks.pyth.network/v1/shims/tradingview/streaming"
const MAX_RETRIES = 3
const RETRY_DELAY_MS = 3000

export function usePythPrice({
	symbol = "Crypto.BTC/USD",
	throttleMs = 250,
}: UsePythPriceOptions = {}): PriceAdapter {
	const [priceData, setPriceData] = useState<PricePoint | null>(null)
	const [isConnected, setIsConnected] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const abortControllerRef = useRef<AbortController | null>(null)
	const lastUpdateRef = useRef<number>(0)
	const retryCountRef = useRef<number>(0)
	const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)

	const connect = useCallback(async () => {
		// Abort any existing connection
		abortControllerRef.current?.abort()
		abortControllerRef.current = new AbortController()

		try {
			const response = await fetch(STREAMING_URL, {
				signal: abortControllerRef.current.signal,
			})

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}`)
			}

			const reader = response.body?.getReader()
			if (!reader) {
				throw new Error("No readable stream")
			}

			setIsConnected(true)
			setError(null)
			retryCountRef.current = 0

			const decoder = new TextDecoder()
			let buffer = ""

			while (true) {
				const { done, value } = await reader.read()
				if (done) break

				buffer += decoder.decode(value, { stream: true })
				const lines = buffer.split("\n")
				buffer = lines.pop() || ""

				for (const line of lines) {
					if (!line.trim()) continue

					try {
						const data = JSON.parse(line)
						if (data.id === symbol) {
							const now = Date.now()
							if (now - lastUpdateRef.current < throttleMs) continue
							lastUpdateRef.current = now

							setPriceData({
								price: data.p,
								time: data.t * 1000, // convert seconds to ms
							})
						}
					} catch {
						// ignore parse errors
					}
				}
			}

			// Stream ended normally, attempt reconnect
			setIsConnected(false)
			scheduleReconnect()
		} catch (err) {
			if ((err as Error).name === "AbortError") return

			setIsConnected(false)
			setError((err as Error).message)
			scheduleReconnect()
		}
	}, [symbol, throttleMs])

	const scheduleReconnect = useCallback(() => {
		if (retryCountRef.current >= MAX_RETRIES) {
			setError(`Failed after ${MAX_RETRIES} retries`)
			return
		}

		retryCountRef.current++
		reconnectTimeoutRef.current = setTimeout(connect, RETRY_DELAY_MS)
	}, [connect])

	useEffect(() => {
		connect()

		return () => {
			if (reconnectTimeoutRef.current) {
				clearTimeout(reconnectTimeoutRef.current)
			}
			abortControllerRef.current?.abort()
		}
	}, [connect])

	return { priceData, isConnected, error }
}
