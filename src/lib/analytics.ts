/**
 * GA4 custom events — `prd.md` R-SEO-5, `docs/DECISIONS.md` Q10 (GA4, not Plausible).
 *
 * Until now the site tracked pageviews and nothing else, which made the PRD's central hypothesis —
 * that a native-language admissions path converts Chinese-speaking parents — unmeasurable. These
 * six events are the measurement.
 *
 * ## Three properties this module has to hold, and how
 *
 * **1. It never throws.** `src/hooks.server.ts` defers `gtag.js` to `requestIdleCallback`, so a
 * visitor can click before the script exists. The inline stub in that snippet queues into
 * `dataLayer` for us — but only when `PUBLIC_GA_TRACKING_ID` is set, and it is not set in dev, in
 * the e2e build, or on a preview origin. So `track()` treats a missing `gtag` as normal: it buffers
 * up to `QUEUE_LIMIT` events and flushes them the next time an event is sent with `gtag` present.
 * Bounded, with no timer and no listener — an unbounded queue on a page nobody instrumented is a
 * slow leak, and dropping the oldest is the right trade for analytics.
 *
 * **2. It is import-safe during SSR and prerender.** Nothing touches `window` at module scope;
 * every read happens inside `track()` behind a `typeof window` guard. Every public page here is
 * prerendered, so a module-scope `window` reference would break the build, not just the browser.
 *
 * **3. It carries no PII.** `prd.md` R-BE-5: no analytics on form field values. Two mechanisms,
 * because one is a convention and the other is enforcement:
 *
 *   - the exported `track*` functions take typed, closed parameter shapes — there is no overload
 *     that accepts a form object;
 *   - `track()` then filters every payload through the per-event allowlist in `EVENT_PARAMS`, so
 *     even a future caller that spreads something in cannot widen what leaves the page.
 *
 * `analytics.test.ts` feeds a payload carrying a name, an email, a phone number and a message and
 * asserts none of them reaches `dataLayer`. That test is the evidence, not this comment.
 */

/** The six events `prd.md` R-SEO-5 names. */
export type AnalyticsEventName =
	| 'inquiry_submit'
	| 'booking_click'
	| 'wechat_qr_view'
	| 'phone_tap'
	| 'program_cta_click'
	| 'locale_switch';

export type AnalyticsParams = Record<string, string | number | boolean>;

/**
 * The ONLY parameter keys that may leave the page, per event.
 *
 * Read this as the privacy contract. Nothing here is free text a visitor typed: every value is a
 * programme slug, a call-site identifier, a locale tag, a count, or a boolean.
 */
const EVENT_PARAMS = {
	// `program` is a slug from src/lib/content/programs.ts; `has_grade` is whether the optional
	// grade select was answered, never which grade. No name, email, phone, message or source.
	inquiry_submit: ['form', 'locale', 'program', 'program_count', 'has_grade', 'topic'],
	booking_click: ['location', 'locale'],
	wechat_qr_view: ['location', 'locale'],
	phone_tap: ['location', 'locale'],
	program_cta_click: ['program', 'location', 'locale'],
	// `path` is the locale-stripped route, which is exactly what a pageview already records.
	locale_switch: ['from', 'to', 'path']
} as const satisfies Record<AnalyticsEventName, readonly string[]>;

/** Where an event was fired from. A closed set so the GA report groups instead of sprawling. */
export type EventLocation =
	| 'footer'
	| 'home_contact'
	| 'contact_page'
	| 'contact_form_fallback'
	| 'programs_index'
	| 'home_showcase'
	| 'program_page'
	| 'admissions_tuition'
	| 'admissions_booking'
	// `/results` — the "read about the programme that produced this" link on a timeline entry.
	// A new LOCATION, not a seventh event: the question it answers ("does published proof send
	// anyone to a programme page?") is the same question `program_cta_click` already measures
	// everywhere else, and splitting it into its own event would put the same intent in two
	// GA reports that then have to be added up by hand.
	| 'results_timeline';

type Locale = 'en' | 'zh';

/**
 * Events fired before `gtag` existed. Bounded: past the limit the OLDEST is dropped, because a
 * page that never loads GA would otherwise grow this array for as long as the tab is open.
 */
