import { createFileRoute } from '@tanstack/react-router'
import { PriceGraph } from '../components/PriceGraph'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-4">BTC/USDT Live</h1>
        <div className="w-full h-[400px] rounded-lg border border-border bg-card">
          <PriceGraph symbol="btcusdt" maxPoints={100} throttleMs={250} />
        </div>
      </div>
    </div>
  )
}
