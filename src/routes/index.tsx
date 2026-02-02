import { createFileRoute } from '@tanstack/react-router'
import { PriceGraph } from '../components/PriceGraph'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  const handlePriceClick = (price: number) => {
    console.log('Clicked price:', price)
  }

  return (
    <div className="h-screen w-screen bg-background overflow-hidden">
      <PriceGraph
        symbol="btcusdt"
        maxPoints={100}
        throttleMs={250}
        onPriceLineClick={handlePriceClick}
      />
    </div>
  )
}
