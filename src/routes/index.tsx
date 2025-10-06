import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Globe } from "@/components/globe";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getWaitlistCount, joinWaitlist } from "@/server/waitlist.server";

export const Route = createFileRoute("/")({
	head: () => ({
		meta: [
			{ title: "Rupay — Payments & Billing Platform" },
			{
				name: "description",
				content:
					"Accept payments instantly and set up billing flexibly for SaaS, AI and digital products — usage-based, subscriptions and one-time models without managing infrastructure.",
			},
		],
	}),
	component: App,
});

function App() {
	return (
		<main className="min-h-[100svh] grid place-items-center overflow-hidden relative">
			<div className="max-w-2xl mx-auto p-4 flex flex-col items-center justify-center relative z-50 gap-2">
				<div className="flex items-center justify-center text-2xl font-medium mb-2">
					Rupay
				</div>
				<section className="w-full bg-card/5 backdrop-blur-xs rounded-2xl sm:rounded-4xl p-8 shadow-lg border border-border text-center space-y-8">
					<div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-muted-foreground bg-card/60">
						<span className="inline-block size-1.5 rounded-full bg-emerald-500" />
						Coming soon — join the waitlist
					</div>
					<h1 className="text-4xl sm:text-5xl font-semibold tracking-tight bg-gradient-to-b from-primary to-primary/70 bg-clip-text text-transparent">
						Payments & Billing Platform for SaaS, AI and Digital Products
					</h1>
					<p className="mx-auto max-w-lg text-base hidden sm:block sm:text-lg text-muted-foreground">
						Accept payments instantly and setup billing flexibly with
						usage-based, subscription, and one-time models, all without building
						your own infrastructure.
					</p>
					<WaitlistForm />
				</section>
				<p className="text-xs text-muted-foreground">
					You will be notified when access becomes available.
				</p>
			</div>

			<div className="absolute inset-0 flex items-center justify-center">
				<Globe />
			</div>
		</main>
	);
}

function WaitlistForm() {
	const [email, setEmail] = useState("");
	const [count, setCount] = useState<number | null>(null);
	const [status, setStatus] = useState<
		"idle" | "submitting" | "success" | "error"
	>("idle");
	const [message, setMessage] = useState("");

	useEffect(() => {
		(getWaitlistCount as unknown as () => Promise<{ count: number }>)()
			.then((d: { count: number }) => {
				if (typeof d?.count === "number") setCount(d.count);
			})
			.catch(() => {});
	}, []);

	async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			setStatus("error");
			setMessage("Please enter a valid email address.");
			return;
		}
		setStatus("submitting");
		setMessage("");
		try {
			const data = await (
				joinWaitlist as unknown as (input: {
					data: { email: string };
				}) => Promise<{ ok: true; count: number }>
			)({ data: { email } });
			setStatus("success");
			setMessage("You're on the list! 🎉");
			setEmail("");
			if (typeof data?.count === "number") setCount(data.count);
		} catch (e: unknown) {
			setStatus("error");
			const messageFromError =
				e &&
				typeof e === "object" &&
				"message" in e &&
				typeof (e as { message?: string }).message === "string"
					? (e as { message: string }).message
					: "Something went wrong. Please try again.";
			setMessage(messageFromError);
			console.error("Join waitlist failed", e);
		}
	}

	return (
		<div className="space-y-4">
			<form
				onSubmit={onSubmit}
				className="mx-auto w-full max-w-sm grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 text-left"
			>
				<Input
					type="email"
					name="email"
					placeholder="you@company.com"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					required
				/>

				<Button
					type="submit"
					className="sm:self-stretch"
					disabled={status === "submitting"}
				>
					{status === "submitting" ? "Joining…" : "Join Waitlist"}
				</Button>

				{message && status !== "success" && (
					<div
						className={cn(
							"sm:col-span-2 text-sm text-center ",
							status === "error" ? "text-destructive" : "text-muted-foreground",
						)}
						role={status === "error" ? "alert" : undefined}
					>
						{message}
					</div>
				)}
			</form>
			<div className="flex items-center justify-center gap-3 flex-wrap">
				<div className="flex -space-x-2.5">
					<div className="w-8 h-8 rounded-full bg-blue-700 border-2 border-white flex items-center justify-center text-white text-xs font-medium">
						M
					</div>
					<div className="w-8 h-8 rounded-full bg-emerald-700 border-2 border-white flex items-center justify-center text-white text-xs font-medium">
						B
					</div>
					<div className="w-8 h-8 rounded-full bg-purple-700 border-2 border-white flex items-center justify-center text-white text-xs font-medium">
						S
					</div>
				</div>
				<span className="text-slate-600 text-sm">
					{typeof count === "number" ? count : "…"} people already joined.
				</span>
				{status === "success" && message && (
					<span className="text-emerald-600 text-sm -ms-1">{message}</span>
				)}
			</div>
		</div>
	);
}
