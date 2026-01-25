"use client";

import React, { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
	children?: ReactNode;
	fallback?: ReactNode;
}

interface State {
	hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
	public state: State = {
		hasError: false,
	};

	public static getDerivedStateFromError(_: Error): State {
		return { hasError: true };
	}

	public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		console.error("Uncaught error:", error, errorInfo);
	}

	public render() {
		if (this.state.hasError) {
			return (
				this.props.fallback || (
					<div className="p-4 border-2 border-red-500 rounded-lg">
						<h2 className="text-xl font-bold text-red-600">
							Something went wrong.
						</h2>
					</div>
				)
			);
		}

		return this.props.children;
	}
}

export default ErrorBoundary;
