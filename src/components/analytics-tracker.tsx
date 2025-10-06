import { useRouter } from "@tanstack/react-router";
import { useEffect } from "react";

// This component should be placed in your root layout
export function AnalyticsTracker() {
	const router = useRouter();

	useEffect(() => {
		const handleRouteChange = () => {
			// Check if gtag is available before sending a pageview event
			if (typeof window.gtag === "function") {
				window.gtag("config", process.env.GOOGLE_TAG_MANAGER_ID, {
					page_path: window.location.pathname,
				});
			}
		};

		// Subscribe to router changes and send a pageview event
		const unsubscribe = router.history.subscribe(() => {
			handleRouteChange();
		});

		// Cleanup the subscription on unmount
		return () => unsubscribe();
	}, [router]);

	return null;
}
