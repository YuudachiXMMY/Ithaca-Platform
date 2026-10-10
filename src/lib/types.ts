// Shared API envelope used by every API route: { success, data?, error? }.
// Ported from the Next app's src/types/index.ts for Phase 3 route handlers.
export interface ApiResponse<T = unknown> {
	success: boolean;
	data?: T;
	error?: string;
}
