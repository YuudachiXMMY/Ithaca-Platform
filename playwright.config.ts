import { defineConfig, devices } from '@playwright/test';

// Playwright is the ONLY UI-level verification this repo has: the Vitest config in
// vite.config.ts runs with `environment: 'node'` and there is no jsdom or
// @testing-library/svelte, so every existing *.test.ts is a pure-logic test. Nothing
// before this config had ever asserted that a page renders, that a route returns 200,
// or that the accessibility tree is sane.
//
// Tests run against the real adapter-node production build (`node build/index.js`),
// not `vite dev` — the prerendered output is what ships, and prerender bugs are
// invisible in dev.
// NOT 3000. Port 3000 is squatted by all sorts of local daemons (OrbStack claims it on
// this machine), and combined with `reuseExistingServer` that silently points the whole
// suite at an unrelated process — every assertion then fails for the wrong reason, or
// worse, passes against the wrong app. Override with E2E_PORT if 4321 is taken too.
const PORT = Number(process.env.E2E_PORT ?? 4321);
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
	testDir: 'e2e',
	// Prerendered pages are static; nothing here mutates shared state, so full parallelism is safe.
	fullyParallel: true,
	// A stray `test.only` must not silently shrink the CI suite.
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],

	// NOTE: there is deliberately no `timeout` override here. Raising it was tried and was the
	// wrong answer: the two tests that blew the 30s default were the only two using
	// `waitUntil: 'networkidle'`, which on CI never arrives because `/api/popups/active` keeps
	// retrying against an unconfigured upstream. A bigger budget only made each failure
	// cost 3x more and pushed the whole job past ci.yml's `timeout-minutes: 20`. Those two tests
	// now stub the endpoint instead (see e2e/smoke.spec.ts); every other test has always fit
	// inside 30s on CI, so the default stays and a genuine hang still fails fast.

	use: {
		baseURL: BASE_URL,
		trace: 'on-first-retry',
		screenshot: 'only-on-failure'
	},

	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] }
		},
		{
			// The primary audience reaches this site from a WeChat share on a phone
			// (see the PRD's Users section), so mobile is a first-class target, not an extra.
			name: 'mobile-chrome',
			use: { ...devices['Pixel 7'] }
		}
	],

	webServer: {
		command: 'node build/index.js',
		url: BASE_URL,
		// Deliberately never reuse: if something else already holds the port, fail loudly
		// rather than run the entire suite against a stranger's server.
		reuseExistingServer: false,
		timeout: 120_000,
		env: {
			PORT: String(PORT),
			// The DATABASE_URL / BETTER_AUTH_* placeholders that used to live here are gone with
			// Prisma and Better Auth: no module needs env to load any more.
			// csrf.ts fails closed when ORIGIN is unset, which would 403 every POST.
			ORIGIN: BASE_URL
		}
	}
});
