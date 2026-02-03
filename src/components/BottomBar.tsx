import { ChevronUp, RotateCcw, Wallet } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface TradingPair {
	value: string;
	label: string;
}

interface BottomBarProps {
	tradingPairs: TradingPair[];
	selectedPair: string;
	onPairChange: (pair: string) => void;
	amount: string;
	onAmountChange: (amount: string) => void;
	walletBalance: number;
	onReset?: () => void;
}

export function BottomBar({
	tradingPairs,
	selectedPair,
	onPairChange,
	amount,
	onAmountChange,
	walletBalance,
	onReset,
}: BottomBarProps) {
	const [dropdownOpen, setDropdownOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	const selectedLabel =
		tradingPairs.find((p) => p.value === selectedPair)?.label ?? selectedPair;

	// close dropdown on outside click
	useEffect(() => {
		const handleClick = (e: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(e.target as Node)
			) {
				setDropdownOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClick);
		return () => document.removeEventListener("mousedown", handleClick);
	}, []);

	const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const val = e.target.value;
		if (val === "" || /^\d*\.?\d*$/.test(val)) {
			const numVal = Number.parseFloat(val);
			if (val === "" || Number.isNaN(numVal)) {
				onAmountChange(val);
			} else if (numVal > walletBalance) {
				onAmountChange(String(walletBalance));
			} else {
				onAmountChange(val);
			}
		}
	};

	return (
		<div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 shadow-lg">
			{/* Pair Dropdown */}
			<div className="relative" ref={dropdownRef}>
				<button
					type="button"
					onClick={() => setDropdownOpen(!dropdownOpen)}
					className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
				>
					<span>{selectedLabel}</span>
					<ChevronUp
						size={16}
						className={`transition-transform ${dropdownOpen ? "" : "rotate-180"}`}
					/>
				</button>
				{dropdownOpen && (
					<div className="absolute bottom-full mb-1 left-0 bg-gray-700 border border-gray-600 rounded shadow-lg min-w-full">
						{tradingPairs.map((pair) => (
							<button
								key={pair.value}
								type="button"
								onClick={() => {
									onPairChange(pair.value);
									setDropdownOpen(false);
								}}
								className={`block w-full text-left px-3 py-2 hover:bg-gray-600 transition-colors ${
									pair.value === selectedPair ? "bg-gray-600" : ""
								}`}
							>
								{pair.label}
							</button>
						))}
					</div>
				)}
			</div>

			{/* Amount Input */}
			<input
				type="text"
				value={amount}
				onChange={handleAmountChange}
				placeholder="Amount"
				className="w-24 px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-gray-500"
			/>

			{/* Wallet Display */}
			<div className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 rounded">
				<Wallet size={16} />
				<span>${walletBalance.toFixed(2)}</span>
			</div>

			{/* Reset Button */}
			{onReset && (
				<button
					type="button"
					onClick={onReset}
					className="flex items-center gap-1 px-2 py-1.5 bg-gray-700 hover:bg-gray-600 rounded transition-colors text-sm"
					title="Reset wallet & stakes"
				>
					<RotateCcw size={14} />
				</button>
			)}
		</div>
	);
}
