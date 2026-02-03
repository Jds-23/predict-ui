import { createFileRoute } from "@tanstack/react-router";
import { usePythPrice } from "../../registry/price-graph";
import { PriceGraph } from "../components/PriceGraph";

export const Route = createFileRoute("/pyth")({
	component: PythPage,
});

function PythPage() {
	const adapter = usePythPrice({ symbol: "Crypto.BTC/USD", throttleMs: 250 });

	const handlePriceClick = (price: number) => {
		console.log("Clicked price:", price);
	};

	const handleBoxSelect = (boxes: Set<string>) => {
		console.log("Selected boxes:", [...boxes]);
	};

	return (
		<div className="h-screen w-screen bg-background overflow-hidden">
			<PriceGraph
				adapter={adapter}
				maxPoints={100}
				onPriceLineClick={handlePriceClick}
				onBoxSelect={handleBoxSelect}
			/>
		</div>
	);
}
