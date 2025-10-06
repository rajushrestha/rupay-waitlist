import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

async function d1Query(sql: string, params?: unknown[]) {
	const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
	const databaseId = process.env.CLOUDFLARE_DATABASE_ID;
	const apiToken = process.env.CLOUDFLARE_DATABASE_API_TOKEN;

	if (!accountId || !databaseId || !apiToken) {
		throw new Error("Cloudflare credentials not configured");
	}

	const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;
	const res = await fetch(url, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${apiToken}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ sql, params }),
	});
	const data: {
		success?: boolean;
		result?: Array<{ results?: Array<Record<string, unknown>> }>;
		errors?: Array<{ message?: string }>;
	} = await res.json();
	if (!res.ok || data?.success !== true) {
		throw new Error(data?.errors?.[0]?.message || "D1 query failed");
	}
	return data;
}

export const getWaitlistCount = createServerFn({ method: "GET" }).handler(
	async () => {
		const countRes = await d1Query("SELECT COUNT(*) AS c FROM waitlist;");
		const count = Number(countRes.result?.[0]?.results?.[0]?.c ?? 0);
		return { count };
	},
);

export const joinWaitlist = createServerFn({ method: "POST" })
	.inputValidator(z.object({ email: z.email() }))
	.handler(async (ctx) => {
		const { data } = ctx as unknown as { data: { email: string } }; // align with validator
		const request = (ctx as unknown as { request?: Request }).request;
		const email = (data?.email || "").trim().toLowerCase();

		// Extract client info from headers
		const headers =
			request && "headers" in request
				? (request as Request).headers
				: new Headers();
		const userAgent = (headers.get("user-agent") || "").slice(0, 512);
		const ipHeader =
			headers.get("cf-connecting-ip") ||
			headers.get("x-forwarded-for") ||
			headers.get("x-real-ip") ||
			"";
		const ip = ipHeader.split(",")[0].trim();
		const country =
			headers.get("cf-ipcountry") || headers.get("x-country-code") || null;

		// Insert with additional metadata (ignore duplicates by email)
		await d1Query(
			"INSERT OR IGNORE INTO waitlist (email, ip, user_agent, country) VALUES (?, ?, ?, ?);",
			[email, ip || null, userAgent || null, country],
		);

		const countRes = await d1Query("SELECT COUNT(*) AS c FROM waitlist;");
		const count = Number(countRes.result?.[0]?.results?.[0]?.c ?? 0);
		return { ok: true as const, count };
	});
