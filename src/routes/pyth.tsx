import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { usePythPrice } from "../../registry/price-graph"
import { PriceGraph } from "../components/PriceGraph"

export const Route = createFileRoute("/pyth")({
	component: PythPage,
})

function PythPage() {
	const adapter = usePythPrice({ symbol: "Crypto.BTC/USD", throttleMs: 250 })
	const [selectedBoxes, setSelectedBoxes] = useState<Set<string>>(new Set())

	const handleBoxClick = (boxKey: string) => {
		setSelectedBoxes((prev) => {
			const next = new Set(prev)
			next.has(boxKey) ? next.delete(boxKey) : next.add(boxKey)
			return next
		})
		console.log("Clicked box:", boxKey)
	}

	return (
		<div className="h-screen w-screen bg-background overflow-hidden">
			<PriceGraph
				adapter={adapter}
				maxPoints={100}
				selectedBoxes={selectedBoxes}
				onBoxClick={handleBoxClick}
			/>
		</div>
	)
}
