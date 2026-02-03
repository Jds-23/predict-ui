import { useCallback, useRef } from "react"
import type { BoxData, BoxTimeState } from "../lib/types"

export interface UseBoxEventsOptions {
	priceStep: number
	onBoxActivated?: (box: BoxData) => void
	onBoxExpired?: (box: BoxData) => void
}

export interface UseBoxEventsResult {
	processBoxes: (boxes: BoxData[], currentPrice: number) => void
	activatedBoxes: ReadonlySet<string>
	reset: () => void
}

/**
 * Check if price is within box range.
 * Box spans [(priceIndex-1)*priceStep, priceIndex*priceStep)
 */
function isPriceInBox(price: number, priceIndex: number, priceStep: number): boolean {
	const low = (priceIndex - 1) * priceStep
	const high = priceIndex * priceStep
	return price >= low && price < high
}

export function useBoxEvents({
	priceStep,
	onBoxActivated,
	onBoxExpired,
}: UseBoxEventsOptions): UseBoxEventsResult {
	const activatedRef = useRef<Set<string>>(new Set())
	const prevTimeStateRef = useRef<Map<string, BoxTimeState>>(new Map())

	const processBoxes = useCallback(
		(boxes: BoxData[], currentPrice: number) => {
			const activated = activatedRef.current
			const prevTimeState = prevTimeStateRef.current
			const currentKeys = new Set<string>()

			for (const box of boxes) {
				currentKeys.add(box.key)
				const prev = prevTimeState.get(box.key)

				// Check activation: current + price in range + not already activated
				if (
					box.timeState === "current" &&
					!activated.has(box.key) &&
					isPriceInBox(currentPrice, box.priceIndex, priceStep)
				) {
					activated.add(box.key)
					onBoxActivated?.(box)
				}

				// Check expiration: was current, now past, never activated
				if (prev === "current" && box.timeState === "past" && !activated.has(box.key)) {
					onBoxExpired?.(box)
				}

				// Update prev state
				prevTimeState.set(box.key, box.timeState)
			}

			// Cleanup keys no longer in visible boxes
			for (const key of prevTimeState.keys()) {
				if (!currentKeys.has(key)) {
					prevTimeState.delete(key)
					activated.delete(key)
				}
			}
		},
		[priceStep, onBoxActivated, onBoxExpired],
	)

	const reset = useCallback(() => {
		activatedRef.current.clear()
		prevTimeStateRef.current.clear()
	}, [])

	return {
		processBoxes,
		activatedBoxes: activatedRef.current,
		reset,
	}
}
