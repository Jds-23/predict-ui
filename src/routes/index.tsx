import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
	type BoxData,
	PriceGraph,
	useBinancePrice,
} from "../../registry/price-graph";

export const Route = createFileRoute("/")({
	component: App,
});

const getBoxFill = (box: BoxData, isSelected: boolean, isHovered: boolean) => {
	if (isSelected) return "rgba(59, 130, 246, 0.3)";
	if (isHovered) return "rgba(59, 130, 246, 0.15)";
	if (box.timeState === "past") return "rgba(128, 128, 128, 0.2)";
	return "transparent";
};

function App() {
	const adapter = useBinancePrice({ symbol: "btcusdt", throttleMs: 250 });
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

			return (
				<rect
					key={box.key}
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
			);
		});

	return (
		<div className="h-screen w-screen bg-background overflow-hidden">
			<PriceGraph adapter={adapter} maxPoints={100} renderBoxes={renderBoxes} />
		</div>
	);
}
