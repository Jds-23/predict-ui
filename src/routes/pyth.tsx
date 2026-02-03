import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
	type BoxData,
	PriceGraph,
	usePythPrice,
} from "../../registry/price-graph";
import { BottomBar } from "@/components/BottomBar";

export const Route = createFileRoute("/pyth")({
	component: PythPage,
});

const TRADING_PAIRS = [
	{ value: "Crypto.BTC/USD", label: "BTC/USD" },
	{ value: "Crypto.ETH/USD", label: "ETH/USD" },
	{ value: "Crypto.SOL/USD", label: "SOL/USD" },
];

const getBoxFill = (box: BoxData, isSelected: boolean, isHovered: boolean) => {
	if (isSelected) return "rgba(59, 130, 246, 0.3)";
	if (isHovered) return "rgba(59, 130, 246, 0.15)";
	if (box.timeState === "past") return "rgba(128, 128, 128, 0.2)";
	return "transparent";
};

const getBoxText = (_box: BoxData, isSelected: boolean, isHovered: boolean) => {
	if (isSelected) return "✓";
	if (isHovered) return "?";
	return null;
};

function PythPage() {
	const [selectedPair, setSelectedPair] = useState("Crypto.BTC/USD");
	const [amount, setAmount] = useState("");

	const adapter = usePythPrice({ symbol: selectedPair, throttleMs: 250 });
	const [selectedBoxes, setSelectedBoxes] = useState<Set<string>>(new Set());
	const [hoveredBox, setHoveredBox] = useState<string | null>(null);

	const toggleBox = (key: string) => {
		setSelectedBoxes((prev) => {
			const next = new Set(prev);
			next.has(key) ? next.delete(key) : next.add(key);
			return next;
		});
		console.log("Clicked box:", key);
	};

	const renderBoxes = (boxes: BoxData[]) =>
		boxes.map((box) => {
			const isSelected = selectedBoxes.has(box.key);
			const isHovered = hoveredBox === box.key;
			const text = getBoxText(box, isSelected, isHovered);

			return (
				<g key={box.key}>
					<rect
						x={box.x}
						y={box.y}
						width={box.width}
						height={box.height}
						fill={getBoxFill(box, isSelected, isHovered)}
						stroke="transparent"
						style={{ cursor: "pointer" }}
						onMouseEnter={() => setHoveredBox(box.key)}
						onMouseLeave={() => setHoveredBox(null)}
						onClick={() => toggleBox(box.key)}
					/>
					{text && (
						<text
							x={box.x + box.width / 2}
							y={box.y + box.height / 2}
							textAnchor="middle"
							dominantBaseline="middle"
							fill="white"
							fontSize={12}
							pointerEvents="none"
						>
							{text}
						</text>
					)}
				</g>
			);
		});

	return (
		<div className="h-screen w-screen bg-background overflow-hidden">
			<PriceGraph adapter={adapter} maxPoints={100} renderBoxes={renderBoxes} />
			<BottomBar
				tradingPairs={TRADING_PAIRS}
				selectedPair={selectedPair}
				onPairChange={setSelectedPair}
				amount={amount}
				onAmountChange={setAmount}
				walletBalance={100}
			/>
		</div>
	);
}
