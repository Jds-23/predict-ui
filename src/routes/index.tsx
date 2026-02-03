import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
	type BoxData,
	PriceGraph,
	useBinancePrice,
	useBoxEvents,
} from "../../registry/price-graph";

export const Route = createFileRoute("/")({
	component: App,
});

const PRICE_STEP = 200;

const getBoxFill = (
	box: BoxData,
	isSelected: boolean,
	isHovered: boolean,
	isActivated: boolean,
) => {
	if (isSelected) {
		if (isActivated) return "rgba(34, 197, 94, 0.25)"; // green for activated
		if (box.timeState === "past") return "rgba(255, 0, 0, 0.2)"; // red for selected past
		return "rgba(59, 130, 246, 0.3)";
	}
	if (isHovered) return "rgba(59, 130, 246, 0.15)";
	if (box.timeState === "past") return "rgba(128, 128, 128, 0.2)";
	return "transparent";
};

const getBoxText = (_box: BoxData, isSelected: boolean, isHovered: boolean) => {
	if (isSelected) return "✓";
	if (isHovered) return "?";
	return null;
};

function App() {
	const adapter = useBinancePrice({ symbol: "btcusdt", throttleMs: 250 });
	const [selectedBoxes, setSelectedBoxes] = useState<Set<string>>(new Set());
	const [hoveredBox, setHoveredBox] = useState<string | null>(null);

	const { processBoxes, activatedBoxes } = useBoxEvents({
		priceStep: PRICE_STEP,
		onBoxActivated: (box) => console.log("activated:", box.key),
		onBoxExpired: (box) => console.log("expired:", box.key),
	});

	const toggleBox = (key: string) => {
		setSelectedBoxes((prev) => {
			const next = new Set(prev);
			next.has(key) ? next.delete(key) : next.add(key);
			return next;
		});
		console.log("Clicked box:", key);
	};

	const renderBoxes = (boxes: BoxData[]) => {
		processBoxes(boxes, adapter.priceData?.price ?? 0);

		return boxes.map((box) => {
			const isSelected = selectedBoxes.has(box.key);
			const isHovered = hoveredBox === box.key;
			const isActivated = activatedBoxes.has(box.key);
			const text = getBoxText(box, isSelected, isHovered);

			return (
				<button
					type="button"
					key={box.key}
					className="absolute pointer-events-auto flex items-center justify-center cursor-pointer border-none"
					style={{
						left: box.x,
						top: box.y,
						width: box.width,
						height: box.height,
						backgroundColor: getBoxFill(box, isSelected, isHovered, isActivated),
					}}
					onMouseEnter={() => setHoveredBox(box.key)}
					onMouseLeave={() => setHoveredBox(null)}
					onClick={() => toggleBox(box.key)}
				>
					{text && (
						<span className="text-white text-sm select-none pointer-events-none">
							{text}
						</span>
					)}
				</button>
			);
		});
	};

	return (
		<div className="h-screen w-screen bg-background overflow-hidden">
			<PriceGraph adapter={adapter} maxPoints={100} renderBoxes={renderBoxes} />
		</div>
	);
}
