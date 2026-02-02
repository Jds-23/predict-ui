import { createFileRoute } from '@tanstack/react-router'
import { PriceGraph } from '../components/PriceGraph'
import { useBinancePrice } from '../../registry/price-graph'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  const adapter = useBinancePrice({ symbol: 'btcusdt', throttleMs: 250 })

  const handlePriceClick = (price: number) => {
    console.log('Clicked price:', price)
  }

  const handleBoxSelect = (boxes: Set<string>) => {
    console.log('Selected boxes:', [...boxes])
  }

  return (
    <div className="h-screen w-screen bg-background overflow-hidden">
      <PriceGraph
        adapter={adapter}
        maxPoints={100}
        onPriceLineClick={handlePriceClick}
        onBoxSelect={handleBoxSelect}
      />
    </div>
  )
}
