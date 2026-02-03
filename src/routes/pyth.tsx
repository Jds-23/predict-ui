import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { PriceGraph, usePythPrice, type BoxData } from "../../registry/price-graph"

export const Route = createFileRoute("/pyth")({
	component: PythPage,
})

function PythPage() {
	const adapter = usePythPrice({ symbol: "Crypto.BTC/USD", throttleMs: 250 })
	const [selectedBoxes, setSelectedBoxes] = useState<Set<string>>(new Set())
	const [hoveredBox, setHoveredBox] = useState<string | null>(null)

	const toggleBox = (key: string) => {
		setSelectedBoxes((prev) => {
			const next = new Set(prev)
			next.has(key) ? next.delete(key) : next.add(key)
			return next
		})
		console.log("Clicked box:", key)
	}

	const renderBoxes = (boxes: BoxData[]) =>
		boxes.map((box) => {
			const isSelected = selectedBoxes.has(box.key)
			const isHovered = hoveredBox === box.key

			return (
				<rect
					key={box.key}
					x={box.x}
					y={box.y}
					width={box.width}
					height={box.height}
					fill={
						isSelected
							? "rgba(59, 130, 246, 0.3)"
							: isHovered
								? "rgba(59, 130, 246, 0.15)"
								: "transparent"
					}
					stroke="transparent"
					style={{ cursor: "pointer" }}
					onMouseEnter={() => setHoveredBox(box.key)}
					onMouseLeave={() => setHoveredBox(null)}
					onClick={() => toggleBox(box.key)}
				/>
			)
		})

	return (
		<div className="h-screen w-screen bg-background overflow-hidden">
			<PriceGraph adapter={adapter} maxPoints={100} renderBoxes={renderBoxes} />
		</div>
	)
}
