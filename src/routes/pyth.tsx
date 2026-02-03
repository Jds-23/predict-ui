import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BottomBar } from "@/components/BottomBar";
import {
	type Stake,
	useResetMutation,
	useSettleStakeMutation,
	useStakeMutation,
	useStakes,
	useWallet,
} from "@/hooks/use-staking";
import {
	type BoxData,
	PriceGraph,
	useBoxEvents,
	usePythPrice,
} from "../../registry/price-graph";

export const Route = createFileRoute("/pyth")({
	component: PythPage,
});

const PRICE_STEP = 50;

const TRADING_PAIRS = [
	{ value: "Crypto.BTC/USD", label: "BTC/USD" },
	{ value: "Crypto.ETH/USD", label: "ETH/USD" },
	{ value: "Crypto.SOL/USD", label: "SOL/USD" },
];

const calcMultiplier = (priceIndex: number, currentPriceIndex: number) => {
	const distance = Math.abs(priceIndex - currentPriceIndex);
	return 1.5 + distance * 0.5;
};

const getBoxFill = (
	box: BoxData,
	stake: Stake | undefined,
	isHovered: boolean,
) => {
	if (stake) {
		if (stake.status === "won") return "rgba(34, 197, 94, 0.4)";
		if (stake.status === "lost") return "rgba(239, 68, 68, 0.3)";
		return "rgba(59, 130, 246, 0.4)"; // pending
	}
	if (isHovered && box.timeState !== "past") return "rgba(59, 130, 246, 0.15)";
	if (box.timeState === "past") return "rgba(128, 128, 128, 0.2)";
	return "transparent";
};

function PythPage() {
	const [selectedPair, setSelectedPair] = useState("Crypto.BTC/USD");
	const [amount, setAmount] = useState("1");

	const adapter = usePythPrice({ symbol: selectedPair, throttleMs: 250 });
	const [hoveredBox, setHoveredBox] = useState<string | null>(null);

	const wallet = useWallet();
	const { data: stakes = [] } = useStakes();
	const stakesMap = new Map(stakes.map((s) => [s.boxKey, s]));

	const stakeMutation = useStakeMutation();
	const settleMutation = useSettleStakeMutation();
	const resetMutation = useResetMutation();

	const { processBoxes } = useBoxEvents({
		priceStep: PRICE_STEP,
		onBoxActivated: (box) => {
			settleMutation.mutate({ boxKey: box.key, won: true });
		},
		onBoxExpired: (box) => {
			settleMutation.mutate({ boxKey: box.key, won: false });
		},
	});

	const currentPrice = adapter.priceData?.price ?? 0;
	const currentPriceIndex = currentPrice
		? Math.floor(currentPrice / PRICE_STEP)
		: 0;

	const handleBoxClick = (box: BoxData) => {
		if (box.timeState === "past") return;
		if (stakesMap.has(box.key)) return;

		const stakeAmount = Number.parseFloat(amount) || 1;
		if (stakeAmount <= 0) return;

		const [priceIndexStr] = box.key.split(":");
		const priceIndex = Number.parseInt(priceIndexStr, 10);

		stakeMutation.mutate({
			boxKey: box.key,
			amount: stakeAmount,
			currentPriceIndex:
				priceIndex === currentPriceIndex ? 0 : currentPriceIndex,
		});
	};

	const renderBoxes = (boxes: BoxData[]) => {
		processBoxes(boxes, currentPrice);

		return boxes.map((box) => {
			const stake = stakesMap.get(box.key);
			const isHovered = hoveredBox === box.key;
			const [priceIndexStr] = box.key.split(":");
			const priceIndex = Number.parseInt(priceIndexStr, 10);
			const multiplier = stake?.multiplier ?? calcMultiplier(priceIndex, currentPriceIndex);

			return (
				// biome-ignore lint/a11y/useSemanticElements: SVG elements need click handlers
				<g key={box.key} role="button" tabIndex={0}>
					{/* biome-ignore lint/a11y/noStaticElementInteractions: SVG rect needs click handler */}
					<rect
						x={box.x}
						y={box.y}
						width={box.width}
						height={box.height}
						fill={getBoxFill(box, stake, isHovered)}
						stroke="transparent"
						style={{ cursor: box.timeState === "past" ? "default" : "pointer" }}
						onMouseEnter={() => setHoveredBox(box.key)}
						onMouseLeave={() => setHoveredBox(null)}
						onClick={() => handleBoxClick(box)}
					/>
					{stake && (
						<text
							x={box.x + box.width / 2}
							y={box.y + box.height / 2}
							textAnchor="middle"
							dominantBaseline="middle"
							fill="white"
							fontSize={16}
							fontWeight="bold"
							pointerEvents="none"
						>
							${stake.amount}
						</text>
					)}
					{box.timeState !== "past" && (
						<text
							x={box.x + 4}
							y={box.y + box.height - 4}
							fill="rgba(255,255,255,0.5)"
							fontSize={10}
							pointerEvents="none"
						>
							{multiplier.toFixed(1)}x
						</text>
					)}
				</g>
			);
		});
	};

	return (
		<div className="h-screen w-screen bg-background overflow-hidden">
			<PriceGraph adapter={adapter} maxPoints={100} renderBoxes={renderBoxes} />
			<BottomBar
				tradingPairs={TRADING_PAIRS}
				selectedPair={selectedPair}
				onPairChange={setSelectedPair}
				amount={amount}
				onAmountChange={setAmount}
				walletBalance={wallet.data ?? 100}
				onReset={() => resetMutation.mutate()}
			/>
		</div>
	);
}
