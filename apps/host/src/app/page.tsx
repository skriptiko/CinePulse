"use client";

import dynamic from "next/dynamic";
import ErrorBoundary from "@/components/ErrorBoundary";

// @ts-expect-error
const RemoteHello = dynamic(() => import("remote/Hello"), {
	ssr: false,
	loading: () => <p>Loading Remote Component...</p>,
});

export default function Home() {
	return (
		<main className="flex min-h-screen flex-col items-center justify-center p-24 space-y-8">
			<h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
				CinePulse Host
			</h1>

			<div className="w-full max-w-md">
				<ErrorBoundary
					fallback={
						<p className="text-red-500">Failed to load remote component</p>
					}
				>
					<RemoteHello />
				</ErrorBoundary>
			</div>
		</main>
	);
}