const QUEUE_LIMIT = 20;
const pending: { name: AnalyticsEventName; params: AnalyticsParams }[] = [];

type Gtag = (command: 'event', name: string, params: AnalyticsParams) => void;

function gtag(): Gtag | null {
	if (typeof window === 'undefined') return null;
	const candidate = (window as unknown as { gtag?: unknown }).gtag;
	return typeof candidate === 'function' ? (candidate as Gtag) : null;
}

/** Strip every key the event's allowlist does not name, and every non-scalar value. */
function allowed(name: AnalyticsEventName, params: AnalyticsParams): AnalyticsParams {
	const keys: readonly string[] = EVENT_PARAMS[name];
	const out: AnalyticsParams = {};
	for (const key of keys) {
		const value = params[key];
		if (value === undefined || value === null) continue;
		if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
			out[key] = value;
		}
	}
	return out;
}

/**
 * Send one event. Safe to call anywhere, at any time, in any environment.
 *
 * Exported for the tests and for a future event; prefer the named helpers below at call sites, so
 * the payload shape lives here rather than in a component.
 */
export function track(name: AnalyticsEventName, params: AnalyticsParams = {}): void {
	if (typeof window === 'undefined') return;
	const payload = allowed(name, params);

	const send = gtag();
	if (!send) {
		if (pending.length >= QUEUE_LIMIT) pending.shift();
		pending.push({ name, params: payload });
		return;
	}

	try {
		while (pending.length > 0) {
			const queued = pending.shift();
			if (queued) send('event', queued.name, queued.params);
		}
		send('event', name, payload);
	} catch {
		// Analytics must never break the interaction it is measuring. A gtag that throws is a
		// third-party fault; the click still has to work.
	}
}

/** Test-only: drop the buffer so one case cannot leak events into the next. */
export function resetAnalyticsQueue(): void {
	pending.length = 0;
}

/**
 * The enquiry form was submitted successfully — the conversion the PRD's hypothesis is about.
 *
 * Takes ONLY the qualification facts `prd.md` allows: which programme was ticked, how many were,
 * whether a grade was given (not which), the reading locale and the topic from `?topic=`. The
 * caller cannot pass the name, email, phone, message or "how did you hear about us" fields.
 */
export function trackInquirySubmit(input: {
	form: 'contact' | 'admissions';
	locale: Locale;
	/** First selected programme slug, or 'none'. */
	program: string;
	programCount: number;
	hasGrade: boolean;
	topic?: string;
}): void {
	track('inquiry_submit', {
		form: input.form,
		locale: input.locale,
		program: input.program,
		program_count: input.programCount,
		has_grade: input.hasGrade,
		...(input.topic ? { topic: input.topic } : {})
	});
}

/** A click on the path to booking a consultation (`prd.md` R-ADM-6). */
export function trackBookingClick(input: {
	location: Extract<EventLocation, 'admissions_tuition' | 'admissions_booking'>;
	locale: Locale;
}): void {
	track('booking_click', { location: input.location, locale: input.locale });
}

/**
 * The WeChat QR actually became visible — not that the page containing it loaded.
 *
 * Fired from an IntersectionObserver at the call site; a "view" that counts an element scrolled
 * past the fold is the number that makes a WeChat-first funnel look healthier than it is.
 */
export function trackWechatQrView(input: { location: EventLocation; locale: Locale }): void {
	track('wechat_qr_view', { location: input.location, locale: input.locale });
}

/** A `tel:` link was activated. */
export function trackPhoneTap(input: { location: EventLocation; locale: Locale }): void {
	track('phone_tap', { location: input.location, locale: input.locale });
}

/** A programme call-to-action was clicked. `program` is the slug, never the display name. */
export function trackProgramCtaClick(input: {
	program: string;
	location: EventLocation;
	locale: Locale;
}): void {
	track('program_cta_click', {
		program: input.program,
		location: input.location,
		locale: input.locale
	});
}

/**
 * The EN/中文 switch was used — the direct measure of whether the bilingual path is load-bearing.
 *
 * `path` is the locale-stripped route, i.e. the same information the pageview already carries.
 */
export function trackLocaleSwitch(input: { from: Locale; to: Locale; path: string }): void {
	track('locale_switch', { from: input.from, to: input.to, path: input.path });
}
