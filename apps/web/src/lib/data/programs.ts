export type ProgramSpan = 'featured' | 'medium' | 'compact';

export interface ProgramCard {
	/** Card id — also the message-key suffix: programs_index_cards_<id>_{title,tag,description}. */
	readonly id: string;
	readonly href: string;
	/**
	 * `Program.slug` — the key into `$lib/content/programs` and `$lib/content/season-data`.
	 * `prd.md` R-PROG-2 wants each card to carry its current season's label, status and grade band,
	 * and those come from the records, not from here. Declared rather than sliced out of `href` so
	 * the two cannot drift silently.
	 */
	readonly slug: string;
	/**
	 * Source asset path relative to public/media/images (mirror of $lib/assets).
	 * The build-time `?enhanced` import is resolved in the page (enhanced-img needs
	 * a static specifier); this string documents the source and drives the id→image map.
	 * Omitted for photo-less cards (rendered with a deep base + brand hairline).
	 */
	readonly image?: string;
	readonly imageAlt: string;
	readonly span: ProgramSpan;
}

/**
 * The `/programs` index cards — the **projects board** (`02 PROJECTS`), in the order the 2026-11
 * plan §3.2 lists them.
 *
 * This is NOT "every programme", and the gap is deliberate. Ithaca Dialogue is a flagship but it
 * is filed on the RESEARCH board, so it appears on this page in `RESEARCH_EXIT_CARDS` below —
 * under a different heading, as an exit from the journey rather than a stop on it. A test that
 * asserted `PROGRAM_CARDS.length === PROGRAMS.length` would be asserting the taxonomy is flat.
 *
 * Engineering Foundations is LAST, and that is the whole of 10-20's "低年级机会型承接": reachable,
 * not promoted. It is also the only `compact` card without a `medium` peer, which is what keeps it
 * out of the grid's main positions.
 */
export const PROGRAM_CARDS: readonly ProgramCard[] = [
	{
		id: 'evTeam',
		href: '/programs/ev-team',
		slug: 'ev-team',
		image: 'programs/ev-team/EV26-5.jpg',
		imageAlt: 'EV Challenge electric vehicle',
		span: 'featured'
	},
	{
		id: 'aiCamp',
		href: '/programs/ai-entrepreneurship-bootcamp',
		slug: 'ai-entrepreneurship-bootcamp',
		image: 'programs/ai-bootcamp/AI-Entrep_81.jpg',
		imageAlt: 'Students at AI Entrepreneurship Bootcamp',
		span: 'medium'
	},
	{
		id: 'aiInvestmentLab',
		href: '/programs/ai-investment-lab',
		slug: 'ai-investment-lab',
		// TODO(asset): no Investment Lab photography yet — an AI Bootcamp field-trip frame stands in.
		image: 'programs/ai-bootcamp/AI-Entrep_05.jpg',
		imageAlt: 'Ithaca students working through a market analysis',
		span: 'medium'
	},
	{
		id: 'projectStudio',
		href: '/programs/project-studio',
		slug: 'project-studio',
		// TODO(asset): no Project Studio photography yet — an Innovation Day presentation frame stands in.
		image: 'programs/ai-bootcamp/AIEC2026/OTLFInnovationDay-2026-Presentations-188.jpg',
		imageAlt: 'An Ithaca student presenting their own project',
		span: 'compact'
	},
	{
		id: 'engineeringFoundations',
		href: '/programs/engineering-foundations',
		slug: 'engineering-foundations',
		// TODO(asset): no Engineering Foundations photography yet — an EV workshop frame stands in.
		image: 'programs/ev-team/EV26-3.jpg',
		imageAlt: 'Students at work in the Ithaca engineering workshop',
		span: 'compact'
	}
] as const;

/**
 * The two cards in `/programs`'s closing "research exit" band (plan §3.2 item 3) — where the
 * journey goes next, after a project.
 *
 * A separate list rather than two more `PROGRAM_CARDS` with a `board` field, because they are not
 * the same kind of card and the page does not render them the same way: these sit under their own
 * heading, outside the bento grid, and neither carries a season badge (Dialogue's dates are still
 * `TODO(content)`; Research Lab is not a `Program` at all). Giving them a `span` would imply they
 * belong in a grid they are deliberately outside of.
 *
 * `slug` is optional here for exactly one reason: **Research Lab has no `Program` record.** The
 * plan (§4.2 item 6) ships `/research` as a single page carrying Dialogue, Research Lab and the
 * QuizR co-creation band, and leaves splitting out `/research/research-lab` to a later phase. So
 * Research Lab's copy lives in Paraglide messages on that page, and this card links to its anchor.
 * Inventing a `Program` record for it would have put a seventh `/programs/<slug>` page into
 * `content-check.ts`'s must-ship-complete set for a page that does not exist.
 */
export interface ResearchExitCard {
	readonly id: string;
	readonly href: string;
	readonly slug?: string;
	readonly image?: string;
	readonly imageAlt: string;
}

export const RESEARCH_EXIT_CARDS: readonly ResearchExitCard[] = [
	{
		id: 'ithacaDialogue',
		href: '/programs/ithaca-dialogues',
		slug: 'ithaca-dialogues',
		image: 'programs/ai-interview/carmi-levy.png',
		imageAlt: 'An Ithaca Dialogue interview session'
	},
	{
		id: 'researchLab',
		href: '/research#research-lab',
		image: 'site/about-hero.jpg',
		imageAlt: 'Ithaca students at work on a research project'
	}
] as const;
