import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
	type Stake as ServerStake,
	type WalletState,
	createStake,
	finishSettle,
	getWalletState,
	resetWallet,
	settleStake,
} from "../server/staking"

// Re-export Stake type but with string id for client compatibility
export interface Stake {
	id: string
	boxKey: string
	amount: number
	multiplier: number
	status: "pending" | "settling-won" | "settling-lost" | "won" | "lost"
}

interface StakingState {
	wallet: number
	stakes: Map<string, Stake>
	idCounter: number
}

const STAKING_KEY = ["staking"]

const INITIAL_STATE: StakingState = {
	wallet: 100,
	stakes: new Map(),
	idCounter: 0,
}

// Convert server stake to client stake
function toClientStake(s: ServerStake): Stake {
	return {
		id: String(s.id),
		boxKey: s.boxKey,
		amount: s.amount,
		multiplier: s.multiplier,
		status: s.status,
	}
}

// Convert server wallet state to client staking state
function toStakingState(serverState: WalletState | null): StakingState {
	if (!serverState) {
		return INITIAL_STATE
	}

	const stakes = new Map<string, Stake>()
	let maxId = 0
	for (const s of serverState.stakes) {
		stakes.set(s.boxKey, toClientStake(s))
		maxId = Math.max(maxId, s.id)
	}

	return {
		wallet: serverState.balance,
		stakes,
		idCounter: maxId,
	}
}

function useStakingState() {
	return useQuery({
		queryKey: STAKING_KEY,
		queryFn: async () => {
			const serverState = await getWalletState()
			return toStakingState(serverState)
		},
		staleTime: 30000,
		initialData: INITIAL_STATE,
	})
}

export function useWallet() {
	const { data: state } = useStakingState()
	return { data: state.wallet }
}

export function useStakes() {
	const { data: state } = useStakingState()
	return { data: Array.from(state.stakes.values()) }
}

export function useStakesByBoxKey() {
	const { data: state } = useStakingState()
	return state.stakes
}

const calcMultiplier = (priceIndex: number, currentPriceIndex: number) => {
	const distance = Math.abs(priceIndex - currentPriceIndex)
	return 1.5 + distance * 0.5
}

interface StakeParams {
	boxKey: string
	amount: number
	currentPriceIndex: number
}

export function useStakeMutation() {
	const qc = useQueryClient()

	return useMutation({
		mutationFn: async ({ boxKey, amount, currentPriceIndex }: StakeParams) => {
			const [priceIndexStr] = boxKey.split(":")
			const priceIndex = Number.parseInt(priceIndexStr, 10)
			const multiplier = calcMultiplier(priceIndex, currentPriceIndex)

			// Try server function first
			const serverResult = await createStake({ data: { boxKey, amount, multiplier } })

			if (serverResult) {
				return toClientStake(serverResult)
			}

			// Fallback to client-side mutation (local dev without D1)
			const state = qc.getQueryData<StakingState>(STAKING_KEY) ?? INITIAL_STATE

			if (amount > state.wallet) {
				throw new Error("Insufficient balance")
			}

			const newId = state.idCounter + 1
			const stake: Stake = {
				id: String(newId),
				boxKey,
				amount,
				multiplier,
				status: "pending",
			}

			const newStakes = new Map(state.stakes)
			newStakes.set(boxKey, stake)

			qc.setQueryData<StakingState>(STAKING_KEY, {
				wallet: state.wallet - amount,
				stakes: newStakes,
				idCounter: newId,
			})

			return stake
		},
	})
}

interface SettleParams {
	boxKey: string
	won: boolean
}

export function useSettleStakeMutation() {
	const qc = useQueryClient()

	return useMutation({
		mutationFn: async ({ boxKey, won }: SettleParams) => {
			// Try server function first
			const serverResult = await settleStake({ data: { boxKey, won } })

			if (serverResult) {
				qc.invalidateQueries({ queryKey: STAKING_KEY })
				return toClientStake(serverResult)
			}

			// Fallback to client-side mutation
			const state = qc.getQueryData<StakingState>(STAKING_KEY) ?? INITIAL_STATE
			const stake = state.stakes.get(boxKey)

			if (!stake || stake.status !== "pending") {
				return undefined
			}

			const updatedStake: Stake = {
				...stake,
				status: won ? "settling-won" : "settling-lost",
			}

			const newStakes = new Map(state.stakes)
			newStakes.set(boxKey, updatedStake)

			qc.setQueryData<StakingState>(STAKING_KEY, {
				...state,
				stakes: newStakes,
			})

			return updatedStake
		},
	})
}

export function useFinishSettleMutation() {
	const qc = useQueryClient()

	return useMutation({
		mutationFn: async (boxKey: string) => {
			// Try server function first
			const serverResult = await finishSettle({ data: { boxKey } })

			if (serverResult) {
				qc.invalidateQueries({ queryKey: STAKING_KEY })
				return toClientStake(serverResult)
			}

			// Fallback to client-side mutation
			const state = qc.getQueryData<StakingState>(STAKING_KEY) ?? INITIAL_STATE
			const stake = state.stakes.get(boxKey)

			if (!stake) {
				return undefined
			}

			let updatedStake: Stake | undefined
			let walletDelta = 0

			if (stake.status === "settling-won") {
				updatedStake = { ...stake, status: "won" }
				walletDelta = stake.amount * stake.multiplier
			} else if (stake.status === "settling-lost") {
				updatedStake = { ...stake, status: "lost" }
			}

			if (!updatedStake) {
				return undefined
			}

			const newStakes = new Map(state.stakes)
			newStakes.set(boxKey, updatedStake)

			qc.setQueryData<StakingState>(STAKING_KEY, {
				...state,
				wallet: state.wallet + walletDelta,
				stakes: newStakes,
			})

			return updatedStake
		},
	})
}

export function useResetMutation() {
	const qc = useQueryClient()

	return useMutation({
		mutationFn: async () => {
			// Try server function first
			const serverResult = await resetWallet()

			if (serverResult) {
				qc.invalidateQueries({ queryKey: STAKING_KEY })
				return
			}

			// Fallback to client-side mutation
			qc.setQueryData<StakingState>(STAKING_KEY, INITIAL_STATE)
		},
	})
}
