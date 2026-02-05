export interface D1Database {
	prepare(query: string): D1PreparedStatement
	batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>
	exec(query: string): Promise<D1ExecResult>
}

interface D1PreparedStatement {
	bind(...values: unknown[]): D1PreparedStatement
	first<T = unknown>(colName?: string): Promise<T | null>
	run(): Promise<D1Result<unknown>>
	all<T = unknown>(): Promise<D1Result<T>>
	raw<T = unknown>(): Promise<T[]>
}

interface D1Result<T = unknown> {
	results?: T[]
	success: boolean
	error?: string
	meta?: object
}

interface D1ExecResult {
	count: number
	duration: number
}

// D1 database reference - set via middleware
let d1Instance: D1Database | null = null

export function setD1(db: D1Database | null): void {
	d1Instance = db
}

export function getD1(): D1Database | null {
	return d1Instance
}

export function hasD1(): boolean {
	return d1Instance !== null
}
