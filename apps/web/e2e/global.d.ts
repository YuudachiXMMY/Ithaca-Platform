// `gtag` is injected at run time by the GA snippet that hooks.server.ts writes into the
// document (only when PUBLIC_GA_TRACKING_ID is set). analytics.spec.ts asserts on its presence,
// so the spec needs the global to exist in the type system — optional, because the whole point
// of that assertion is that it may be absent.
//
// This surfaced the moment e2e/ got a tsconfig: it was the single real type error in the suite.
declare global {
	interface Window {
		gtag?: (...args: unknown[]) => void;
	}
}

export {};
