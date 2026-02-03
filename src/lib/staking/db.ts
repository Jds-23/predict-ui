export interface Stake {
	id: string;
	boxKey: string;
	amount: number;
	multiplier: number;
	status: "pending" | "won" | "lost";
}

const stakes = new Map<string, Stake>();
let walletBalance = 100;
let idCounter = 0;

export const stakeDb = {
	create(boxKey: string, amount: number, multiplier: number): Stake {
		const stake: Stake = {
			id: String(++idCounter),
			boxKey,
			amount,
			multiplier,
			status: "pending",
		};
		stakes.set(boxKey, stake);
		return stake;
	},

	getByBoxKey(boxKey: string): Stake | undefined {
		return stakes.get(boxKey);
	},

	getAll(): Stake[] {
		return Array.from(stakes.values());
	},

	getPending(): Stake[] {
		return Array.from(stakes.values()).filter((s) => s.status === "pending");
	},

	settle(boxKey: string, won: boolean): Stake | undefined {
		const stake = stakes.get(boxKey);
		if (!stake || stake.status !== "pending") return undefined;
		stake.status = won ? "won" : "lost";
		return stake;
	},

	reset(): void {
		stakes.clear();
		idCounter = 0;
	},
};

export const walletDb = {
	get(): number {
		return walletBalance;
	},

	deduct(amount: number): boolean {
		if (amount > walletBalance) return false;
		walletBalance -= amount;
		return true;
	},

	add(amount: number): void {
		walletBalance += amount;
	},

	reset(amount = 100): void {
		walletBalance = amount;
	},
};
