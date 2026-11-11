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
	/**
	 * Which of the three boards this programme belongs to (2026-11 revamp plan §2) — the one
	 * journey the whole redesign exists to show: 01 Academic → 02 Projects → 03 Research.
	 *
	 * Declared rather than derived from `category`, even though the two correlate today, because
	 * they answer different questions and have already disagreed once. `category` says what the
	 * programme IS (`ithaca-dialogues` is `'research'`); `board` says where the site FILES it, and
	 * the 11-04 brochure moved Project Studio from the research board to the projects board without
	 * changing anything about the programme itself. Deriving would have made that editorial move a
	 * code change in the wrong file — and would still be wrong for `ai-investment-lab`, whose
	 * `category` is `'ai-business'` but which sits on the projects board next to an engineering
	 * programme.
	 *
	 * The academic board has no `Program` records: its five tracks are `/academics` pages, not
	 * programmes. So this union has two members, not three.
	 */
	board: 'projects' | 'research';
	grades: { min: number; max: number };
	/**
	 * Does this programme also take university students? (`AI Investment Lab`, `Project Studio`
	 * and the research board do; 2026-11 plan §4.)
	 *
	 * A separate boolean rather than `grades.max = 13`, which is what the shape invites. 13 is not
	 * a grade, so every consumer would need to know the convention to avoid rendering "Grades
	 * 11-13" to a parent, and `seasonDuration`-style arithmetic over the band would silently treat
	 * a four-year degree as one school year. The band stays a band; this says the programme does
	 * not end at the top of it. Renders as the "& University" the plan asks for on `/admissions`.
	 */
	includesUniversity?: boolean;
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

/**
 * A `/news` entry — the 2026-11 plan §4.3 board, which is the on-site sink for the media matrix
 * (interviews, campus visits, programme milestones, awards all get cut up and reused elsewhere;
 * this site carries the text-and-image version).
 *
 * Separate from `Event` below rather than an extension of it. `Event` models something with a
 * *venue and a time you can attend* — it has `start`/`end`/`location`/`rsvpUrl`, and three of
 * those are meaningless for an interview write-up or an award announcement. A news entry is a
 * published artefact with one date. Widening `Event` would have meant four more optional fields
 * and no way to tell a reader which combination is valid.
 *
 * `kind` is the four-way tag the plan specifies, and it drives the list filter, not just a label.
 */
export interface NewsItem {
	slug: string;
	kind: 'event' | 'interview' | 'program' | 'award';
	title: Localized;
	/** Publication date. Reduced precision is allowed here for the same reason as `Result.date`. */
	date: string;
	/**
	 * One or two paragraphs. An array so the renderer never has to split on a delimiter.
	 *
	 * `Localized<string[]>` — paragraphs PER LOCALE, not a localized string per paragraph. The
	 * other shape (`Localized[]`) would force the two languages to have the same number of
	 * paragraphs in the same order, which is a constraint on the translator that serves nobody:
	 * Chinese copy here is consistently denser and often wants one paragraph where English wants
	 * two.
	 */
	body: Localized<string[]>;
	/**
	 * §6.3, the same gate `Result` and `Testimonial` carry, and for the same reason: an entry here
	 * can name a third party — a guest, a school, a student team — and the site must not publish
	 * such a claim on the owner's behalf without someone having checked it.
	 *
	 * Required rather than optional (`consentVerified?: boolean`) on purpose. An optional flag
	 * defaults to "not set", every existing entry keeps rendering, and the gate only applies to
	 * whoever remembers it. Required forces the question once per entry, which is the whole point.
	 *
	 * `false` does not delete the entry — `PUBLISHED_NEWS` in `content/news.ts` is what the
	 * surfaces render, so the copy stays in the file, reviewable, until someone can say yes.
	 */
	consentVerified: boolean;
	cover?: Media;
	video?: VimeoRef;
	/** Back-link to the programme this entry came out of (plan §2 rule 6). */
	programSlug?: string;
	/** `Result.id` this entry is the story behind — Award entries and /success-stories cross-link. */
	resultIds?: string[];
	/** At most one entry should set this: it is what the homepage Featured slot renders. */
	featured?: boolean;
}

/**
 * One line of the "where past students went" roll-up on `/success-stories` (plan §3.5).
 *
 * `kind` exists because of the 11-02 decision that an OFFER a student did not take and a place a
 * student actually ATTENDS must be listed separately and labelled. Conflating them is the specific
 * misrepresentation that decision exists to prevent, so it is a required field with no default —
 * a record cannot be added without someone deciding which it is.
 *
 * `scholarship` is optional and `verified` is required and separate: the same decision says a
 * scholarship is shown only once checked, so an unverified figure is encodable but not renderable.
 */
export interface Destination {
	id: string;
	institution: Localized;
	/** Faculty or programme, when the published copy states one ("Financial Engineering"). */
	field?: Localized;
	kind: 'offer' | 'attending';
	year?: number;
	scholarship?: Localized;
	verified: boolean;
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
