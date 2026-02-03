import { useMemo } from "react"
import type { BoxData, BoxTimeState } from "../lib/types"

export interface UseGridBoxesOptions {
	width: number
	height: number
	centerPrice: number
	priceStep: number
	visiblePriceRange: number
	paddingY: number
	currentTime: number
	pixelsPerMs: number
	timeIntervalMs: number
	timeWindowMs: number
}

export function useGridBoxes({
	width,
	height,
	centerPrice,
	priceStep,
	visiblePriceRange,
	paddingY,
	currentTime,
	pixelsPerMs,
	timeIntervalMs,
	timeWindowMs,
}: UseGridBoxesOptions): BoxData[] {
	const centerY = height / 2
	const centerX = width / 2
	const pixelsPerDollar = (height - 2 * paddingY) / visiblePriceRange

	// Current time index for determining past/current/future
	const currentTimeIndex = Math.floor(currentTime / timeIntervalMs)

	// Generate price line Y positions
	const priceLines = useMemo(() => {
		const lines: { y: number; priceIndex: number }[] = []
		const nearestRoundPrice = Math.round(centerPrice / priceStep) * priceStep
		const numLines = Math.ceil(visiblePriceRange / priceStep / 2) + 2

		for (let i = -numLines; i <= numLines; i++) {
			const price = nearestRoundPrice + i * priceStep
			const y = centerY + (centerPrice - price) * pixelsPerDollar
			const priceIndex = Math.round(price / priceStep)
			lines.push({ y, priceIndex })
		}

		return lines.sort((a, b) => a.y - b.y)
	}, [centerPrice, priceStep, visiblePriceRange, centerY, pixelsPerDollar])

	// Generate time line X positions
	const timeLines = useMemo(() => {
		const lines: { x: number; timeIndex: number }[] = []
		const oldestVisibleTime = currentTime - timeWindowMs / 2
		const newestVisibleTime = currentTime + timeWindowMs / 2
		const startTime = Math.floor(oldestVisibleTime / timeIntervalMs) * timeIntervalMs

		for (let t = startTime; t <= newestVisibleTime + timeIntervalMs; t += timeIntervalMs) {
			const relativeMs = t - currentTime
			const x = centerX + relativeMs * pixelsPerMs
			const timeIndex = Math.floor(t / timeIntervalMs)
			lines.push({ x, timeIndex })
		}

		return lines.sort((a, b) => a.x - b.x)
	}, [currentTime, timeIntervalMs, timeWindowMs, centerX, pixelsPerMs])

	// Generate boxes with time state
	const boxes = useMemo(() => {
		const result: BoxData[] = []

		for (let pi = 0; pi < priceLines.length - 1; pi++) {
			for (let ti = 0; ti < timeLines.length - 1; ti++) {
				const top = priceLines[pi].y
				const bottom = priceLines[pi + 1].y
				const left = timeLines[ti].x
				const right = timeLines[ti + 1].x

				// Skip if completely outside visible area
				if (right < 0 || left > width || bottom < 0 || top > height) continue

				const priceIndex = priceLines[pi].priceIndex
				const timeIndex = timeLines[ti].timeIndex

				const timeState: BoxTimeState =
					timeIndex < currentTimeIndex
						? "past"
						: timeIndex === currentTimeIndex
							? "current"
							: "future"

				result.push({
					key: `${priceIndex}:${timeIndex}`,
					x: left,
					y: top,
					width: right - left,
					height: bottom - top,
					priceIndex,
					timeIndex,
					timeState,
				})
			}
		}

		return result
	}, [priceLines, timeLines, width, height, currentTimeIndex])

	return boxes
}
