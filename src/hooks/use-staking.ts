import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type Stake, stakeDb, walletDb } from "@/lib/staking/db";

export function useWallet() {
	return useQuery({
		queryKey: ["wallet"],
		queryFn: () => walletDb.get(),
		staleTime: 0,
	});
}

export function useStakes() {
	return useQuery({
		queryKey: ["stakes"],
		queryFn: () => stakeDb.getAll(),
		staleTime: 0,
	});
}

export function useStakesByBoxKey() {
	const { data: stakes = [] } = useStakes();
	return new Map(stakes.map((s) => [s.boxKey, s]));
}

const calcMultiplier = (priceIndex: number, currentPriceIndex: number) => {
	const distance = Math.abs(priceIndex - currentPriceIndex);
	return 1.5 + distance * 0.5;
};

interface StakeParams {
	boxKey: string;
	amount: number;
	currentPriceIndex: number;
}

export function useStakeMutation() {
	const qc = useQueryClient();

	return useMutation({
		mutationFn: ({ boxKey, amount, currentPriceIndex }: StakeParams) => {
			const [priceIndexStr] = boxKey.split(":");
			const priceIndex = Number.parseInt(priceIndexStr, 10);
			const multiplier = calcMultiplier(priceIndex, currentPriceIndex);

			if (!walletDb.deduct(amount)) {
				throw new Error("Insufficient balance");
			}

			const stake = stakeDb.create(boxKey, amount, multiplier);
			return Promise.resolve(stake);
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["wallet"] });
			qc.invalidateQueries({ queryKey: ["stakes"] });
		},
	});
}

interface SettleParams {
	boxKey: string;
	won: boolean;
}

export function useSettleStakeMutation() {
	const qc = useQueryClient();

	return useMutation({
		mutationFn: ({ boxKey, won }: SettleParams) => {
			const stake = stakeDb.settle(boxKey, won);
			return Promise.resolve(stake);
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["stakes"] });
		},
	});
}

export function useFinishSettleMutation() {
	const qc = useQueryClient();

	return useMutation({
		mutationFn: (boxKey: string) => {
			const stake = stakeDb.finishSettle(boxKey);
			if (stake && stake.status === "won") {
				walletDb.add(stake.amount * stake.multiplier);
			}
			return Promise.resolve(stake);
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["wallet"] });
			qc.invalidateQueries({ queryKey: ["stakes"] });
		},
	});
}

export function useResetMutation() {
	const qc = useQueryClient();

	return useMutation({
		mutationFn: () => {
			stakeDb.reset();
			walletDb.reset();
			return Promise.resolve();
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["wallet"] });
			qc.invalidateQueries({ queryKey: ["stakes"] });
		},
	});
}

export type { Stake };
