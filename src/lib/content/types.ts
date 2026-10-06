/**
 * Content model types — a verbatim port of `prd.md` §6.1.
 *
 * Field names are deliberately NOT adapted to this repo's existing conventions: the JSON-LD
 * generator (`prd.md` R-SEO-3), the admissions calendar (R-ADM-2) and the season logic in
 * `$lib/seasons` are all specced against these exact names, so renaming one here breaks a
 * contract that is written down in a document rather than in code.
 *
 * Lives under `src/lib/content/` rather than `prd.md` §15's `src/content/` — see
 * `docs/DECISIONS.md` #10 (matches this repo's `$lib` alias).
 *
 * Two conventions the types cannot express, so they are stated here:
 *
 * 1. `TODO(content): …` is the marker for *content the owner still has to supply*. It lives in
 *    a source comment where the gap is a missing section, and in the field value itself where a
 *    required string has no honest value (`Season.start`/`end`, `Stat.source`). `TODO(asset): …`
 *    marks a missing image/file. `scripts/content-check.ts` reads both.
 *    A known *defect* in already-published copy is NOT a TODO(content) — it is a `NOTE:` comment,
 *    because content-check's job is "what do we still need from the owner", not "what is wrong".
 * 2. Dates are ISO-8601. `Season.start`/`end` are always full `YYYY-MM-DD` (the season logic
 *    parses them); `Result.date` may carry reduced precision (`2026`, `2026-09`) when that is
 *    genuinely all the published copy states — reduced precision is the honest encoding of
 *    "we know the year", and is preferable to inventing a day.
 */

export type Locale = 'en' | 'zh';
export type Localized<T = string> = Record<Locale, T>;

export interface Media {
	src: string;
	alt: Localized;
	width: number;
	height: number;
	credit?: string;
}

export interface VimeoRef {
	id: string;
	title: Localized;
}

export interface Season {
	id: string; // 'ev-s03', 'aiec-c3'
	programSlug: string;
	label: Localized; // 'Season 03' / '第三季'
	start: string;
	end: string; // ISO dates
	cadence?: Localized; // 'Bi-weekly Saturdays'
	sessionTimes?: Localized[]; // '10:00–12:00', '13:00–15:00'
	pitchDay?: string; // ISO date or null
	registration: 'upcoming' | 'open' | 'waitlist' | 'closed';
	capacity?: number;
	tuition?: {
		display: 'inquire' | 'exact' | 'range';
		amount?: number;
		min?: number;
		max?: number;
		currency: 'CAD';
		includes: Localized[];
		excludes?: Localized[];
	};
}

export interface Program {
	slug: string;
	name: Localized;
	tagline: Localized;
	summary: Localized;
	category: 'engineering' | 'ai-business' | 'research' | 'stem' | 'seasonal' | 'community';
	grades: { min: number; max: number };
	format: 'in-person' | 'online' | 'hybrid';
	location?: Localized;
	hero: Media;
	gallery: Media[];
	videos: VimeoRef[];
	tracks?: { name: Localized; description: Localized; tags: string[] }[];
	roles?: { name: Localized; description: Localized }[];
	curriculum?: { phase: Localized; description: Localized }[];
	outcomes: { title: Localized; description: Localized }[];
	faq: FAQ[];
	mentorIds: string[];
	resultIds: string[];
	seasonIds: string[];
	model3d?: { src: string; poster: Media; hint: Localized }; // EV only
}

export interface Person {
	id: string;
	name: Localized;
	role: Localized;
	bio: Localized;
	photo: Media;
	kind: 'team' | 'instructor' | 'mentor';
	links?: { label: string; href: string }[];
}

export interface Result {
	id: string;
	date: string;
	programSlug?: string;
	type: 'award' | 'placement' | 'admission' | 'milestone';
	title: Localized;
	detail: Localized;
	evidence?: Media;
	consentVerified: boolean; // see §6.3
}

export interface Event {
	slug: string;
	title: Localized;
	description: Localized;
	start: string;
	end?: string;
	location: Localized;
	cover: Media;
	programSlug?: string;
	rsvpUrl?: string;
}

export interface Highlight {
	id: string;
	tag: Localized;
	title: Localized;
	caption?: Localized;
	media: Media;
	date?: string;
	programSlug?: string;
}

export interface Testimonial {
	id: string;
	quote: Localized;
	author: Localized;
	relation: 'parent' | 'student' | 'alumni';
	year: number;
	consentVerified: boolean;
}

export interface FAQ {
	q: Localized;
	a: Localized;
}

/** `source` is mandatory on purpose: R-CONTENT-3 says omit an unsourced stat, never render it. */
export interface Stat {
	key: string;
	value: number;
	suffix?: string;
	label: Localized;
	source: string;
}

export interface Partner {
	id: string;
	name: string;
	logo: Media;
	kind: 'venue' | 'partner' | 'competition';
	permissionVerified: boolean;
	href?: string;
}
