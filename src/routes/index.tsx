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
	useBinancePrice,
	useBoxEvents,
} from "../../registry/price-graph";

export const Route = createFileRoute("/")({
	component: App,
});

const PRICE_STEP = 50;

const TRADING_PAIRS = [
	{ value: "btcusdt", label: "BTC/USDT" },
	{ value: "ethusdt", label: "ETH/USDT" },
	{ value: "solusdt", label: "SOL/USDT" },
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

function App() {
	const [selectedPair, setSelectedPair] = useState("btcusdt");
	const [amount, setAmount] = useState("1");

	const adapter = useBinancePrice({ symbol: selectedPair, throttleMs: 250 });
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
				<button
					type="button"
					key={box.key}
					className="absolute pointer-events-auto flex items-center justify-center cursor-pointer border-none"
					style={{
						left: box.x,
						top: box.y,
						width: box.width,
						height: box.height,
						backgroundColor: getBoxFill(box, stake, isHovered),
					}}
					onMouseEnter={() => setHoveredBox(box.key)}
					onMouseLeave={() => setHoveredBox(null)}
					onClick={() => handleBoxClick(box)}
					disabled={box.timeState === "past"}
				>
					{stake && (
						<span className="text-lg font-bold text-white select-none pointer-events-none">
							${stake.amount}
						</span>
					)}
					{box.timeState !== "past" && (
						<span className="absolute bottom-1 left-1 text-sm text-blue-400 select-none pointer-events-none">
							{multiplier.toFixed(1)}x
						</span>
					)}
				</button>
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
