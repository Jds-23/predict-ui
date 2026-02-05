import { createMiddleware, createServerFn } from "@tanstack/react-start"
import { z } from "zod"
import { type D1Database, getD1, setD1 } from "../db/client"

export interface Stake {
	id: number
	boxKey: string
	amount: number
	multiplier: number
	status: "pending" | "settling-won" | "settling-lost" | "won" | "lost"
}

export interface WalletState {
	balance: number
	stakes: Stake[]
}

// Middleware to initialize D1 from Cloudflare context
const d1Middleware = createMiddleware({ type: "function" }).server(
	async ({ next, context }) => {
		const cloudflareContext = context as {
			cloudflare?: { env?: { DB?: D1Database } }
		}
		const db = cloudflareContext?.cloudflare?.env?.DB ?? null
		setD1(db)
		return next()
	},
)

// Get wallet balance and all stakes
export const getWalletState = createServerFn()
	.middleware([d1Middleware])
	.handler(async (): Promise<WalletState | null> => {
		const db = getD1()
		if (!db) {
			// D1 not available (local dev) - return null to use client-side state
			return null
		}

		const [walletResult, stakesResult] = await Promise.all([
			db.prepare("SELECT balance FROM wallet WHERE id = 1").first<{ balance: number }>(),
			db.prepare("SELECT id, box_key, amount, multiplier, status FROM stakes").all<{
				id: number
				box_key: string
				amount: number
				multiplier: number
				status: string
			}>(),
		])

		const balance = walletResult?.balance ?? 100
		const stakes = (stakesResult.results ?? []).map((row) => ({
			id: row.id,
			boxKey: row.box_key,
			amount: row.amount,
			multiplier: row.multiplier,
			status: row.status as Stake["status"],
		}))

		return { balance, stakes }
	})

// Create a new stake
export const createStake = createServerFn({ method: "POST" })
	.middleware([d1Middleware])
	.inputValidator(
		z.object({
			boxKey: z.string(),
			amount: z.number().positive(),
			multiplier: z.number().positive(),
		}),
	)
	.handler(async ({ data }): Promise<Stake | null> => {
		const db = getD1()
		if (!db) {
			// D1 not available - return null to use client-side mutation
			return null
		}

		const { boxKey, amount, multiplier } = data

		// Check balance and create stake in a transaction
		const wallet = await db
			.prepare("SELECT balance FROM wallet WHERE id = 1")
			.first<{ balance: number }>()

		if (!wallet || wallet.balance < amount) {
			throw new Error("Insufficient balance")
		}

		// Update balance and insert stake
		await db.batch([
			db.prepare("UPDATE wallet SET balance = balance - ? WHERE id = 1").bind(amount),
			db
				.prepare(
					"INSERT INTO stakes (box_key, amount, multiplier, status) VALUES (?, ?, ?, 'pending')",
				)
				.bind(boxKey, amount, multiplier),
		])

		// Get the created stake
		const stake = await db
			.prepare("SELECT id, box_key, amount, multiplier, status FROM stakes WHERE box_key = ?")
			.bind(boxKey)
			.first<{
				id: number
				box_key: string
				amount: number
				multiplier: number
				status: string
			}>()

		if (!stake) {
			throw new Error("Failed to create stake")
		}

		return {
			id: stake.id,
			boxKey: stake.box_key,
			amount: stake.amount,
			multiplier: stake.multiplier,
			status: stake.status as Stake["status"],
		}
	})

// Settle a stake (start settling animation)
export const settleStake = createServerFn({ method: "POST" })
	.middleware([d1Middleware])
	.inputValidator(
		z.object({
			boxKey: z.string(),
			won: z.boolean(),
		}),
	)
	.handler(async ({ data }): Promise<Stake | null> => {
		const db = getD1()
		if (!db) {
			return null
		}

		const { boxKey, won } = data
		const newStatus = won ? "settling-won" : "settling-lost"

		await db
			.prepare("UPDATE stakes SET status = ? WHERE box_key = ? AND status = 'pending'")
			.bind(newStatus, boxKey)
			.run()

		const stake = await db
			.prepare("SELECT id, box_key, amount, multiplier, status FROM stakes WHERE box_key = ?")
			.bind(boxKey)
			.first<{
				id: number
				box_key: string
				amount: number
				multiplier: number
				status: string
			}>()

		if (!stake) return null

		return {
			id: stake.id,
			boxKey: stake.box_key,
			amount: stake.amount,
			multiplier: stake.multiplier,
			status: stake.status as Stake["status"],
		}
	})

// Finish settling (apply winnings and update final status)
export const finishSettle = createServerFn({ method: "POST" })
	.middleware([d1Middleware])
	.inputValidator(z.object({ boxKey: z.string() }))
	.handler(async ({ data }): Promise<Stake | null> => {
		const db = getD1()
		if (!db) {
			return null
		}

		const { boxKey } = data

		const stake = await db
			.prepare("SELECT id, box_key, amount, multiplier, status FROM stakes WHERE box_key = ?")
			.bind(boxKey)
			.first<{
				id: number
				box_key: string
				amount: number
				multiplier: number
				status: string
			}>()

		if (!stake) return null

		if (stake.status === "settling-won") {
			const winnings = stake.amount * stake.multiplier
			await db.batch([
				db.prepare("UPDATE wallet SET balance = balance + ? WHERE id = 1").bind(winnings),
				db.prepare("UPDATE stakes SET status = 'won' WHERE box_key = ?").bind(boxKey),
			])
		} else if (stake.status === "settling-lost") {
			await db.prepare("UPDATE stakes SET status = 'lost' WHERE box_key = ?").bind(boxKey).run()
		} else {
			return null
		}

		const updated = await db
			.prepare("SELECT id, box_key, amount, multiplier, status FROM stakes WHERE box_key = ?")
			.bind(boxKey)
			.first<{
				id: number
				box_key: string
				amount: number
				multiplier: number
				status: string
			}>()

		if (!updated) return null

		return {
			id: updated.id,
			boxKey: updated.box_key,
			amount: updated.amount,
			multiplier: updated.multiplier,
			status: updated.status as Stake["status"],
		}
	})

// Reset wallet and clear all stakes
export const resetWallet = createServerFn({ method: "POST" })
	.middleware([d1Middleware])
	.handler(async (): Promise<boolean> => {
		const db = getD1()
		if (!db) {
			return false
		}

		await db.batch([
			db.prepare("DELETE FROM stakes"),
			db.prepare("UPDATE wallet SET balance = 100 WHERE id = 1"),
		])

		return true
	})
