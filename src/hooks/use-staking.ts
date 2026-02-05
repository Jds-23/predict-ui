import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface Stake {
	id: string;
	boxKey: string;
	amount: number;
	multiplier: number;
	status: "pending" | "settling-won" | "settling-lost" | "won" | "lost";
}

interface StakingState {
	wallet: number;
	stakes: Map<string, Stake>;
	idCounter: number;
}

const STAKING_KEY = ["staking"];
const INITIAL_STATE: StakingState = {
	wallet: 100,
	stakes: new Map(),
	idCounter: 0,
};

function useStakingState() {
	return useQuery({
		queryKey: STAKING_KEY,
		queryFn: () => INITIAL_STATE,
		staleTime: Infinity,
		initialData: INITIAL_STATE,
	});
}

export function useWallet() {
	const { data: state } = useStakingState();
	return { data: state.wallet };
}

export function useStakes() {
	const { data: state } = useStakingState();
	return { data: Array.from(state.stakes.values()) };
}

export function useStakesByBoxKey() {
	const { data: state } = useStakingState();
	return state.stakes;
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
			const state = qc.getQueryData<StakingState>(STAKING_KEY) ?? INITIAL_STATE;

			if (amount > state.wallet) {
				throw new Error("Insufficient balance");
			}

			const [priceIndexStr] = boxKey.split(":");
			const priceIndex = Number.parseInt(priceIndexStr, 10);
			const multiplier = calcMultiplier(priceIndex, currentPriceIndex);

			const newId = state.idCounter + 1;
			const stake: Stake = {
				id: String(newId),
				boxKey,
				amount,
				multiplier,
				status: "pending",
			};

			const newStakes = new Map(state.stakes);
			newStakes.set(boxKey, stake);

			qc.setQueryData<StakingState>(STAKING_KEY, {
				wallet: state.wallet - amount,
				stakes: newStakes,
				idCounter: newId,
			});

			return Promise.resolve(stake);
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
			const state = qc.getQueryData<StakingState>(STAKING_KEY) ?? INITIAL_STATE;
			const stake = state.stakes.get(boxKey);

			if (!stake || stake.status !== "pending") {
				return Promise.resolve(undefined);
			}

			const updatedStake: Stake = {
				...stake,
				status: won ? "settling-won" : "settling-lost",
			};

			const newStakes = new Map(state.stakes);
			newStakes.set(boxKey, updatedStake);

			qc.setQueryData<StakingState>(STAKING_KEY, {
				...state,
				stakes: newStakes,
			});

			return Promise.resolve(updatedStake);
		},
	});
}

export function useFinishSettleMutation() {
	const qc = useQueryClient();

	return useMutation({
		mutationFn: (boxKey: string) => {
			const state = qc.getQueryData<StakingState>(STAKING_KEY) ?? INITIAL_STATE;
			const stake = state.stakes.get(boxKey);

			if (!stake) {
				return Promise.resolve(undefined);
			}

			let updatedStake: Stake | undefined;
			let walletDelta = 0;

			if (stake.status === "settling-won") {
				updatedStake = { ...stake, status: "won" };
				walletDelta = stake.amount * stake.multiplier;
			} else if (stake.status === "settling-lost") {
				updatedStake = { ...stake, status: "lost" };
			}

			if (!updatedStake) {
				return Promise.resolve(undefined);
			}

			const newStakes = new Map(state.stakes);
			newStakes.set(boxKey, updatedStake);

			qc.setQueryData<StakingState>(STAKING_KEY, {
				...state,
				wallet: state.wallet + walletDelta,
				stakes: newStakes,
			});

			return Promise.resolve(updatedStake);
		},
	});
}

export function useResetMutation() {
	const qc = useQueryClient();

	return useMutation({
		mutationFn: () => {
			qc.setQueryData<StakingState>(STAKING_KEY, INITIAL_STATE);
			return Promise.resolve();
		},
	});
}
