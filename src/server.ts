import handler, { createServerEntry } from "@tanstack/react-start/server-entry"
import type { D1Database } from "./db/client"

interface CloudflareEnv {
	DB?: D1Database
}

declare module "@tanstack/react-start" {
	interface Register {
		server: {
			requestContext: {
				cloudflare?: {
					env: CloudflareEnv
				}
			}
		}
	}
}

export default createServerEntry({
	// biome-ignore lint/suspicious/useAwait: must be async for Cloudflare
	async fetch(request, { cloudflare } = {}) {
		return handler.fetch(request, {
			context: {
				cloudflare,
			},
		})
	},
})
