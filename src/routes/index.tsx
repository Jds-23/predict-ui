import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { PriceGraph } from "../components/PriceGraph"
import { useBinancePrice } from "../../registry/price-graph"

export const Route = createFileRoute("/")({
  component: App,
})

function App() {
  const adapter = useBinancePrice({ symbol: "btcusdt", throttleMs: 250 })
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
