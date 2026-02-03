import { motion } from "framer-motion";
import type { Stake } from "@/hooks/use-staking";
import type { BoxData } from "../../registry/price-graph";

interface StakeBoxProps {
	box: BoxData;
	stake: Stake;
	onAnimationComplete: () => void;
}

export function StakeBox({ box, stake, onAnimationComplete }: StakeBoxProps) {
	const isSettling =
		stake.status === "settling-won" || stake.status === "settling-lost";
	const isWon = stake.status === "settling-won" || stake.status === "won";
	const isLost = stake.status === "settling-lost" || stake.status === "lost";

	const displayAmount = isWon
		? `+$${(stake.amount * stake.multiplier).toFixed(0)}`
		: `-$${stake.amount}`;

	const bgColor = isWon
		? "rgba(34, 197, 94, 0.4)"
		: isLost
			? "rgba(239, 68, 68, 0.3)"
			: "rgba(59, 130, 246, 0.4)";

	return (
		<motion.div
			className="absolute flex items-center justify-center"
			style={{
				left: box.x,
				top: box.y,
				width: box.width,
				height: box.height,
				backgroundColor: bgColor,
			}}
			initial={false}
			animate={
				isSettling
					? {
							backgroundColor: [
								bgColor,
								isWon ? "rgba(34, 197, 94, 0.8)" : "rgba(239, 68, 68, 0.8)",
								bgColor,
								isWon ? "rgba(34, 197, 94, 0.8)" : "rgba(239, 68, 68, 0.8)",
								bgColor,
								isWon ? "rgba(34, 197, 94, 0.8)" : "rgba(239, 68, 68, 0.8)",
								bgColor,
							],
							y: [0, isWon ? -100 : 100],
							opacity: [1, 1, 1, 1, 1, 1, 0],
						}
					: {}
			}
			transition={
				isSettling
					? {
							backgroundColor: { duration: 0.6, times: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6] },
							y: { duration: 0.8, delay: 0.6, ease: "easeOut" },
							opacity: { duration: 0.8, delay: 0.6 },
						}
					: {}
			}
			onAnimationComplete={() => {
				if (isSettling) {
					onAnimationComplete();
				}
			}}
		>
			<span
				className={`font-bold text-white select-none pointer-events-none ${isSettling ? "text-2xl" : "text-lg"}`}
			>
				{isSettling ? displayAmount : `$${stake.amount}`}
			</span>
		</motion.div>
	);
}
