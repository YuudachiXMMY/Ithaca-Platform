// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		//   Deliberately empty: this app is stateless. `Locals` used to carry the Better Auth
		//   session/user, and nothing else ever read it — the only consumers were the admin guards
		//   and the (protected) layout, all of which are gone. SvelteKit ships its own
		//   `export interface Locals {}` fallback, so `event.locals` stays typed as `{}` without a
		//   declaration here. Do NOT re-add an empty `interface Locals {}` — eslint flags it.
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
